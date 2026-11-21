/** Small browser helpers to hand a text document to the user. */

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (zeichen) => `&#${zeichen.charCodeAt(0)};`);
}

function alsHtml(titel: string, text: string) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${escapeHtml(titel)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;white-space:pre-wrap}</style>
</head><body>${escapeHtml(text)}</body></html>`;
}

function dateiname(titel: string, endung: string) {
  return `${titel.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "")}.${endung}`;
}

/** Downloads the text as a Word-readable .doc file. */
export function alsWordHerunterladen(titel: string, text: string) {
  const blob = new Blob([alsHtml(titel, text)], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = dateiname(titel, "doc");
  link.click();
  URL.revokeObjectURL(url);
}

/** Opens the text in a new window, either to read it or to print it as PDF. */
export function inNeuemFensterOeffnen(titel: string, text: string, drucken = false) {
  const fenster = window.open("", "_blank");
  if (!fenster) return;
  fenster.document.write(alsHtml(titel, text));
  fenster.document.close();
  if (drucken) fenster.print();
}

/** Opens the user's mail program with the text as a draft. */
export function perEmailSenden(betreff: string, text: string) {
  window.location.href = `mailto:?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
}
