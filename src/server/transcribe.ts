import { loadApiKey } from "./api-keys";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/audio/transcriptions";
const MODEL = "microsoft/mai-transcribe-2";

/** Accepts a WAV body and forwards it to MAI Transcribe via OpenRouter. */
export async function handleTranscribe(req: Request): Promise<Response> {
  const apiKey = await loadApiKey("openrouter");
  if (!apiKey) {
    return Response.json({ error: "Kein OpenRouter-API-Key gefunden." }, { status: 500 });
  }

  const audio = await req.arrayBuffer();
  if (audio.byteLength === 0) {
    return Response.json({ error: "Keine Audiodaten erhalten." }, { status: 400 });
  }

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input_audio: { data: Buffer.from(audio).toString("base64"), format: "wav" },
    }),
  });
  const result = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    console.error("OpenRouter transcription failed:", upstream.status, result);
    return Response.json(
      { error: result?.error?.message ?? "Transkription fehlgeschlagen." },
      { status: 502 },
    );
  }

  return Response.json({ text: result?.text ?? "" });
}
