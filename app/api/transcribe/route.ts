import { auth0 } from "@/lib/auth0";
import { apiError, badRequest, unauthorized } from "@/lib/api-response";
import { fetchWithTimeout, HttpNetworkError, HttpTimeoutError } from "@/lib/http";
import { checkChatRateLimit } from "@/lib/rate-limit";

/** Groq Whisper caps uploads at 25 MB; reject earlier so we don't ship the bytes. */
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const TRANSCRIBE_TIMEOUT_MS = 30_000;

/**
 * Voice → text for shadcn-chatbot-kit MessageInput / useAudioRecording.
 * Uses Groq Whisper when GROQ_API_KEY is set.
 */
export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return unauthorized("Sign in to use voice input.");

  const userId = session.user.sub;
  if (!userId) return unauthorized("Your session expired. Sign in again.");

  // Transcription is an outbound paid call — share the chat budget.
  const rateLimit = await checkChatRateLimit(userId);
  if (!rateLimit.allowed) {
    return apiError("Too many requests. Try again shortly.", 429, {
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return apiError(
      "Voice input isn't available — the server has no transcription key configured.",
      503
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("Expected multipart form data with an audio file.");
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return badRequest("Audio file is required.");
  }
  if (file.size === 0) {
    return badRequest("The recording was empty. Try recording again.");
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return badRequest("That recording is too long. Keep it under 20 MB.");
  }

  const upstream = new FormData();
  upstream.append("file", file, "audio.webm");
  upstream.append("model", "whisper-large-v3-turbo");
  upstream.append("response_format", "json");

  let response: Response;
  try {
    response = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: upstream,
        timeoutMs: TRANSCRIBE_TIMEOUT_MS,
      }
    );
  } catch (error) {
    console.error("[transcribe] Upstream request failed:", error);
    if (error instanceof HttpTimeoutError) {
      return apiError("Transcription timed out. Try a shorter recording.", 504);
    }
    if (error instanceof HttpNetworkError) {
      return apiError(
        "Couldn't reach the transcription service. Check your connection and try again.",
        502
      );
    }
    return apiError("Transcription failed. Try again.", 502);
  }

  if (!response.ok) {
    // Body may contain key hints — log it, never return it.
    console.error(
      `[transcribe] Groq responded ${response.status}:`,
      await response.text().catch(() => "<unreadable>")
    );
    if (response.status === 429) {
      return apiError("Transcription is rate limited. Try again shortly.", 429);
    }
    if (response.status === 401 || response.status === 403) {
      return apiError(
        "Voice input isn't available — the transcription key was rejected.",
        503
      );
    }
    return apiError("Failed to transcribe audio. Try again.", 502);
  }

  let data: { text?: unknown };
  try {
    data = (await response.json()) as { text?: unknown };
  } catch (error) {
    console.error("[transcribe] Unreadable Groq response:", error);
    return apiError("Failed to transcribe audio. Try again.", 502);
  }

  return Response.json({
    text: typeof data.text === "string" ? data.text.trim() : "",
  });
}
