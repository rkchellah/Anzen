import { tool, jsonSchema } from "ai";
import { WebClient } from "@slack/web-api";
import { exchangeTokenForProvider } from "@/lib/auth0";

export function getSlackTools(auth0Token: string) {
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
        const token = await exchangeTokenForProvider(auth0Token, "slack-oauth2");
        const slack = new WebClient(token);
        const result = await slack.conversations.list({ types: "public_channel,private_channel", limit });
        return {
          channels: (result.channels ?? []).map((c) => ({
            id: c.id, name: c.name, isPrivate: c.is_private, memberCount: c.num_members,
          })),
        };
      },
    }),

    postMessage: tool({
      description: "Post a message to a Slack channel",
      inputSchema: jsonSchema<{ channel: string; message: string }>({
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID or name" },
          message: { type: "string", description: "Message text to post" },
        },
        required: ["channel", "message"],
      }),
      execute: async ({ channel, message }) => {
        const token = await exchangeTokenForProvider(auth0Token, "slack-oauth2");
        const slack = new WebClient(token);
        const result = await slack.chat.postMessage({ channel, text: message });
        return { success: result.ok, timestamp: result.ts, channel: result.channel };
      },
    }),
  };
}
