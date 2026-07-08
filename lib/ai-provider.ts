import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { FetchFunction } from "@ai-sdk/provider-utils";
import type { LanguageModel } from "ai";

export type AiProviderId = "groq" | "deepseek";

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** DeepSeek V4 defaults to thinking mode; disable for faster tool-calling chat. */
export function createDeepSeekFetch(): FetchFunction {
  return async (input, init) => {
    if (init?.body && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body) as Record<string, unknown>;
        if (body.thinking === undefined) {
          body.thinking = { type: "disabled" };
        }
        init = { ...init, body: JSON.stringify(body) };
      } catch {
        // Leave body unchanged if it is not JSON.
      }
    }
    return fetch(input, init);
  };
}

export type AiProviderConfig = {
  provider: AiProviderId;
  modelId: string;
  displayName: string;
};

function hasKey(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

/** Resolve provider from AI_PROVIDER or from whichever API key is set. */
export function resolveAiProvider(): AiProviderId {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "deepseek") {
    return explicit;
  }

  const hasGroq = hasKey(process.env.GROQ_API_KEY);
  const hasDeepseek = hasKey(process.env.DEEPSEEK_API_KEY);

  if (hasDeepseek && !hasGroq) return "deepseek";
  if (hasGroq && !hasDeepseek) return "groq";
  if (hasDeepseek && hasGroq) return "deepseek";

  throw new Error(
    "No AI provider configured. Set GROQ_API_KEY and/or DEEPSEEK_API_KEY (optional AI_PROVIDER=groq|deepseek)."
  );
}

export function getAiProviderConfig(): AiProviderConfig {
  const provider = resolveAiProvider();

  if (provider === "groq") {
    if (!hasKey(process.env.GROQ_API_KEY)) {
      throw new Error("AI_PROVIDER=groq but GROQ_API_KEY is not set.");
    }
    return {
      provider,
      modelId: GROQ_MODEL,
      displayName: "Groq (LLaMA 3.3 70B)",
    };
  }

  if (!hasKey(process.env.DEEPSEEK_API_KEY)) {
    throw new Error("AI_PROVIDER=deepseek but DEEPSEEK_API_KEY is not set.");
  }

  const modelId =
    process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL;

  return {
    provider,
    modelId,
    displayName: `DeepSeek (${modelId})`,
  };
}

export function getChatModel(): LanguageModel {
  const config = getAiProviderConfig();

  if (config.provider === "groq") {
    return createGroq({ apiKey: process.env.GROQ_API_KEY })(config.modelId);
  }

  const deepseek = createOpenAI({
    baseURL: DEEPSEEK_BASE_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
    fetch: createDeepSeekFetch(),
  });

  // DeepSeek is OpenAI-compatible on /chat/completions only — not /responses.
  return deepseek.chat(config.modelId);
}
