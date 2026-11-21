import type { ChatRequest } from "@/server/chat";

/** Sends the chat so far to the server and returns the AI's reply. */
export async function sendChat(request: ChatRequest): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "KI-Antwort fehlgeschlagen.");
  return result.text;
}
