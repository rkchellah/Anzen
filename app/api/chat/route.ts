import { auth0 } from "@/lib/auth0";
import { createGroq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { getGithubTools } from "@/agent/tools/github";
import { getGmailTools } from "@/agent/tools/gmail";
import { getSlackTools } from "@/agent/tools/slack";

const groq = createGroq();

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // Get Auth0 token here while we have request context.
  // Tools receive this token and use it to exchange for provider tokens.
  const tokenResult = await auth0.getAccessToken();
  const auth0Token = tokenResult?.token;

  if (!auth0Token) {
    return new Response("Could not get access token", { status: 401 });
  }

  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are Anzen, an AI agent that acts on behalf of the user using Auth0 Token Vault. You help users manage their GitHub issues, emails, and Slack messages — securely, without ever storing their credentials.

Current user: ${session.user.name} (${session.user.email})

Use your tools when the user asks about their accounts. Be concise and helpful.`,
    messages: modelMessages,
    tools: {
      ...getGithubTools(auth0Token),
      ...getGmailTools(auth0Token),
      ...getSlackTools(auth0Token),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}