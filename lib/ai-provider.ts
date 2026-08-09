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

/** One selectable entry in the chat model picker. */
export type AiModelOption = {
  /** Stable `provider:modelId` key sent by the client. */
  id: string;
  provider: AiProviderId;
  modelId: string;
  label: string;
  providerLabel: string;
};

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function prettyModelName(modelId: string): string {
  const known: Record<string, string> = {
    "deepseek-v4-flash": "DeepSeek V4 Flash",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-reasoner": "DeepSeek Reasoner",
    "llama-3.3-70b-versatile": "Llama 3.3 70B",
  };
  return known[modelId] ?? modelId;
}

export function modelOptionId(provider: AiProviderId, modelId: string): string {
  return `${provider}:${modelId}`;
}

/**
 * Models the server can actually serve right now — i.e. those whose provider
 * key is configured. Extra ids can be offered via GROQ_MODELS / DEEPSEEK_MODELS
 * (comma-separated).
 */
export function listAvailableModels(): AiModelOption[] {
  const options: AiModelOption[] = [];

  const add = (provider: AiProviderId, modelId: string) => {
    const id = modelOptionId(provider, modelId);
    if (options.some((option) => option.id === id)) return;
    options.push({
      id,
      provider,
      modelId,
      label: prettyModelName(modelId),
      providerLabel: provider === "groq" ? "Groq" : "DeepSeek",
    });
  };

  if (hasKey(process.env.DEEPSEEK_API_KEY)) {
    add("deepseek", process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL);
    envList("DEEPSEEK_MODELS").forEach((modelId) => add("deepseek", modelId));
  }

  if (hasKey(process.env.GROQ_API_KEY)) {
    add("groq", GROQ_MODEL);
    envList("GROQ_MODELS").forEach((modelId) => add("groq", modelId));
  }

  return options;
}

/**
 * Turn a requested model id into a usable config. Unknown or unavailable ids
 * fall back to the configured default rather than failing the request.
 */
export function resolveRequestedModel(requestedId?: string | null): AiProviderConfig {
  const fallback = getAiProviderConfig();
  if (!requestedId) return fallback;

  const match = listAvailableModels().find((option) => option.id === requestedId);
  if (!match) return fallback;

  return {
    provider: match.provider,
    modelId: match.modelId,
    displayName: `${match.providerLabel} (${match.modelId})`,
  };
}

export function getChatModel(config: AiProviderConfig = getAiProviderConfig()): LanguageModel {
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
