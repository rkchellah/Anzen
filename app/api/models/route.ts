import { auth0 } from "@/lib/auth0";
import {
  getAiProviderConfig,
  listAvailableModels,
  modelOptionId,
} from "@/lib/ai-provider";

/** Models the user may pick from in the composer, plus the current default. */
export async function GET() {
  const session = await auth0.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const models = listAvailableModels();

  let defaultModelId: string | null = null;
  try {
    const config = getAiProviderConfig();
    defaultModelId = modelOptionId(config.provider, config.modelId);
  } catch {
    // No provider configured — the picker renders as unavailable.
  }

  return Response.json({
    models: models.map(({ id, label, providerLabel, modelId }) => ({
      id,
      label,
      providerLabel,
      modelId,
    })),
    defaultModelId,
  });
}
