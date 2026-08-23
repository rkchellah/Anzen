import type { AiProviderId } from "@/lib/ai-provider";

function errorMessageText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

export function chatStreamErrorMessage(
  error: unknown,
  provider: AiProviderId
): string {
  console.error(`[chat] ${provider} stream error:`, error);

  const message = errorMessageText(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests")
  ) {
    return "The AI provider rate limit was reached. Please wait a few minutes and try again.";
  }

  if (
    message.includes("tool_use_failed") ||
    message.includes("Failed to call a function")
  ) {
    return "The assistant hit a tool-calling error from the model provider. Please try again or rephrase your request.";
  }

  if (lower.includes("api key") || lower.includes("authentication")) {
    return "The AI provider rejected the request (API key issue). Check DEEPSEEK_API_KEY in your environment.";
  }

  return "Something went wrong while generating a response. Please try again.";
}
