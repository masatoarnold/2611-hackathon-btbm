import { Fragment, useMemo, useState } from "react";
import MiniSearch from "minisearch";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  FlagIcon,
  ImageIcon,
  Loader2Icon,
  MailIcon,
  PaperclipIcon,
  RotateCcwIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { CockpitHeader } from "@/components/CockpitHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent } from "@/components/ui/message";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { alsPdfHerunterladen, alsWordHerunterladen } from "@/lib/export";

// Mock-Daten (fiktives Projekt Wohnanlage Lindenhof, Haus B), bis die Anbindung steht
const SUBUNTERNEHMER = [
  {
    id: "beton",
    name: "Isar Transportbeton GmbH (Lieferant)",
    vertraege: ["Liefervertrag Transportbeton 2026.pdf", "Preisliste Beton C25-30.pdf"],
    leistung: "Lieferung Transportbeton frei Baustelle nach Abruf, mind. 24 h vorher",
    klausel:
      "§ 5 Lieferzeit: Liefertermine sind verbindlich. Bei Verspätung über 60 Minuten informiert der Lieferant unverzüglich; Wartezeiten von Pumpe und Kolonne trägt der Lieferant, soweit er sie zu vertreten hat.",
  },
  {
    id: "tiefbau",
    name: "Huber Tiefbau GmbH",
    vertraege: ["Rahmenvertrag Tiefbau 2026.pdf", "Nachtrag 1 Erdarbeiten.pdf"],
    leistung: "Baugrube, Verbau, Wasserhaltung und Arbeitsraumverfüllung",
    klausel:
      "§ 7 Behinderung: Behinderungen sind dem Auftraggeber unverzüglich schriftlich anzuzeigen (§ 6 Abs. 1 VOB/B).",
  },
  {
    id: "rohbau",
    name: "Kessler Rohbau GmbH & Co. KG",
    vertraege: ["Werkvertrag Rohbau Haus B.pdf", "Versicherungsnachweis 2026.pdf"],
    leistung: "Stahlbetonarbeiten UG bis Dach, inkl. Schalung und Bewehrung",
    klausel:
      "§ 9 Vertragsstrafe: 0,2 % der Auftragssumme je Werktag Verzug bei Zwischenfrist Fertigstellung UG, max. 5 %.",
  },
  {
    id: "pumpe",
    name: "Brandl Betonpumpen (Gerätemiete)",
    vertraege: ["Mietvertrag Autobetonpumpe 36 m.pdf"],
    leistung: "Autobetonpumpe 36 m mit Maschinist, Abrechnung nach Stunden",
    klausel:
      "§ 4 Ausfall: Bei technischem Ausfall stellt der Vermieter binnen 3 Stunden ein Ersatzgerät. Ausfallzeiten werden nicht berechnet.",
  },
  {
    id: "elektro",
    name: "Elektro Lechner GmbH",
    vertraege: ["Werkvertrag Elektro Haus B.pdf"],
    leistung: "Baustrom, Erdung und Elektroinstallation Haus B",
    klausel: "§ 6 Termine: Beginn Rohinstallation nach Fertigstellung Decke über EG.",
  },
  {
    id: "haustechnik",
    name: "Wagner Haustechnik GmbH",
    vertraege: ["Werkvertrag Heizung Sanitär Lüftung.pdf"],
    leistung: "Heizung, Sanitär und Lüftung Haus B",
    klausel: "§ 6 Termine: Grundleitungen vor Betonage Bodenplatte, Abstimmung mit Rohbau.",
  },
];

/** Builds a mock preview for each contract file of a subcontractor. */
const VERTRAGS_VORSCHAU: Record<string, string> = Object.fromEntries(
  SUBUNTERNEHMER.flatMap(({ name, vertraege, leistung, klausel }) =>
    vertraege.map((vertrag) => [
      vertrag,
      `${vertrag.replace(/\.pdf$/, "")}\n\nAuftraggeber: Musterbau GmbH\nAuftragnehmer: ${name}\nBauvorhaben: Wohnanlage Lindenhof, Haus B\n\nVertragsgrundlagen: VOB/B in der aktuellen Fassung, Leistungsverzeichnis, Terminplan Rev. 3\n\nLeistung: ${leistung}\n\n${klausel}\n\nGerichtsstand: München`,
    ]),
  ),
);

const vertragsIndex = new MiniSearch<{ id: string; text: string; unternehmer: string }>({
  fields: ["id", "text", "unternehmer"],
  storeFields: ["id"],
  searchOptions: { prefix: true, fuzzy: 0.2, boost: { id: 2 } },
});
vertragsIndex.addAll(
  SUBUNTERNEHMER.flatMap(({ name, vertraege }) =>
    vertraege.map((vertrag) => ({
      id: vertrag,
      text: VERTRAGS_VORSCHAU[vertrag] ?? "",
      unternehmer: name,
    })),
  ),
);

