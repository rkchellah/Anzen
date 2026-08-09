/** Client helper for kit MessageInput `transcribeAudio` prop. */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, "audio.webm");

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Transcription failed");
  }

  const data = (await response.json()) as { text?: string };
  return data.text?.trim() ?? "";
}
