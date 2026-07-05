import { tool, jsonSchema } from "ai";
import { WebClient } from "@slack/web-api";
import { exchangeTokenForProvider } from "@/lib/auth0";
import { runAuditedWrite } from "@/lib/audit-log";
import { throwToolError } from "@/lib/tool-errors";
import { assertWriteAllowed } from "@/lib/tool-permissions";
import { assertWriteMatchesLatestUserIntent } from "@/lib/write-execute-guard";
import { wrapUntrustedExternalContent } from "@/agent/wrap-untrusted-content";

const SLACK_PROVIDER = "sign-in-with-slack" as const;

export function getSlackTools(auth0Token: string, userId: string) {
  return {
    listChannels: tool({
      description: "List the user's Slack channels",
      inputSchema: jsonSchema<{ limit: number }>({
        type: "object",
        properties: {
          limit: { type: "number", default: 20, description: "Maximum number of channels to return" },
        },
      }),
      execute: async ({ limit }) => {
        try {
          const token = await exchangeTokenForProvider(auth0Token, SLACK_PROVIDER);
          const slack = new WebClient(token);
          const result = await slack.conversations.list({ types: "public_channel,private_channel", limit });
          return wrapUntrustedExternalContent({
            channels: (result.channels ?? []).map((c) => ({
              id: c.id, name: c.name, isPrivate: c.is_private, memberCount: c.num_members,
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
          assertWriteMatchesLatestUserIntent("postMessage", { channel, message }, messages);
          return await runAuditedWrite(
            userId,
            "postMessage",
            { channel, message },
            async () => {
              await assertWriteAllowed(userId, "slack");
              const token = await exchangeTokenForProvider(auth0Token, SLACK_PROVIDER);
              const slack = new WebClient(token);
              const result = await slack.chat.postMessage({ channel, text: message });
              return {
                success: result.ok,
                message: `Message posted to ${channel}`,
                timestamp: result.ts,
                channel: result.channel,
              };
            }
          );
        } catch (error) {
          throwToolError("postMessage", error, SLACK_PROVIDER);
        }
      },
    }),
  };
}