const MAX_KEYWORDS = 5;

/** Simulierte Laufzeit des Modells in Millisekunden. */
const KEYWORDS_MOCK_LAUFZEIT_MS = 1500;

/** Mock-Keywords für die Vertragssuche. Hier eintragen (maximal MAX_KEYWORDS). */
const KEYWORDS_MOCK = ["Lieferzeit", "Verspätung", "Beton", "Lieferant", "Wartezeiten"];

/** Simuliert die Keyword-Erzeugung durch ein Modell, bis die Anbindung steht. */
async function schlageKeywordsVor(_zusammenfassung: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, KEYWORDS_MOCK_LAUFZEIT_MS));
  return KEYWORDS_MOCK.slice(0, MAX_KEYWORDS);
}

const ANHAENGE = [
  { name: "Lieferschein_Beton.pdf", beschreibung: "PDF · 240 KB" },
];
const BILDER = [
  "Fahrmischer im Stau, Zufahrt Nord",
  "Schalung Kellerwand B, betonierbereit",
  "Foto_Lieferverzug.jpg",
];

const DOKUMENTTYPEN = [
  "Behinderungsanzeige",
  "Tagesbericht",
  "Bedenkenanzeige",
  "Meetingprotokoll",
];

const ZUSAMMENFASSUNG_MOCK =
  "Die Lieferung Transportbeton C25/30 (10 t) für die Kellerwände Abschnitt B verspätet sich um ca. 2 Stunden. Ursache laut Lieferant: Stau auf der Zufahrt Nord. Die Betonpumpe wurde umdisponiert, der Tiefbau ist informiert. Folge: Betonage Abschnitt B endet erst gegen 15:30, die Kolonne arbeitet bis dahin an der Schalung Abschnitt C weiter. Kein Verzug am kritischen Pfad, sofern die Lieferung bis 12:00 eintrifft.";

const DATEI_VORSCHAU: Record<string, string> = {
  "Lieferschein_Beton.pdf":
    "Lieferschein Nr. 2026-11-4471\nIsar Transportbeton GmbH\n\nBaustelle: Wohnanlage Lindenhof, Haus B\nSorte: C25/30 XC2 F3 16 mm\nMenge: 10,0 m³\nAbfahrt Werk: 09:05\nAnkunft Baustelle: 11:38 (geplant 09:40)\n\nUnterschrift Polier: ________",
  "Foto_Lieferverzug.jpg":
    "Foto · 21.11.2026, 09:52\nFahrmischer im Stau an der Zufahrt Nord, Baustelleneinfahrt durch Sperrung blockiert.",
  "Fahrmischer im Stau, Zufahrt Nord":
    "Foto · 21.11.2026, 09:52\nAufgenommen vom Polier an der Zufahrt Nord.",
  "Schalung Kellerwand B, betonierbereit":
    "Foto · 21.11.2026, 08:30\nSchalung Kellerwand Abschnitt B abgenommen, Bewehrung geprüft.",
  "Preisliste Beton C25-30.pdf":
    "Preisliste 2026 · Isar Transportbeton GmbH\n\nC25/30 XC2 F3 16 mm: 128,00 €/m³\nC30/37 XC4 F3 16 mm: 139,50 €/m³\nZuschlag Winterbeton (< 5 °C): 6,50 €/m³\nWartezeit Fahrmischer ab 30 min: 1,80 €/min\n\nAlle Preise netto, frei Baustelle München.",
  "Versicherungsnachweis 2026.pdf":
    "Versicherungsbestätigung Betriebshaftpflicht\n\nVersicherungsnehmer: Kessler Rohbau GmbH & Co. KG\nDeckungssumme Personen- und Sachschäden: 5.000.000 €\nGültig: 01.01.2026 – 31.12.2026",
};

