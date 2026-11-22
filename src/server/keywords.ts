import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { loadApiKey } from "./api-keys";

const MODEL = "claude-haiku-5-5";
const MAX_KEYWORDS = 5;

const KeywordsSchema = z.object({
  keywords: z
    .array(z.string())
    .describe(
      "3 bis 5 einzelne Suchbegriffe. Der erste nennt das betroffene Bauteil oder die Lieferung, die übrigen die Rechtsfolgen.",
    ),
});

const SYSTEM_PROMPT = `Du unterstützt Bauleiter bei der Suche in Verträgen. Du erhältst die Zusammenfassung eines Vorfalls auf der Baustelle und nennst Suchbegriffe, mit denen sich die dazu passenden Vertragsklauseln finden lassen.

Die Verträge sind Liefer-, Miet- und Werkverträge (VOB/B). Die Suche ist eine Volltextsuche über den Vertragstext.

- Liefere 3 bis 5 Begriffe.
- Der erste Begriff nennt das betroffene Bauteil, Material oder Gewerk, damit der richtige Vertragspartner gefunden wird, zum Beispiel „Fenster“, „Beton“, „Bewehrung“, „Betonpumpe“, „Abdichtung“. Verwende das Wort so, wie es im Vertrag steht, im Singular oder Stamm.
- Die übrigen Begriffe betreffen die Rechtsfolgen und Pflichten des Vorfalls (Termine, Verzug, Schaden, Ersatz, Haftung, Kosten), zum Beispiel „Lieferzeit“, „Wartezeiten“, „Vertragsstrafe“, „Ersatzlieferung“, „Behinderung“.
- Jeder Begriff ist ein einzelnes deutsches Wort, so wie es in einer Vertragsklausel stehen würde.
- Keine Orte, Uhrzeiten oder Mengen, keine Ausdrücke aus mehreren Wörtern, keine Wiederholungen.`;

/** Suggests contract search terms for an incident summary via Claude Haiku. */
export async function handleKeywords(req: Request): Promise<Response> {
  const apiKey = await loadApiKey("anthropic");
  if (!apiKey) {
    return Response.json({ error: "Kein Anthropic-API-Key gefunden." }, { status: 500 });
  }

  const { zusammenfassung } = (await req.json().catch(() => ({}))) as {
    zusammenfassung?: string;
  };
  if (!zusammenfassung?.trim()) {
    return Response.json({ error: "Keine Zusammenfassung erhalten." }, { status: 400 });
  }

  try {
    const response = await new Anthropic({ apiKey }).messages.parse({
      model: MODEL,
      max_tokens: 300,
      output_config: { effort: "low", format: zodOutputFormat(KeywordsSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: zusammenfassung }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      console.error("Keywords not produced:", response.stop_reason, response.stop_details);
      return Response.json({ error: "Keine Vorschläge erhalten." }, { status: 502 });
    }

    const keywords = [
      ...new Set(response.parsed_output.keywords.map((wort) => wort.trim()).filter(Boolean)),
    ].slice(0, MAX_KEYWORDS);
    return Response.json({ keywords });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return Response.json({ error: "Keine Vorschläge erhalten." }, { status: 502 });
    }
    throw error;
  }
}
