import { createOpenAI } from "@ai-sdk/openai";
import type { FetchFunction } from "@ai-sdk/provider-utils";
import type { LanguageModel } from "ai";

export type AiProviderId = "deepseek";

export const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/**
 * Models offered in the picker when DEEPSEEK_MODELS is not set. The default
 * model is always included, so a custom DEEPSEEK_MODEL still shows up.
 */
const DEEPSEEK_CATALOG = ["deepseek-v4-flash", "deepseek-v4-pro"];

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

export function resolveAiProvider(): AiProviderId {
  if (!hasKey(process.env.DEEPSEEK_API_KEY)) {
    throw new Error("No AI provider configured. Set DEEPSEEK_API_KEY.");
  }
  return "deepseek";
}

export function defaultDeepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL;
}

export function getAiProviderConfig(): AiProviderConfig {
  const provider = resolveAiProvider();
  const modelId = defaultDeepSeekModel();

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
    "deepseek-v4-pro": "DeepSeek V4 Pro",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-reasoner": "DeepSeek Reasoner",
  };
  return known[modelId] ?? modelId;
}

export function modelOptionId(provider: AiProviderId, modelId: string): string {
  return `${provider}:${modelId}`;
}

/**
 * Models the server can actually serve right now. The list is the built-in
 * DeepSeek catalog unless DEEPSEEK_MODELS (comma-separated) overrides it; the
 * configured default is always first.
 */
export function listAvailableModels(): AiModelOption[] {
  if (!hasKey(process.env.DEEPSEEK_API_KEY)) return [];

  const options: AiModelOption[] = [];

  const add = (modelId: string) => {
    const id = modelOptionId("deepseek", modelId);
    if (options.some((option) => option.id === id)) return;
    options.push({
      id,
      provider: "deepseek",
      modelId,
      label: prettyModelName(modelId),
      providerLabel: "DeepSeek",
    });
  };

  add(defaultDeepSeekModel());
  const configured = envList("DEEPSEEK_MODELS");
  (configured.length > 0 ? configured : DEEPSEEK_CATALOG).forEach(add);

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
  const deepseek = createOpenAI({
    baseURL: DEEPSEEK_BASE_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
    fetch: createDeepSeekFetch(),
  });

  // DeepSeek is OpenAI-compatible on /chat/completions only — not /responses.
  return deepseek.chat(config.modelId);
}
