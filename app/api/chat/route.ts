import { auth0 } from "@/lib/auth0";
import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages } from "ai";
import { getGithubTools } from "@/agent/tools/github";
import { getGmailTools } from "@/agent/tools/gmail";
import { getSlackTools } from "@/agent/tools/slack";

const groq = createGroq();

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages } = await req.json();

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are Anzen, an AI Chief of Staff. You help users manage their GitHub issues, emails, and Slack messages securely using Auth0 Token Vault.

Current user: ${session.user.name} (${session.user.email})

You have access to tools to list GitHub issues, read emails, and check Slack channels. Use them when the user asks about their accounts.`,
    messages: await convertToModelMessages(messages),
    tools: {
      ...getGithubTools(),
      ...getGmailTools(),
      ...getSlackTools(),
    },
    maxSteps: 5,
  });

  return result.toUIMessageStreamResponse();
}