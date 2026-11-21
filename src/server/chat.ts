import Anthropic from "@anthropic-ai/sdk";
import { loadApiKey } from "./api-keys";

const MODEL = "claude-haiku-5-5";

export type ChatRequest = {
  vorfall: { titel: string; zusammenfassung: string };
  messages: Anthropic.MessageParam[];
};

const SYSTEM_PROMPT = `Du bist der KI-Assistent im Cockpit einer Bauleitung. Du hilfst bei der Bearbeitung eines einzelnen Vorfalls auf der Baustelle: Rückfragen klären, Bautagesbericht ergänzen, Anzeigen und E-Mails an Bauherr oder Subunternehmer formulieren.

- Antworte auf Deutsch, knapp und sachlich, im Ton einer erfahrenen Bauleitung.
- Halte dich an die Fakten des Vorfalls. Fehlen Angaben, frag nach oder markiere sie als [Platzhalter].
- Du gibst keine Rechtsberatung. Bei Anzeigen nach VOB/B formulierst du Entwürfe; die Prüfung liegt bei der Bauleitung.`;

/** Answers one chat turn about the open incident via Claude Haiku. */
export async function handleChat(req: Request): Promise<Response> {
  const apiKey = await loadApiKey("anthropic");
  if (!apiKey) {
    return Response.json({ error: "Kein Anthropic-API-Key gefunden." }, { status: 500 });
  }

  const { vorfall, messages } = ((await req.json().catch(() => ({}))) ?? {}) as Partial<ChatRequest>;
  if (!vorfall || !messages?.length || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Keine Nachricht erhalten." }, { status: 400 });
  }

  try {
    const response = await new Anthropic({ apiKey }).messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        {
          type: "text",
          text: `Aktueller Vorfall: ${vorfall.titel}\nZusammenfassung: ${vorfall.zusammenfassung}`,
        },
      ],
      messages,
    });

    if (response.stop_reason === "refusal") {
      console.error("Chat refused:", response.stop_details);
      return Response.json({ error: "Die KI hat die Anfrage abgelehnt." }, { status: 502 });
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return Response.json({ text });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key rejected");
      return Response.json({ error: "Anthropic-API-Key ungültig." }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Zu viele Anfragen, bitte kurz warten." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return Response.json({ error: "KI-Antwort fehlgeschlagen." }, { status: 502 });
    }
    throw error;
  }
}
