import { tool } from "ai";
import { z } from "zod";
import { WebClient } from "@slack/web-api";
import { getTokenForProvider } from "@/lib/auth0";

export function getSlackTools() {
  return {
    listChannels: tool({
      description: "List the user's Slack channels",
      parameters: z.object({
        limit: z.number().default(20).describe("Maximum number of channels to return"),
      }),
      execute: async (params) => {
        const limit = params?.limit ?? 20;
        const token = await getTokenForProvider("slack-oauth2");
        const slack = new WebClient(token);

        const result = await slack.conversations.list({
          types: "public_channel,private_channel",
          limit,
        });

        return {
          channels: (result.channels ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            isPrivate: c.is_private,
            memberCount: c.num_members,
          })),
        };
      },
    }),

    postMessage: tool({
      description: "Post a message to a Slack channel",
      parameters: z.object({
        channel: z.string().describe("Channel ID or name"),
        message: z.string().describe("Message text to post"),
      }),
      execute: async (params) => {
        const channel = params?.channel ?? "";
        const message = params?.message ?? "";
        const token = await getTokenForProvider("slack-oauth2");
        const slack = new WebClient(token);

        const result = await slack.chat.postMessage({
          channel,
          text: message,
        });

        return {
          success: result.ok,
          timestamp: result.ts,
          channel: result.channel,
        };
      },
    }),
  };
}