import { requestJson } from "@/lib/client-api";

/** Whisper on a long clip is slow — allow well past the default client budget. */
const TRANSCRIBE_TIMEOUT_MS = 45_000;

/** Client helper for kit MessageInput `transcribeAudio` prop. */
export async function transcribeAudio(blob: Blob): Promise<string> {
  if (blob.size === 0) {
    throw new Error("The recording was empty. Try again.");
  }

  const formData = new FormData();
  formData.append("file", blob, "audio.webm");

  const data = await requestJson<{ text?: string }>("/api/transcribe", {
    method: "POST",
    body: formData,
    timeoutMs: TRANSCRIBE_TIMEOUT_MS,
  });

  return data.text?.trim() ?? "";
}
