import { auth0 } from "@/lib/auth0";

/**
 * Voice → text for shadcn-chatbot-kit MessageInput / useAudioRecording.
 * Uses Groq Whisper when GROQ_API_KEY is set.
 */
export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Voice input requires GROQ_API_KEY for transcription." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return Response.json({ error: "Audio file is required." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file, "audio.webm");
  upstream.append("model", "whisper-large-v3-turbo");
  upstream.append("response_format", "json");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Transcription failed:", detail);
    return Response.json(
      { error: "Failed to transcribe audio." },
      { status: 502 }
    );
  }

  const data = (await response.json()) as { text?: string };
  return Response.json({ text: data.text?.trim() ?? "" });
}
