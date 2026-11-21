/** Small browser helpers to hand a text document to the user. */
import { jsPDF } from "jspdf";

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

function herunterladen(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Downloads the text as a Word-readable .doc file. */
export function alsWordHerunterladen(titel: string, text: string) {
  herunterladen(
    new Blob([alsHtml(titel, text)], { type: "application/msword" }),
    dateiname(titel, "doc"),
  );
}

/** The built-in PDF fonts only cover Latin-1, so typographic characters are simplified. */
function fuerPdf(text: string) {
  return text
    .replace(/[–—]/g, "-")
    .replace(/[„“”]/g, '"')
    .replace(/[‚‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/€/g, "EUR");
}

const PDF_RAND_MM = 20;
const PDF_ZEILENHOEHE_MM = 5.5;

/** Lays the text out on A4 pages. A first line that names the document becomes the heading. */
export function erstellePdf(titel: string, text: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const breite = pdf.internal.pageSize.getWidth() - 2 * PDF_RAND_MM;
  const seitenEnde = pdf.internal.pageSize.getHeight() - PDF_RAND_MM;

  const [ersteZeile = "", ...rest] = fuerPdf(text).split("\n");
  const ersteZeileIstTitel = ersteZeile.toLowerCase().includes(titel.toLowerCase());
  const ueberschrift = ersteZeileIstTitel ? ersteZeile : fuerPdf(titel);
  const inhalt = ersteZeileIstTitel ? rest.join("\n").replace(/^\n+/, "") : fuerPdf(text);

  let y = PDF_RAND_MM;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  for (const zeile of pdf.splitTextToSize(ueberschrift, breite) as string[]) {
    pdf.text(zeile, PDF_RAND_MM, y);
    y += 7;
  }
  y += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  for (const zeile of pdf.splitTextToSize(inhalt, breite) as string[]) {
    if (y > seitenEnde) {
      pdf.addPage();
      y = PDF_RAND_MM;
    }
    pdf.text(zeile, PDF_RAND_MM, y);
    y += PDF_ZEILENHOEHE_MM;
  }

  return pdf;
}

/** Downloads the text as an A4 PDF file. */
export function alsPdfHerunterladen(titel: string, text: string) {
  herunterladen(erstellePdf(titel, text).output("blob"), dateiname(titel, "pdf"));
}

/** Opens the text in a new window to read it. */
export function inNeuemFensterOeffnen(titel: string, text: string) {
  const fenster = window.open("", "_blank");
  if (!fenster) return;
  fenster.document.write(alsHtml(titel, text));
  fenster.document.close();
}
