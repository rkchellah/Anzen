import { auth0 } from "@/lib/auth0";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getGithubTools } from "@/agent/tools/github";
import { getGmailTools } from "@/agent/tools/gmail";
import { getSlackTools } from "@/agent/tools/slack";

export async function POST(req: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: `You are Anzen, an AI Chief of Staff. You help users manage their GitHub issues, emails, and Slack messages securely using Auth0 Token Vault.

Current user: ${session.user.name} (${session.user.email})

You have access to tools to list GitHub issues, read emails, and check Slack channels. Use them when the user asks about their accounts.`,
    messages,
    tools: {
      ...getGithubTools(),
      ...getGmailTools(),
      ...getSlackTools(),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
