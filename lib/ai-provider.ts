import { createOpenAI } from "@ai-sdk/openai";
import type { FetchFunction } from "@ai-sdk/provider-utils";
import type { LanguageModel } from "ai";

export type AiProviderId = "deepseek" | "groq";

export const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/**
 * Models offered in the picker when DEEPSEEK_MODELS is not set. The default
 * model is always included, so a custom DEEPSEEK_MODEL still shows up.
 */
const DEEPSEEK_CATALOG = ["deepseek-v4-flash", "deepseek-v4-pro"];
const GROQ_CATALOG = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

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

export function defaultDeepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL;
}

export function defaultGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || GROQ_DEFAULT_MODEL;
}

export function resolveAiProvider(): AiProviderId {
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (preferred === "groq" && hasKey(process.env.GROQ_API_KEY)) {
    return "groq";
  }
  if (preferred === "deepseek" && hasKey(process.env.DEEPSEEK_API_KEY)) {
    return "deepseek";
  }
  if (hasKey(process.env.DEEPSEEK_API_KEY)) {
    return "deepseek";
  }
  if (hasKey(process.env.GROQ_API_KEY)) {
    return "groq";
  }
  throw new Error("No AI provider configured. Set DEEPSEEK_API_KEY or GROQ_API_KEY.");
}

export function getAiProviderConfig(): AiProviderConfig {
  const provider = resolveAiProvider();
  const modelId = provider === "groq" ? defaultGroqModel() : defaultDeepSeekModel();
  const providerLabel = provider === "groq" ? "Groq" : "DeepSeek";

  return {
    provider,
    modelId,
    displayName: `${providerLabel} (${modelId})`,
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
    "llama-3.3-70b-versatile": "Llama 3.3 70B",
    "llama-3.1-8b-instant": "Llama 3.1 8B",
    "mixtral-8x7b-32768": "Mixtral 8x7B",
  };
  return known[modelId] ?? modelId;
}

export function modelOptionId(provider: AiProviderId, modelId: string): string {
  return `${provider}:${modelId}`;
}

/**
 * Models the server can actually serve right now based on configured keys.
 * Offers DeepSeek and/or Groq models with the active default placed first.
 */
export function listAvailableModels(): AiModelOption[] {
  const hasDeepSeek = hasKey(process.env.DEEPSEEK_API_KEY);
  const hasGroq = hasKey(process.env.GROQ_API_KEY);

  if (!hasDeepSeek && !hasGroq) return [];

  const options: AiModelOption[] = [];
  const primary = resolveAiProvider();

  const addDeepSeek = () => {
    if (!hasDeepSeek) return;
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
  };

  const addGroq = () => {
    if (!hasGroq) return;
    const add = (modelId: string) => {
      const id = modelOptionId("groq", modelId);
      if (options.some((option) => option.id === id)) return;
      options.push({
        id,
        provider: "groq",
        modelId,
        label: prettyModelName(modelId),
        providerLabel: "Groq",
      });
    };

    add(defaultGroqModel());
    const configured = envList("GROQ_MODELS");
    (configured.length > 0 ? configured : GROQ_CATALOG).forEach(add);
  };

  if (primary === "groq") {
    addGroq();
    addDeepSeek();
  } else {
    addDeepSeek();
    addGroq();
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

export function createDeepSeekModel(modelId: string = defaultDeepSeekModel()): LanguageModel {
  const deepseek = createOpenAI({
    baseURL: DEEPSEEK_BASE_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
    fetch: createDeepSeekFetch(),
  });
  return deepseek.chat(modelId);
}

export function createGroqModel(modelId: string = defaultGroqModel()): LanguageModel {
  const groq = createOpenAI({
    baseURL: GROQ_BASE_URL,
    apiKey: process.env.GROQ_API_KEY,
  });
  return groq.chat(modelId);
}

/**
 * Wraps a primary model with a fallback model. If the primary model fails
 * when initiating the stream or generation (e.g. out of credits, quota exceeded,
 * rate limit, or service error), it automatically delegates to the fallback model.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createFallbackModel(primary: any, fallback: any): LanguageModel {
  return {
    ...primary,
    specificationVersion: "v3",
    modelId: primary.modelId,
    provider: primary.provider,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doStream: async (options: any) => {
      try {
        return await primary.doStream(options);
      } catch (error) {
        console.warn(
          `[ai-provider] Primary model (${primary.modelId}) failed (${
            error instanceof Error ? error.message : String(error)
          }). Falling back to Groq (${fallback.modelId})...`
        );
        return await fallback.doStream(options);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doGenerate: async (options: any) => {
      try {
        return await primary.doGenerate(options);
      } catch (error) {
        console.warn(
          `[ai-provider] Primary model (${primary.modelId}) failed (${
            error instanceof Error ? error.message : String(error)
          }). Falling back to Groq (${fallback.modelId})...`
        );
        return await fallback.doGenerate(options);
      }
    },
  } as LanguageModel;
}

export function getChatModel(config: AiProviderConfig = getAiProviderConfig()): LanguageModel {
  if (config.provider === "groq") {
    return createGroqModel(config.modelId);
  }

  const primaryDeepseek = createDeepSeekModel(config.modelId);

  // If Groq is configured, provide automatic fallback for DeepSeek
  if (hasKey(process.env.GROQ_API_KEY)) {
    const fallbackGroq = createGroqModel();
    return createFallbackModel(primaryDeepseek, fallbackGroq);
  }

  return primaryDeepseek;
}
