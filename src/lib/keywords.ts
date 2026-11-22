/** Asks the server for contract search terms that fit an incident summary. */
export async function schlageKeywordsVor(
  zusammenfassung: string,
): Promise<string[]> {
  const response = await fetch("/api/keywords", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zusammenfassung }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Keine Vorschläge erhalten.");
  return result.keywords;
}
