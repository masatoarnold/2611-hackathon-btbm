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
  const ersteZeileIstTitel = ersteZeile
    .toLowerCase()
    .includes(titel.toLowerCase());
  const ueberschrift = ersteZeileIstTitel ? ersteZeile : fuerPdf(titel);
  const inhalt = ersteZeileIstTitel
    ? rest.join("\n").replace(/^\n+/, "")
    : fuerPdf(text);

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
  herunterladen(
    erstellePdf(titel, text).output("blob"),
    dateiname(titel, "pdf"),
  );
}

type MarkdownBlock = {
  art: "h1" | "h2" | "h3" | "absatz" | "punkt";
  marke: string;
  text: string;
};

const MARKDOWN_UEBERSCHRIFT = /^(#{1,3})\s+(.*)$/;
const MARKDOWN_AUFZAEHLUNG = /^([-*+]|\d+\.)\s+(.*)$/;

/** Minimal Markdown reader for what the Tagesbericht editor writes: headings, lists, paragraphs. */
function markdownBloecke(markdown: string): MarkdownBlock[] {
  const bloecke: MarkdownBlock[] = [];
  for (const zeile of markdown.split("\n")) {
    const text = zeile.trim();
    if (!text) continue;

    const ueberschrift = MARKDOWN_UEBERSCHRIFT.exec(text);
    if (ueberschrift) {
      const [, rauten = "#", inhalt = ""] = ueberschrift;
      bloecke.push({
        art: `h${rauten.length}` as MarkdownBlock["art"],
        marke: "",
        text: inhalt,
      });
      continue;
    }

    const aufzaehlung = MARKDOWN_AUFZAEHLUNG.exec(text);
    if (aufzaehlung) {
      const [, marke = "-", inhalt = ""] = aufzaehlung;
      bloecke.push({
        art: "punkt",
        marke: /\d/.test(marke) ? marke : "•",
        text: inhalt,
      });
      continue;
    }

    bloecke.push({ art: "absatz", marke: "", text });
  }
  return bloecke;
}

const ohneFormatierung = (text: string) =>
  text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");

const inlineAlsHtml = (text: string) =>
  escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

function markdownAlsHtml(titel: string, markdown: string) {
  const koerper = markdownBloecke(markdown)
    .map(({ art, marke, text }) => {
      const inhalt = inlineAlsHtml(text);
      if (art === "absatz") return `<p>${inhalt}</p>`;
      if (art === "punkt") return `<p class="punkt">${marke} ${inhalt}</p>`;
      return `<${art}>${inhalt}</${art}>`;
    })
    .join("\n");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${escapeHtml(titel)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px}h1{font-size:20px}h2{font-size:16px;margin-top:20px}h3{font-size:14px}p.punkt{margin:0 0 4px 16px;text-indent:-12px}</style>
</head><body>${koerper}</body></html>`;
}

/** Plain-text version of the Markdown (headings and lists kept, formatting marks removed), e.g. for mail. */
export function markdownAlsText(markdown: string) {
  const bloecke = markdownBloecke(markdown);
  return bloecke
    .map(({ art, text }, index) => {
      const zeile = `${art === "punkt" ? "- " : ""}${ohneFormatierung(text)}`;
      if (index === 0) return zeile;
      const trenner =
        art === "punkt" && bloecke[index - 1]?.art === "punkt" ? "\n" : "\n\n";
      return trenner + zeile;
    })
    .join("");
}

const PDF_STILE: Record<
  MarkdownBlock["art"],
  { groesse: number; fett: boolean; zeilenhoehe: number; abstandDavor: number }
> = {
  h1: { groesse: 16, fett: true, zeilenhoehe: 7, abstandDavor: 0 },
  h2: { groesse: 13, fett: true, zeilenhoehe: 6, abstandDavor: 5 },
  h3: { groesse: 11, fett: true, zeilenhoehe: 5.5, abstandDavor: 3 },
  absatz: { groesse: 11, fett: false, zeilenhoehe: 5.5, abstandDavor: 2 },
  punkt: { groesse: 11, fett: false, zeilenhoehe: 5.5, abstandDavor: 1 },
};
const PDF_PUNKT_EINZUG_MM = 5;

/** Lays the Markdown out on A4 pages with real heading sizes. */
export function erstelleMarkdownPdf(markdown: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const breite = pdf.internal.pageSize.getWidth() - 2 * PDF_RAND_MM;
  const seitenEnde = pdf.internal.pageSize.getHeight() - PDF_RAND_MM;

  let y = PDF_RAND_MM;
  markdownBloecke(markdown).forEach(({ art, text }, index) => {
    const { groesse, fett, zeilenhoehe, abstandDavor } = PDF_STILE[art];
    const einzug = art === "punkt" ? PDF_PUNKT_EINZUG_MM : 0;
    pdf.setFont("helvetica", fett ? "bold" : "normal");
    pdf.setFontSize(groesse);
    const zeilen = pdf.splitTextToSize(
      fuerPdf(ohneFormatierung(text)),
      breite - einzug,
    ) as string[];

    if (index > 0) y += abstandDavor;
    zeilen.forEach((zeile, zeilenIndex) => {
      if (y > seitenEnde) {
        pdf.addPage();
        y = PDF_RAND_MM;
      }
      if (art === "punkt" && zeilenIndex === 0) pdf.text("-", PDF_RAND_MM, y);
      pdf.text(zeile, PDF_RAND_MM + einzug, y);
      y += zeilenhoehe;
    });
  });

  return pdf;
}

/** Downloads the Markdown as an A4 PDF with formatted headings. */
export function markdownAlsPdfHerunterladen(titel: string, markdown: string) {
  herunterladen(
    erstelleMarkdownPdf(markdown).output("blob"),
    dateiname(titel, "pdf"),
  );
}

/** Downloads the Markdown as a Word-readable .doc file with formatted headings. */
export function markdownAlsWordHerunterladen(titel: string, markdown: string) {
  herunterladen(
    new Blob([markdownAlsHtml(titel, markdown)], {
      type: "application/msword",
    }),
    dateiname(titel, "doc"),
  );
}

/** Opens the text in a new window to read it. */
export function inNeuemFensterOeffnen(titel: string, text: string) {
  const fenster = window.open("", "_blank");
  if (!fenster) return;
  fenster.document.write(alsHtml(titel, text));
  fenster.document.close();
}
