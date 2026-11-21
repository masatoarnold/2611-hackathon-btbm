import type { Anhang, Meldung } from "./meldungen";

// Beispiel-Meldungen (fiktives Projekt Wohnanlage Lindenhof, Haus B).
// Written to the database on first start; mock files carry a text preview instead of a real upload.

const zeit = (tag: number, stunde: number, minute: number) =>
  new Date(2026, 10, tag, stunde, minute).toISOString();

const mockBild = (id: string, name: string, vorschauText: string): Anhang => ({
  id,
  name,
  typ: "bild",
  vorschauText,
});

export const SEED_MELDUNGEN: Meldung[] = [
  {
    id: "m-1",
    title: "Betonpumpe defekt",
    content:
      "Autobetonpumpe in Abschnitt B um 08:15 ausgefallen (Hydraulikschlauch geplatzt). Ersatzpumpe von Brandl Betonpumpen ab 10:30 im Einsatz.",
    transcript:
      "Hier ist die Betonpumpe an Abschnitt B ausgefallen, wir brauchen Ersatz...",
    priority: 4,
    timestamp: zeit(21, 8, 15),
    location: "Abschnitt B",
    vorgangstyp: "Meldung",
    status: "anstehend",
    attachments: [],
  },
  {
    id: "m-2",
    title: "Lieferung verspätet",
    content:
      "Die Lieferung Transportbeton C25/30 (10 t) für die Kellerwände Abschnitt B verspätet sich um ca. 2 Stunden. Ursache laut Lieferant: Stau auf der Zufahrt Nord. Die Betonpumpe wurde umdisponiert, der Tiefbau ist informiert. Folge: Betonage Abschnitt B endet erst gegen 15:30, die Kolonne arbeitet bis dahin an der Schalung Abschnitt C weiter. Kein Verzug am kritischen Pfad, sofern die Lieferung bis 12:00 eintrifft.",
    transcript:
      "Der Betonlieferant hat gerade angerufen. Die Lieferung von 10 t verspätet sich um etwa zwei Stunden.\n\nGrund laut Lieferant: Verkehrsbehinderung auf der Zufahrt zur Baustelle.\n\nIch habe die Betonpumpe in Abschnitt B vorsorglich umdisponiert und den Subunternehmer Tiefbau informiert.",
    priority: 2,
    timestamp: zeit(21, 9, 40),
    location: "Baustelleneinfahrt",
    vorgangstyp: "Meldung",
    status: "anstehend",
    attachments: [
      mockBild(
        "mock-bild-stau",
        "Fahrmischer im Stau, Zufahrt Nord",
        "Foto · 21.11.2026, 09:52\nAufgenommen vom Polier an der Zufahrt Nord.",
      ),
      mockBild(
        "mock-bild-schalung",
        "Schalung Kellerwand B, betonierbereit",
        "Foto · 21.11.2026, 08:30\nSchalung Kellerwand Abschnitt B abgenommen, Bewehrung geprüft.",
      ),
      mockBild(
        "mock-bild-lieferverzug",
        "Foto_Lieferverzug.jpg",
        "Foto · 21.11.2026, 09:52\nFahrmischer im Stau an der Zufahrt Nord, Baustelleneinfahrt durch Sperrung blockiert.",
      ),
      {
        id: "mock-lieferschein",
        name: "Lieferschein_Beton.pdf",
        typ: "datei",
        beschreibung: "PDF · 240 KB",
        vorschauText:
          "Lieferschein Nr. 2026-11-4471\nIsar Transportbeton GmbH\n\nBaustelle: Wohnanlage Lindenhof, Haus B\nSorte: C25/30 XC2 F3 16 mm\nMenge: 10,0 m³\nAbfahrt Werk: 09:05\nAnkunft Baustelle: 11:38 (geplant 09:40)\n\nUnterschrift Polier: ________",
      },
    ],
  },
  {
    id: "m-3",
    title: "Bewehrungspläne fehlen",
    content:
      "Freigegebene Bewehrungspläne für Abschnitt C liegen noch nicht vor. Beginn verschiebt sich voraussichtlich um 2 Arbeitstage, Behinderungsanzeige vorbereitet.",
    transcript:
      "Für Abschnitt C haben wir immer noch keine freigegebenen Bewehrungspläne, das schiebt den Beginn um etwa zwei Tage...",
    priority: 3,
    timestamp: zeit(21, 7, 50),
    location: "Abschnitt C",
    vorgangstyp: "Meldung",
    status: "anstehend",
    attachments: [],
  },
  {
    id: "m-4",
    title: "Kiesmangel",
    content:
      "Kies 0/32 (18 t) für die Sauberkeitsschicht um 08:05 nachgeliefert.",
    transcript:
      "Der fehlende Kies für die Sauberkeitsschicht ist gerade nachgeliefert worden...",
    priority: 2,
    timestamp: zeit(21, 8, 5),
    location: "Abschnitt C",
    vorgangstyp: "Meldung",
    status: "abgeschlossen",
    attachments: [],
  },
  {
    id: "m-5",
    title: "Baubesprechung Nr. 14",
    content:
      "Baubesprechung mit dem Bauherrn am 19.11.: Abdichtung Kellerwände und Grundwasserstand besprochen. Protokoll an alle Teilnehmer versendet.",
    transcript:
      "Kurz zur Baubesprechung mit dem Bauherrn: Wir haben die Abdichtung der Kellerwände und den Grundwasserstand besprochen...",
    priority: 1,
    timestamp: zeit(19, 14, 0),
    location: "Baucontainer",
    vorgangstyp: "Besprechungsprotokoll",
    status: "abgeschlossen",
    attachments: [],
  },
];
