import { tool } from "ai";
import { z } from "zod";
import { WebClient } from "@slack/web-api";
import { exchangeTokenForProvider } from "@/lib/auth0";

const listChannelsParams = z.object({
  limit: z.number().default(20).describe("Maximum number of channels to return"),
});
const postMessageParams = z.object({
  channel: z.string().describe("Channel ID or name"),
  message: z.string().describe("Message text to post"),
});

export function getSlackTools(auth0Token: string) {
  return {
    listChannels: tool({
      description: "List the user's Slack channels",
      inputSchema: listChannelsParams,
      execute: async ({ limit }: z.infer<typeof listChannelsParams>) => {
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
      inputSchema: postMessageParams,
      execute: async ({ channel, message }: z.infer<typeof postMessageParams>) => {
        const token = await exchangeTokenForProvider(auth0Token, "slack-oauth2");
        const slack = new WebClient(token);
        const result = await slack.chat.postMessage({ channel, text: message });
        return { success: result.ok, timestamp: result.ts, channel: result.channel };
      },
    }),
  };
}