import { useEffect, useRef, useState } from "react";

export type DictationStatus = "idle" | "recording" | "transcribing";

const SAMPLE_RATE = 16_000;

/** Records from the microphone and hands the MAI transcript to `onTranscript`. */
export function useDictation(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (status !== "recording") return;
    const id = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  // Release the microphone without transcribing when the view is left mid-recording.
  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (!recorder) return;
      recorder.onstop = null;
      recorder.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setStatus("transcribing");
        try {
          onTranscript(await transcribe(new Blob(chunks, { type: recorder.mimeType })));
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Transkription fehlgeschlagen.");
        } finally {
          setStatus("idle");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setElapsed(0);
      setStatus("recording");
    } catch {
      setError("Kein Zugriff auf das Mikrofon.");
    }
  };

  const stop = () => recorderRef.current?.stop();

  return { status, elapsed, error, start, stop };
}

async function transcribe(recording: Blob): Promise<string> {
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "audio/wav" },
    body: await toWav(recording),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Transkription fehlgeschlagen.");
  return result.text ?? "";
}

/** Converts a browser recording (webm/ogg/mp4) to 16 kHz mono WAV. */
async function toWav(recording: Blob): Promise<Blob> {
  const context = new AudioContext();
  const decoded = await context.decodeAudioData(await recording.arrayBuffer());
  await context.close();

  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * SAMPLE_RATE), SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  return encodeWav(rendered.getChannelData(0), SAMPLE_RATE);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const writeText = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeText(36, "data");
  view.setUint32(40, dataSize, true);

  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  });

  return new Blob([view.buffer], { type: "audio/wav" });
}