const DOKUMENT_ENTWUERFE: Record<string, string> = {
  Behinderungsanzeige:
    "Behinderungsanzeige nach § 6 Abs. 1 VOB/B\n\nBauvorhaben: Wohnanlage Lindenhof, Haus B\nAn: Lindenhof Wohnbau GmbH, Bauherr\n\nSehr geehrte Damen und Herren,\n\nhiermit zeigen wir an, dass wir am 21.11.2026 bei der Ausführung der Kellerwände Abschnitt B behindert sind. Die Baustellenzufahrt Nord war ab 09:30 durch eine Sperrung blockiert; die Betonlieferung konnte erst um 11:38 einfahren.\n\nAuswirkungen: Verschiebung der Betonage um ca. 2 Stunden. Über weitere Auswirkungen auf die Ausführungsfristen informieren wir umgehend.\n\nMit freundlichen Grüßen\nBauleitung",
  Tagesbericht:
    "Bautagesbericht Nr. 088 · 21.11.2026\nWohnanlage Lindenhof, Haus B\n\nWetter: trocken, 4–6 °C\nPersonal: 14 (Rohbau 9, Tiefbau 3, Bauleitung 2)\n\nLeistungen:\n– Betonage Kellerwände Abschnitt B (verschoben auf 11:45–15:30)\n– Schalung Abschnitt C begonnen\n\nBesondere Vorkommnisse:\n– 08:15 Ausfall Betonpumpe, Ersatz ab 10:30\n– Transportbeton ca. 2 h verspätet (Stau Zufahrt Nord)",
  Bedenkenanzeige:
    "Bedenkenanzeige nach § 4 Abs. 3 VOB/B\n\nBauvorhaben: Wohnanlage Lindenhof, Haus B\nAn: Lindenhof Wohnbau GmbH, Bauherr\n\nGegen die vorgesehene Ausführung der Abdichtung der Kellerwände als Bitumendickbeschichtung melden wir Bedenken an. Der am 18.11.2026 gemessene Grundwasserstand liegt 1,20 m über dem Bemessungswasserstand des Gutachtens.\n\nWir empfehlen die Ausführung als WU-Betonkonstruktion und bitten um Entscheidung bis 27.11.2026.\n\nMit freundlichen Grüßen\nBauleitung",
  Meetingprotokoll:
    "Kurzbesprechung 21.11.2026, 10:15, Baucontainer\nTeilnehmer: Bauleitung, Polier, Isar Transportbeton (telefonisch)\n\n1. Lieferverzug Beton: neue Ankunft ca. 11:40 bestätigt.\n2. Kolonne zieht Schalung Abschnitt C vor.\n3. Betonage B bis 15:30, Nachbehandlung wegen Frostgefahr mit Abdeckung.\n\nNächste Abstimmung: Mo 07:00",
};

const TRANSKRIPT_MOCK =
  "Der Betonlieferant hat gerade angerufen. Die Lieferung von 10 t verspätet sich um etwa zwei Stunden.\n\nGrund laut Lieferant: Verkehrsbehinderung auf der Zufahrt zur Baustelle.\n\nIch habe die Betonpumpe in Abschnitt B vorsorglich umdisponiert und den Subunternehmer Tiefbau informiert.";

type ChatNachricht = {
  id: string;
  rolle: "ki" | "nutzer";
  text: string;
  aktion?: string;
  hatAenderungsAktion?: boolean;
};

const KI_ANTWORT_MOCK =
  "Verstanden. Ich habe den Entwurf entsprechend angepasst. Bitte prüfe die Stelle, bevor du das Dokument versendest.";

const CHAT_VERLAUF: ChatNachricht[] = [
  {
    id: "1",
    rolle: "ki",
    text: "Ich habe die Meldung ausgewertet und den Bautagesbericht vorbereitet. Womit soll ich ihn ergänzen?",
  },
  {
    id: "2",
    rolle: "nutzer",
    text: "Ergänze bei den Maßnahmen, dass der Subunternehmer Tiefbau informiert wurde.",
  },
  {
    id: "3",
    rolle: "ki",
    text: "Erledigt. Ich habe den Absatz „Maßnahmen“ angepasst. Die Änderung ist im Bericht markiert und kann übernommen werden.",
    aktion: "KI hat Absatz „Maßnahmen“ im Bericht angepasst",
    hatAenderungsAktion: true,
  },
];

const PRIORITIES = [1, 2, 3, 4, 5];
const DEFAULT_PRIORITY = 1;
const PRIORITY_COLORS: Record<number, string> = {
  1: "var(--foreground)",
  2: "#3b82f6",
  3: "#eab308",
  4: "#ef4444",
  5: "#8b5cf6",
};

type Tab = {
  id: string;
  title: string;
  typ: "datei" | "transkript" | "dokument";
  dokumentTyp?: string;
  /** Editable text of a document draft. */
  inhalt?: string;
};

type BetroffenerVertrag = {
  vertrag: string;
  unternehmer: string;
};

const dateiTab = (name: string): Tab => ({ id: `datei:${name}`, title: name, typ: "datei" });

/** The text shown in a tab, used for the PDF and Word export. */
function textVonTab(tab: Tab | undefined) {
  if (!tab) return "";
  if (tab.typ === "dokument") return tab.inhalt ?? "";
  if (tab.typ === "transkript") return TRANSKRIPT_MOCK;
  return DATEI_VORSCHAU[tab.title] ?? VERTRAGS_VORSCHAU[tab.title] ?? "";
}

