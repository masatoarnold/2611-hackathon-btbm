import type { ReportSummary } from "@/server/summarize";

export type { ReportSummary };

/** Asks the server to turn a raw transcript into summary, title and metadata. */
export async function summarizeTranscript(transcript: string): Promise<ReportSummary> {
  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Zusammenfassung fehlgeschlagen.");
  return result;
}
