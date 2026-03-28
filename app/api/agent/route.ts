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
    system: `You are Anzen, an AI Chief of Staff. You help users manage their GitHub issues, emails, and Slack messages securely.

    You have access to the user's GitHub, Gmail, and Slack accounts via Token Vault. When asked about issues, emails, or messages, use the available tools to fetch real data.

    Always confirm with the user before taking any destructive action like closing issues or sending emails.

    Current user: ${session.user.name} (${session.user.email})`,
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
