import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { loadApiKey } from "./api-keys";

const MODEL = "claude-haiku-5-5";

const ReportSummarySchema = z.object({
  title: z
    .string()
    .describe("Kurzer Titel, 2–5 Wörter, z. B. „Betonpumpe ausgefallen“"),
  summary: z.string().describe("Sachliche Zusammenfassung in 1–3 Sätzen"),
  vorgangstyp: z.enum(["Meldung", "Besprechungsprotokoll"]),
  priority: z.number().int().describe("Priorität 1–5"),
  location: z
    .string()
    .describe("Ort auf der Baustelle, leer wenn nicht genannt"),
});

export type ReportSummary = z.infer<typeof ReportSummarySchema>;

const SYSTEM_PROMPT = `Du unterstützt Bauleiter auf der Baustelle. Du erhältst das Transkript einer Sprachaufnahme und bereitest es als Eintrag für das Bautagebuch auf.

- summary: sachlich, im Stil eines Bauberichts, nur Fakten aus dem Transkript. Füllwörter, Wiederholungen und Versprecher weglassen.
- vorgangstyp: "Besprechungsprotokoll", wenn ein Gespräch oder Termin mit mehreren Beteiligten wiedergegeben wird, sonst "Meldung".
- priority:
  1 = reine Information
  2 = geringe Auswirkung, kein Handlungsdruck
  3 = Handlungsbedarf, Termine nicht unmittelbar gefährdet
  4 = Verzögerung oder Mehrkosten drohen, zeitnah handeln
  5 = Sicherheitsrisiko, Personenschaden oder Baustopp
- location: Bauabschnitt, Geschoss, Raum oder Bauteil, sofern genannt. Nichts erfinden.

Antworte auf Deutsch.`;

/** Turns a raw transcript into summary, title and metadata via Claude Haiku. */
export async function handleSummarize(req: Request): Promise<Response> {
  const apiKey = await loadApiKey("anthropic");
  if (!apiKey) {
    return Response.json(
      { error: "Kein Anthropic-API-Key gefunden." },
      { status: 500 },
    );
  }

  const { transcript } = (await req.json().catch(() => ({}))) as {
    transcript?: string;
  };
  if (!transcript?.trim()) {
    return Response.json(
      { error: "Kein Transkript erhalten." },
      { status: 400 },
    );
  }

  try {
    const response = await new Anthropic({ apiKey }).messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: {
        effort: "low",
        format: zodOutputFormat(ReportSummarySchema),
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      console.error(
        "Summary not produced:",
        response.stop_reason,
        response.stop_details,
      );
      return Response.json(
        { error: "Zusammenfassung fehlgeschlagen." },
        { status: 502 },
      );
    }

    const summary = response.parsed_output;
    return Response.json({
      ...summary,
      priority: Math.min(5, Math.max(1, summary.priority)),
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key rejected");
      return Response.json(
        { error: "Anthropic-API-Key ungültig." },
        { status: 502 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return Response.json(
        { error: "Zusammenfassung fehlgeschlagen." },
        { status: 502 },
      );
    }
    throw error;
  }
}