export function CockpitMeldungWorkflow() {
  const [zusammenfassung, setZusammenfassung] = useState(ZUSAMMENFASSUNG_MOCK);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [aktiverTab, setAktiverTab] = useState("");
  const [betroffeneVertraege, setBetroffeneVertraege] = useState<BetroffenerVertrag[]>([]);
  const [mailOffen, setMailOffen] = useState(false);
  const [vertragsSuche, setVertragsSuche] = useState("");
  const [metadaten, setMetadaten] = useState(() => ({
    datum: new Date(),
    deadline: "",
    prioritaet: DEFAULT_PRIORITY,
  }));

  const oeffneTab = (tab: Tab) => {
    setTabs((current) =>
      current.some((vorhanden) => vorhanden.id === tab.id) ? current : [...current, tab],
    );
    setAktiverTab(tab.id);
  };

  const schliesseTab = (id: string) => {
    const naechsteTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(naechsteTabs);
    if (aktiverTab === id) setAktiverTab(naechsteTabs.at(-1)?.id ?? "");
  };

  const setzeDokumentTyp = (id: string, dokumentTyp: string) =>
    setTabs((current) =>
      current.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              dokumentTyp,
              title: dokumentTyp,
              inhalt: DOKUMENT_ENTWUERFE[dokumentTyp] ?? "",
            }
          : tab,
      ),
    );

  const setzeInhalt = (id: string, inhalt: string) =>
    setTabs((current) => current.map((tab) => (tab.id === id ? { ...tab, inhalt } : tab)));

  const toggleVertrag = (vertrag: string, unternehmer: string) =>
    setBetroffeneVertraege((current) =>
      current.some((eintrag) => eintrag.vertrag === vertrag)
        ? current.filter((eintrag) => eintrag.vertrag !== vertrag)
        : [...current, { vertrag, unternehmer }],
    );

  const entferneVertrag = (vertrag: string) =>
    setBetroffeneVertraege((current) => current.filter((eintrag) => eintrag.vertrag !== vertrag));

  const betroffeneNamen = betroffeneVertraege.map((eintrag) => eintrag.vertrag);

  const [keywordsLaden, setKeywordsLaden] = useState(false);

  const keywordsVorschlagen = async () => {
    setKeywordsLaden(true);
    try {
      setVertragsSuche((await schlageKeywordsVor(zusammenfassung)).join(" "));
    } finally {
      setKeywordsLaden(false);
    }
  };

  const gefilterteSubunternehmer = useMemo(() => {
    const suchbegriff = vertragsSuche.trim();
    if (!suchbegriff) return SUBUNTERNEHMER;
    const treffer = new Set(vertragsIndex.search(suchbegriff).map((ergebnis) => ergebnis.id));
    return SUBUNTERNEHMER.map((unternehmer) => ({
      ...unternehmer,
      vertraege: unternehmer.vertraege.filter((vertrag) => treffer.has(vertrag)),
    })).filter((unternehmer) => unternehmer.vertraege.length > 0);
  }, [vertragsSuche]);

  const aktuellerTab = tabs.find((tab) => tab.id === aktiverTab);
  const mailText = aktuellerTab?.typ === "dokument" && aktuellerTab.inhalt ? aktuellerTab.inhalt : "";
  const exportTitel = aktuellerTab?.title ?? "";
  const exportText = textVonTab(aktuellerTab);

  const [chatVerlauf, setChatVerlauf] = useState<ChatNachricht[]>(CHAT_VERLAUF);
  const [chatEingabe, setChatEingabe] = useState("");

  const nachrichtSenden = () => {
    const text = chatEingabe.trim();
    if (!text) return;
    setChatVerlauf((aktuell) => [...aktuell, { id: crypto.randomUUID(), rolle: "nutzer", text }]);
    setChatEingabe("");
    setTimeout(
      () =>
        setChatVerlauf((aktuell) => [
          ...aktuell,
          { id: crypto.randomUUID(), rolle: "ki", text: KI_ANTWORT_MOCK },
        ]),
      600,
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <CockpitHeader projekt="Wohnanlage Lindenhof – Haus B" datum="21.11.26" />
      <div className="grid min-h-0 flex-1 grid-cols-[5fr_5fr_3fr] gap-4 p-4">
      {/* Linke Spalte: Incident und Subunternehmer */}
      <div className="grid min-h-0 grid-rows-[3fr_2fr] gap-4">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Vorfall: Lieferverspätung</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <a href="/cockpit">
                  <ArrowLeftIcon />
                  Cockpit
                </a>
              </Button>
            </CardAction>
          </CardHeader>
          <ScrollArea className="min-h-0 flex-1">
            <CardContent className="flex flex-col gap-4">
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-medium">Zusammenfassung</h3>
                <Textarea
                  aria-label="Zusammenfassung"
                  className="min-h-32"
                  value={zusammenfassung}
                  onChange={(event) => setZusammenfassung(event.target.value)}
                />
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-medium">Bilder</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {BILDER.map((bild) => (
                    <li key={bild}>
                      <button
                        type="button"
                        aria-label={`${bild} öffnen`}
                        onClick={() => oeffneTab(dateiTab(bild))}
                        className="flex w-full flex-col gap-1 rounded-md border p-1 text-left hover:bg-muted"
                      >
                        <div className="flex aspect-video w-full items-center justify-center rounded-sm bg-muted text-muted-foreground">
                          <ImageIcon />
                        </div>
                        <span className="truncate px-1 text-xs">{bild}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-medium">Anhänge</h3>
                <ul className="flex flex-col gap-2">
                  {ANHAENGE.map((anhang) => (
                    <li key={anhang.name}>
                      <Attachment size="sm" className="w-full">
                        <AttachmentMedia>
                          <PaperclipIcon />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>{anhang.name}</AttachmentTitle>
                          <AttachmentDescription>{anhang.beschreibung}</AttachmentDescription>
                        </AttachmentContent>
                        <AttachmentTrigger
                          aria-label={`${anhang.name} öffnen`}
                          onClick={() => oeffneTab(dateiTab(anhang.name))}
                        />
                      </Attachment>
                    </li>
                  ))}
                </ul>
              </section>
            </CardContent>
          </ScrollArea>
          <CardFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                oeffneTab({ id: "transkript", title: "Transkript", typ: "transkript" })
              }
            >
              <FileTextIcon />
              Transkript
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2Icon />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Vorfall löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchtest du diesen Vorfall wirklich löschen? Diese Aktion kann nicht rückgängig
                    gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => window.location.assign("/cockpit")}
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              className="ml-auto"
              onClick={() =>
                oeffneTab({
                  id: `dokument-${Date.now()}`,
                  title: "Neues Dokument",
                  typ: "dokument",
                })
              }
            >
              Dokument erstellen
            </Button>
          </CardFooter>
        </Card>

        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Vorgeschlagene Subunternehmer</CardTitle>
            <Input
              type="search"
              aria-label="Verträge durchsuchen"
              placeholder="Verträge durchsuchen …"
              value={vertragsSuche}
              onChange={(event) => setVertragsSuche(event.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={keywordsLaden}
              onClick={keywordsVorschlagen}
            >
              {keywordsLaden ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
              {keywordsLaden ? "Keywords werden erstellt …" : "Keywords vorschlagen"}
            </Button>
          </CardHeader>
          <ScrollArea className="min-h-0 flex-1">
            <CardContent>
              <ul className="flex flex-col gap-2">
                {gefilterteSubunternehmer.length === 0 && (
                  <li className="text-xs text-muted-foreground">Keine Verträge gefunden</li>
                )}
                {gefilterteSubunternehmer.map((unternehmer) => (
                  <li key={unternehmer.id}>
                    <SubunternehmerEintrag
                      name={unternehmer.name}
                      vertraege={unternehmer.vertraege}
                      betroffeneVertraege={betroffeneNamen}
                      onToggleVertrag={(vertrag) => toggleVertrag(vertrag, unternehmer.name)}
                      onOeffneVertrag={(vertrag) => oeffneTab(dateiTab(vertrag))}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Mittlere Spalte: Anzeige mit Tabs für geöffnete Dateien */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>Anzeige</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {tabs.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 rounded-md border bg-muted p-6 text-center text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Keine Datei geöffnet</span>
              Öffne links ein Bild, einen Anhang oder einen Vertrag, oder erstelle ein Dokument.
            </div>
          ) : (
            <Tabs
              value={aktiverTab}
              onValueChange={setAktiverTab}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden bg-transparent px-0 py-1 group-data-horizontal/tabs:h-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
                {tabs.map((tab) => {
                  const aktiv = tab.id === aktiverTab;
                  return (
                    <div
                      key={tab.id}
                      className={`flex shrink-0 items-center rounded-md ${
                        aktiv
                          ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <TabsTrigger
                        value={tab.id}
                        className={`h-9 min-w-0 max-w-40 flex-none border-0 bg-transparent data-active:bg-transparent dark:data-active:border-transparent dark:data-active:bg-transparent ${
                          aktiv ? "font-semibold" : ""
                        }`}
                      >
                        <span className="min-w-0 truncate" title={tab.title}>
                          {tab.title}
                        </span>
                      </TabsTrigger>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${tab.title} schließen`}
                        onClick={() => schliesseTab(tab.id)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  );
                })}
              </TabsList>

              {tabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="flex h-0 min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
                >
                  {tab.typ === "dokument" && tab.dokumentTyp && (
                    <Metadaten
                      datum={metadaten.datum}
                      betroffeneVertraege={betroffeneVertraege}
                      deadline={metadaten.deadline}
                      prioritaet={metadaten.prioritaet}
                      onEntferneVertrag={entferneVertrag}
                      onChangeDeadline={(deadline) =>
                        setMetadaten((current) => ({ ...current, deadline }))
                      }
                      onChangePrioritaet={(prioritaet) =>
                        setMetadaten((current) => ({ ...current, prioritaet }))
                      }
                    />
                  )}
                  <TabInhalt
                    tab={tab}
                    onWaehleDokumentTyp={(typ) => setzeDokumentTyp(tab.id, typ)}
                    onAendereInhalt={(inhalt) => setzeInhalt(tab.id, inhalt)}
                    onAbbrechen={() => schliesseTab(tab.id)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            disabled={!exportText}
            onClick={() => alsPdfHerunterladen(exportTitel, exportText)}
          >
            PDF
          </Button>
          <Button
            variant="outline"
            disabled={!exportText}
            onClick={() => alsWordHerunterladen(exportTitel, exportText)}
          >
            Word
          </Button>
          <Button variant="outline" onClick={() => setMailOffen(true)}>
            <MailIcon />
            Mail
          </Button>
        </CardFooter>
      </Card>

      {/* Rechte Spalte: KI-Chat */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>KI-Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 pr-3">
              {chatVerlauf.map((nachricht) => {
                const istKi = nachricht.rolle === "ki";
                return (
                  <Fragment key={nachricht.id}>
                    <Message align={istKi ? "start" : "end"}>
                      <MessageContent>
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 ${
                            istKi
                              ? "self-start bg-muted"
                              : "self-end bg-primary text-primary-foreground"
                          }`}
                        >
                          {nachricht.text}
                        </div>
                      </MessageContent>
                    </Message>
                    {nachricht.aktion && (
                      <div className="flex flex-col gap-2">
                        <Marker>
                          <MarkerIcon>
                            <FileTextIcon />
                          </MarkerIcon>
                          <MarkerContent>{nachricht.aktion}</MarkerContent>
                        </Marker>
                        {nachricht.hatAenderungsAktion && (
                          <>
                            <Marker>
                              <MarkerIcon>
                                <CheckIcon />
                              </MarkerIcon>
                              <MarkerContent>Änderung übernehmen</MarkerContent>
                            </Marker>
                            <Marker>
                              <MarkerIcon>
                                <RotateCcwIcon />
                              </MarkerIcon>
                              <MarkerContent>Änderung verwerfen</MarkerContent>
                            </Marker>
                          </>
                        )}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </ScrollArea>
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Nachricht an die KI"
              className="flex-1"
              value={chatEingabe}
              onChange={(event) => setChatEingabe(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  nachrichtSenden();
                }
              }}
            />
            <Button
              size="icon"
              aria-label="Senden"
              disabled={!chatEingabe.trim()}
              onClick={nachrichtSenden}
            >
              <SendIcon />
            </Button>
          </div>
        </CardContent>
      </Card>

      <MailDialog
        open={mailOffen}
        onOpenChange={setMailOffen}
        betroffeneVertraege={betroffeneVertraege}
        deadline={metadaten.deadline}
        dokumentTyp={aktuellerTab?.dokumentTyp}
        dokumentText={mailText}
        zusammenfassung={zusammenfassung}
      />
      </div>
    </div>
  );
}

const MAIL_DIENSTE = [
  { id: "gmail", name: "Gmail" },
  { id: "outlook", name: "Outlook" },
  { id: "proton", name: "Proton Mail" },
] as const;

type MailDienstId = (typeof MAIL_DIENSTE)[number]["id"];

const MAIL_DIENST_KEY = "mail-dienst";
const BAUVORHABEN = "Wohnanlage Lindenhof, Haus B";

const ladeMailDienst = (): MailDienstId | null => {
  try {
    const gespeichert = localStorage.getItem(MAIL_DIENST_KEY);
    return MAIL_DIENSTE.find((dienst) => dienst.id === gespeichert)?.id ?? null;
  } catch {
    return null;
  }
};

/** Derives a mock mail address from a company name: "Huber Tiefbau GmbH" -> "huber-tiefbau.bau@yahoo.de". */
const leiteEmpfaengerAb = (firmenname: string) => {
  const slug = firmenname
    .replace(/\(.*?\)/g, "")
    .replace(/\b(GmbH|KG|& Co\.?|AG|UG)\b/gi, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}.bau@yahoo.de`;
};

const formatiereDatum = (iso: string) => new Date(iso).toLocaleDateString("de-DE");

function MailDialog({
  open,
  onOpenChange,
  betroffeneVertraege,
  deadline,
  dokumentTyp,
  dokumentText,
  zusammenfassung,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betroffeneVertraege: BetroffenerVertrag[];
  deadline: string;
  dokumentTyp?: string;
  dokumentText: string;
  zusammenfassung: string;
}) {
  const [dienst, setDienst] = useState<MailDienstId | null>(ladeMailDienst);

  const waehleDienst = (id: MailDienstId) => {
    setDienst(id);
    try {
      localStorage.setItem(MAIL_DIENST_KEY, id);
    } catch {
      // Speicher nicht verfügbar: Auswahl gilt nur für diese Sitzung.
    }
  };

  const dienstName = MAIL_DIENSTE.find((eintrag) => eintrag.id === dienst)?.name;

  const empfaenger = [...new Set(betroffeneVertraege.map((eintrag) => eintrag.unternehmer))]
    .map(leiteEmpfaengerAb)
    .join(", ");
  const betreff = [dokumentTyp, betroffeneVertraege[0]?.vertrag.replace(/\.pdf$/, ""), BAUVORHABEN]
    .filter(Boolean)
    .join(" – ");
  const frist = deadline ? `\n\nBitte um Rückmeldung bis ${formatiereDatum(deadline)}.` : "";
  const nachricht = dokumentText
    ? `${dokumentText}${frist}`
    : `Sehr geehrte Damen und Herren,\n\n${zusammenfassung}${frist}\n\nMit freundlichen Grüßen\nBauleitung`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {dienst && dienstName ? (
          <MailEntwurf
            dienstName={dienstName}
            initialEmpfaenger={empfaenger}
            initialBetreff={betreff}
            initialNachricht={nachricht}
            onWechsleDienst={() => setDienst(null)}
            onSchliessen={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Mail-Dienst auswählen</DialogTitle>
              <DialogDescription>
                Die Auswahl wird gespeichert und beim nächsten Mal automatisch verwendet.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {MAIL_DIENSTE.map((eintrag) => (
                <Button
                  key={eintrag.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => waehleDienst(eintrag.id)}
                >
                  <MailIcon />
                  {eintrag.name}
                </Button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MailEntwurf({
  dienstName,
  initialEmpfaenger,
  initialBetreff,
  initialNachricht,
  onWechsleDienst,
  onSchliessen,
}: {
  dienstName: string;
  initialEmpfaenger: string;
  initialBetreff: string;
  initialNachricht: string;
  onWechsleDienst: () => void;
  onSchliessen: () => void;
}) {
  const [empfaenger, setEmpfaenger] = useState(initialEmpfaenger);
  const [betreff, setBetreff] = useState(initialBetreff);
  const [nachricht, setNachricht] = useState(initialNachricht);
  const [gesendet, setGesendet] = useState(false);

  if (gesendet) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Mail gesendet</DialogTitle>
          <DialogDescription>
            Die Mail an {empfaenger} wurde über {dienstName} gesendet (Mock).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onSchliessen}>Schließen</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Mail über {dienstName}</DialogTitle>
        <DialogDescription>
          Entwurf aus den Metadaten und dem Dokument. Alle Felder sind bearbeitbar.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-empfaenger" className="text-xs">
            An
          </Label>
          <Input
            id="mail-empfaenger"
            value={empfaenger}
            placeholder="Keinen Vertrag ausgewählt: Empfänger eingeben"
            onChange={(event) => setEmpfaenger(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-betreff" className="text-xs">
            Betreff
          </Label>
          <Input
            id="mail-betreff"
            value={betreff}
            onChange={(event) => setBetreff(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-nachricht" className="text-xs">
            Nachricht
          </Label>
          <Textarea
            id="mail-nachricht"
            className="h-64 resize-none text-xs field-sizing-fixed"
            value={nachricht}
            onChange={(event) => setNachricht(event.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" onClick={onWechsleDienst}>
          Dienst wechseln
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button disabled={!empfaenger.trim()} onClick={() => setGesendet(true)}>
            <SendIcon />
            Senden
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function Metadaten({
  datum,
  betroffeneVertraege,
  deadline,
  prioritaet,
  onEntferneVertrag,
  onChangeDeadline,
  onChangePrioritaet,
}: {
  datum: Date;
  betroffeneVertraege: BetroffenerVertrag[];
  deadline: string;
  prioritaet: number;
  onEntferneVertrag: (vertrag: string) => void;
  onChangeDeadline: (deadline: string) => void;
  onChangePrioritaet: (prioritaet: number) => void;
}) {
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        className="justify-between"
        aria-expanded={showMetadata}
        onClick={() => setShowMetadata((current) => !current)}
      >
        Metadaten
        <ChevronDownIcon className={`transition-transform ${showMetadata ? "rotate-180" : ""}`} />
      </Button>

      {showMetadata && (
        <div className="flex flex-col gap-4 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Datum</span>
            <span className="text-xs tabular-nums">
              {datum.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Betroffene Verträge</span>
            {betroffeneVertraege.length === 0 ? (
              <span className="text-xs">Keine Auswahl</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {betroffeneVertraege.map((eintrag) => (
                  <li
                    key={eintrag.vertrag}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs">{eintrag.vertrag}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {eintrag.unternehmer}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${eintrag.vertrag} entfernen`}
                      onClick={() => onEntferneVertrag(eintrag.vertrag)}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="deadline" className="text-xs text-muted-foreground">
              Deadline bis nächster Schritt
            </Label>
            <Input
              id="deadline"
              type="date"
              className="w-40"
              value={deadline}
              onChange={(event) => onChangeDeadline(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Priorität</span>
            <PrioritySelect value={prioritaet} onChange={onChangePrioritaet} />
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityFlag({ priority }: { priority: number }) {
  const color = PRIORITY_COLORS[priority];
  return <FlagIcon style={{ color, fill: color, stroke: color }} />;
}

function PrioritySelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (priority: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger
        size="sm"
        hideIcon
        className="w-11 shrink-0 justify-center tabular-nums"
        aria-label="Priorität ändern"
      >
        <span className="flex items-center gap-1">
          <PriorityFlag priority={value} />
          {value}
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="min-w-0">
        {PRIORITIES.map((priority) => (
          <SelectItem key={priority} value={String(priority)} className="pr-7">
            <PriorityFlag priority={priority} />
            {priority}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SubunternehmerEintrag({
  name,
  vertraege,
  betroffeneVertraege,
  onToggleVertrag,
  onOeffneVertrag,
}: {
  name: string;
  vertraege: string[];
  betroffeneVertraege: string[];
  onToggleVertrag: (vertrag: string) => void;
  onOeffneVertrag: (vertrag: string) => void;
}) {
  const [offen, setOffen] = useState(false);

  return (
    <Collapsible open={offen} onOpenChange={setOffen} className="rounded-md border">
      <div className="flex items-center gap-2 p-2">
        <span className="flex-1 text-xs font-medium">{name}</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Verträge von ${name} ${offen ? "ausblenden" : "anzeigen"}`}
          >
            <ChevronDownIcon className={`transition-transform ${offen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-col gap-1 border-t p-2">
        <span className="text-xs text-muted-foreground">Verträge</span>
        {vertraege.map((vertrag) => (
          <Attachment key={vertrag} size="sm" className="w-full">
            <AttachmentMedia>
              <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{vertrag}</AttachmentTitle>
              <AttachmentDescription>Vertrag · PDF</AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger
              aria-label={`${vertrag} öffnen`}
              onClick={() => onOeffneVertrag(vertrag)}
            />
            <AttachmentActions>
              <Checkbox
                aria-label={`${vertrag} als betroffen auswählen`}
                checked={betroffeneVertraege.includes(vertrag)}
                onCheckedChange={() => onToggleVertrag(vertrag)}
              />
            </AttachmentActions>
          </Attachment>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function TabInhalt({
  tab,
  onWaehleDokumentTyp,
  onAendereInhalt,
  onAbbrechen,
}: {
  tab: Tab;
  onWaehleDokumentTyp: (typ: string) => void;
  onAendereInhalt: (inhalt: string) => void;
  onAbbrechen: () => void;
}) {
  if (tab.typ === "transkript") {
    return (
      <div className="rounded-md bg-muted p-3 text-xs whitespace-pre-line">{TRANSKRIPT_MOCK}</div>
    );
  }

  if (tab.typ === "dokument") {
    return tab.dokumentTyp ? (
      <Textarea
        aria-label={`${tab.dokumentTyp} bearbeiten`}
        value={tab.inhalt ?? ""}
        onChange={(event) => onAendereInhalt(event.target.value)}
        className="min-h-0 flex-1 resize-none text-xs field-sizing-fixed"
      />
    ) : (
      <DokumentTypAuswahl onWaehle={onWaehleDokumentTyp} onAbbrechen={onAbbrechen} />
    );
  }

  const vorschau = DATEI_VORSCHAU[tab.title] ?? VERTRAGS_VORSCHAU[tab.title];
  return vorschau ? (
    <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre-line">
      {vorschau}
    </div>
  ) : (
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
      {tab.title} · Vorschau nicht verfügbar
    </div>
  );
}

function DokumentTypAuswahl({
  onWaehle,
  onAbbrechen,
}: {
  onWaehle: (typ: string) => void;
  onAbbrechen: () => void;
}) {
  const [auswahl, setAuswahl] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 rounded-md border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">Dokumenttyp auswählen</h3>
        <p className="text-xs text-muted-foreground">
          Wähle die Art des Dokuments, das erstellt werden soll.
        </p>
      </div>
      <Select value={auswahl} onValueChange={setAuswahl}>
        <SelectTrigger aria-label="Dokumenttyp">
          <SelectValue placeholder="Dokumenttyp wählen" />
        </SelectTrigger>
        <SelectContent position="popper">
          {DOKUMENTTYPEN.map((typ) => (
            <SelectItem key={typ} value={typ}>
              {typ}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onAbbrechen}>
          Abbrechen
        </Button>
        <Button disabled={!auswahl} onClick={() => onWaehle(auswahl)}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
