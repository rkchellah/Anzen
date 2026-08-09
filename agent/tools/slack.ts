import { tool, jsonSchema } from "ai";
import { WebClient } from "@slack/web-api";
import { exchangeTokenForProvider } from "@/lib/auth0";
import { runAuditedWrite } from "@/lib/audit-log";
import { throwToolError, ToolUserError } from "@/lib/tool-errors";
import { assertWriteAllowed } from "@/lib/tool-permissions";
import { assertWriteMatchesLatestUserIntent } from "@/lib/write-execute-guard";
import { wrapUntrustedExternalContent } from "@/agent/wrap-untrusted-content";
import { clampCount, requireString } from "@/agent/tool-input";

const SLACK_PROVIDER = "sign-in-with-slack" as const;

const DEFAULT_CHANNEL_LIMIT = 20;
const MAX_CHANNEL_LIMIT = 200;
/** Slack truncates messages past 40k characters. */
const MAX_MESSAGE_LENGTH = 40_000;

export function getSlackTools(auth0Token: string, userId: string) {
  return {
    listChannels: tool({
      description: "List the user's Slack channels",
      inputSchema: jsonSchema<{ limit: number }>({
        type: "object",
        properties: {
          limit: {
            type: "number",
            default: DEFAULT_CHANNEL_LIMIT,
            description: `Maximum number of channels to return (1-${MAX_CHANNEL_LIMIT})`,
          },
        },
      }),
      execute: async ({ limit }) => {
        try {
          const count = clampCount(
            limit,
            DEFAULT_CHANNEL_LIMIT,
            1,
            MAX_CHANNEL_LIMIT
          );
          const token = await exchangeTokenForProvider(auth0Token, SLACK_PROVIDER);
          const slack = new WebClient(token);
          const result = await slack.conversations.list({
            types: "public_channel,private_channel",
            limit: count,
          });
          return wrapUntrustedExternalContent({
            channels: (result.channels ?? []).map((channel) => ({
              id: channel.id,
              name: channel.name,
              isPrivate: channel.is_private,
              memberCount: channel.num_members,
            })),
          });
        } catch (error) {
          throwToolError("listChannels", error, SLACK_PROVIDER);
        }
      },
    }),

    postMessage: tool({
      description: "Post a message to a Slack channel",
      needsApproval: true,
      inputSchema: jsonSchema<{ channel: string; message: string }>({
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID or name" },
          message: { type: "string", description: "Message text to post" },
        },
        required: ["channel", "message"],
      }),
      execute: async ({ channel, message }, { messages }) => {
        try {
          const target = requireString("postMessage", "channel", channel, 200);
          const text = requireString(
            "postMessage",
            "message",
            message,
            MAX_MESSAGE_LENGTH
          );
          const args = { channel: target, message: text };

          assertWriteMatchesLatestUserIntent("postMessage", args, messages);

          return await runAuditedWrite(userId, "postMessage", args, async () => {
            await assertWriteAllowed(userId, "slack");
            const token = await exchangeTokenForProvider(auth0Token, SLACK_PROVIDER);
            const slack = new WebClient(token);
            const result = await slack.chat.postMessage({
              channel: target,
              text,
            });

            // Slack can answer 200 with ok:false. Without this the audit log
            // would record a success and the model would tell the user it sent.
            if (!result.ok) {
              throw new ToolUserError({
                category: "unknown",
                connectionKey: "slack",
                userMessage: `Slack refused to post to ${target}. Check that the channel exists and Anzen has been added to it.`,
              });
            }

            return {
              success: true,
              message: `Message posted to ${target}`,
              timestamp: result.ts,
              channel: result.channel,
            };
          });
        } catch (error) {
          throwToolError("postMessage", error, SLACK_PROVIDER);
        }
      },
    }),
  };
}
