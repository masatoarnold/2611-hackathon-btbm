import { useRef, useState, type ChangeEvent } from "react";
import {
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { CockpitHeader } from "@/components/CockpitHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alsPdfHerunterladen, alsWordHerunterladen } from "@/lib/export";
import { anzeigeTitel, useMeldungen, type Meldung } from "@/lib/meldungen";
import { MailDialog } from "@/pages/Cockpit_Meldung_Workflow";

// Mock-Daten (fiktives Projekt Wohnanlage Lindenhof, Haus B), bis die Anbindung steht
const MELDUNGSDATUM = "21.11.26";

const TAGESBERICHT = {
  datum: MELDUNGSDATUM,
  projekt: "Wohnanlage Lindenhof – Haus B",
  zusammenfassung:
    "Betonpumpe ausgefallen, Ersatz ab 10:30. Beton ca. 2 h verspätet, Betonage 11:45–15:30.",
  abschnitte: [
    {
      titel: "Betonage Kellerwände Abschnitt B",
      text: "Betonpumpe um 08:15 ausgefallen, Ersatzpumpe ab 10:30 im Einsatz.",
    },
    {
      titel: "Lieferungen",
      text: "Transportbeton (10 t) ca. 2 h verspätet wegen Stau an der Zufahrt Nord, Betonage verschoben auf 11:45–15:30.",
    },
    { titel: "Weitere Arbeiten", text: "Schalung Abschnitt C begonnen." },
    { titel: "Personal und Witterung", text: "14 Arbeitskräfte vor Ort, trocken, 4–6 °C." },
  ],
};

type BerichtAbschnitt = { titel: string; text: string };

const berichtAlsText = (abschnitte: BerichtAbschnitt[]) =>
  abschnitte.map(({ titel, text }) => `${titel}\n${text}`).join("\n\n");

const TERMINE_MOCK = [
  { id: "t-1", titel: "Abstimmung Betonlieferant, 10:15" },
  { id: "t-2", titel: "Baubesprechung Bauherr, 14:00" },
  { id: "t-3", titel: "Abnahme Bewehrung Abschnitt C, Mo 07:30" },
];

const AUFGABEN_MOCK = [
  { id: "a-1", titel: "Ersatzpumpe Abschnitt B bestätigen" },
  { id: "a-2", titel: "Behinderungsanzeige Bewehrungspläne versenden" },
  { id: "a-3", titel: "Lieferschein Beton gegenzeichnen" },
  { id: "a-4", titel: "Winterbaumaßnahmen ab 29.11. planen" },
];

const KEINE_AUSWAHL = "keine-auswahl";
const PHASEN = [
  "Einrichtung",
  "Rohbau",
  "Dach/Fassade",
  "Ausbau",
  "Ausrüstung",
  "Außenanlagen",
];
const GEWERKE = ["Betonarbeiten", "Mauerarbeiten", "Stahlbau", "Holzbau", "Abdichtung"];

type Lieferant = { id: string; titel: string; beschreibung: string; vorschau?: string };

const LIEFERANTEN_MOCK: Lieferant[] = [
  {
    id: "l-1",
    titel: "Isar Transportbeton GmbH",
    beschreibung: "Transportbeton · Liefervertrag 2026",
    vorschau:
      "Heute: C25/30, 10 t, Ankunft 11:38 statt 09:40.\nNächste Lieferung: Mo 07:00, C25/30, 24 t (Bodenplatte C).\n§ 5 Lieferzeit: Wartezeiten trägt der Lieferant, soweit er sie zu vertreten hat.",
  },
  {
    id: "l-2",
    titel: "Brandl Betonpumpen",
    beschreibung: "Autobetonpumpe 36 m · Mietvertrag",
    vorschau:
      "Heute: Ausfall 08:15, Ersatzgerät ab 10:30.\n§ 4 Ausfall: Ersatz binnen 3 Stunden, Ausfallzeiten werden nicht berechnet.",
  },
  {
    id: "l-3",
    titel: "Stahlhandel Obermaier",
    beschreibung: "Bewehrungsstahl BSt 500 · Rahmenvertrag",
    vorschau: "Nächste Lieferung: Mo 07:00, 4,2 t für Abschnitt C.\nEngpass bis KW 49 gemeldet.",
  },
  {
    id: "l-4",
    titel: "Personal",
    beschreibung: "",
    vorschau: "14 Arbeitskräfte vor Ort: Rohbau 9, Tiefbau 3, Bauleitung 2.",
  },
];

const SUBUNTERNEHMER_MOCK = [
  { id: "s-1", titel: "Kessler Rohbau GmbH & Co. KG", status: "9 Arbeitskräfte vor Ort" },
  { id: "s-2", titel: "Huber Tiefbau GmbH", status: "3 Arbeitskräfte vor Ort" },
  { id: "s-3", titel: "Elektro Lechner GmbH", status: "Baustrom, ab Decke über EG" },
  { id: "s-4", titel: "Wagner Haustechnik GmbH", status: "Grundleitungen vor Bodenplatte C" },
];

const BAUPLAENE_MOCK = [
  { id: "b-1", titel: "Grundriss UG, Index C", status: "freigegeben 12.11." },
  { id: "b-2", titel: "Bewehrungsplan Kellerwände Abschnitt B", status: "freigegeben 14.11." },
  { id: "b-3", titel: "Bewehrungsplan Abschnitt C", status: "fehlt, angefordert 18.11." },
  { id: "b-4", titel: "Abdichtungsdetail Kellerwand", status: "in Prüfung" },
];

/** Round, tinted icon buttons: green confirms, red removes. */
const ICON_GRUEN = "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800";
const ICON_ROT = "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700";

function ListenEintrag({ titel, status }: { titel: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-background p-3 text-sm">
      <span>{titel}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{status}</span>
    </div>
  );
}

const MELDUNG_WORKFLOW_PFAD = "/cockpit/meldung";

function MeldungsListe({
  ueberschrift,
  meldungen,
  aufgeklappteId,
  onToggle,
  onErledigt,
  onAblehnen,
}: {
  ueberschrift: string;
  meldungen: Meldung[];
  aufgeklappteId: string | null;
  onToggle: (id: string) => void;
  /** Without these handlers the list is read-only (no Erledigt/Ablehnen buttons). */
  onErledigt?: (meldung: Meldung) => void;
  onAblehnen?: (meldung: Meldung) => void;
}) {
  const mitAktionen = Boolean(onErledigt && onAblehnen);
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-primary">{ueberschrift}</h2>
      <Separator />
      {meldungen.length === 0 && (
        <p className="text-sm text-muted-foreground">Keine Meldungen.</p>
      )}
      {meldungen.map((meldung) => {
        const { id, content, attachments } = meldung;
        const titel = anzeigeTitel(meldung);
        const bilder = attachments.filter((anhang) => anhang.typ === "bild" && anhang.url);
        const aufgeklappt = aufgeklappteId === id;
        return (
          <div key={id} className="flex flex-col gap-3 rounded-xl bg-background p-3.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className={`min-w-0 flex-1 text-left text-sm hover:underline ${
                  mitAktionen ? "" : "text-muted-foreground"
                }`}
                aria-expanded={aufgeklappt}
                onClick={() => onToggle(id)}
              >
                {titel}
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Meldung ansehen"
                aria-expanded={aufgeklappt}
                onClick={() => onToggle(id)}
              >
                <EyeIcon />
              </Button>
            </div>
            {aufgeklappt && (
              <>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{content}</p>
                {bilder.length > 0 && (
                  <ul className="grid grid-cols-3 gap-2">
                    {bilder.map((bild) => (
                      <li key={bild.id}>
                        <img
                          src={bild.url}
                          alt={bild.name}
                          loading="lazy"
                          className="aspect-square w-full rounded-md border object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end gap-1">
                  {mitAktionen && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Erledigt"
                        className={ICON_GRUEN}
                        onClick={() => onErledigt?.(meldung)}
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ablehnen"
                        className={ICON_ROT}
                        onClick={() => onAblehnen?.(meldung)}
                      >
                        <XIcon />
                      </Button>
                    </>
                  )}
                  <Button variant="outline" asChild>
                    <a href={`${MELDUNG_WORKFLOW_PFAD}?id=${encodeURIComponent(id)}`}>
                      Bearbeiten
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}

type Aufgabe = { id: string; titel: string };

/** Green (erledigt) and red (verwerfen) both take the task off the list. */
function AufgabenListe({
  aufgaben,
  onEntfernen,
}: {
  aufgaben: Aufgabe[];
  onEntfernen: (id: string) => void;
}) {
  if (aufgaben.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine offenen Aufgaben.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {aufgaben.map(({ id, titel }) => (
        <div key={id} className="flex items-center justify-between gap-2 rounded-xl bg-background p-2.5">
          <span className="min-w-0 flex-1 text-sm hyphens-auto">{titel}</span>
          <div className="flex shrink-0 gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aufgabe erledigt"
              className={ICON_GRUEN}
              onClick={() => onEntfernen(id)}
            >
              <CheckIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aufgabe verwerfen"
              className={ICON_ROT}
              onClick={() => onEntfernen(id)}
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Input row shown when adding a Termin or an Aufgabe. */
function NeuerEintrag({
  platzhalter,
  onHinzufuegen,
  onAbbrechen,
}: {
  platzhalter: string;
  onHinzufuegen: (titel: string) => void;
  onAbbrechen: () => void;
}) {
  const [titel, setTitel] = useState("");
  const hinzufuegen = () => {
    if (titel.trim()) onHinzufuegen(titel.trim());
  };

  return (
    <div className="flex gap-2">
      <Input
        autoFocus
        value={titel}
        placeholder={platzhalter}
        aria-label={platzhalter}
        onChange={(event) => setTitel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") hinzufuegen();
          if (event.key === "Escape") onAbbrechen();
        }}
      />
      <Button variant="outline" size="icon" aria-label="Übernehmen" onClick={hinzufuegen}>
        <CheckIcon />
      </Button>
    </div>
  );
}

export function Cockpit() {
  const [aufgeklappteMeldungId, setAufgeklappteMeldungId] = useState<string | null>("m-1");
  const [aktivePhase, setAktivePhase] = useState(PHASEN[1] ?? "");
  const [aktivesGewerk, setAktivesGewerk] = useState(GEWERKE[1] ?? "");
  const [ausgewaehlterLieferantId, setAusgewaehlterLieferantId] = useState<string | null>("l-1");

  const { meldungen, fehler: meldungenFehler, aendere: aendereMeldung } = useMeldungen();
  const anstehend = meldungen.filter(({ status }) => status === "anstehend");
  const abgeschlossen = meldungen.filter(({ status }) => status === "abgeschlossen");
  const [termine, setTermine] = useState(TERMINE_MOCK);
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(() =>
    AUFGABEN_MOCK,
  );
  const [planTab, setPlanTab] = useState("aufgaben");
  const [neuerEintragOffen, setNeuerEintragOffen] = useState(false);
  const [berichtAbschnitte, setBerichtAbschnitte] = useState<BerichtAbschnitt[]>(
    TAGESBERICHT.abschnitte,
  );
  const [berichtOffen, setBerichtOffen] = useState(false);
  const [mailOffen, setMailOffen] = useState(false);
  const [lieferanten, setLieferanten] = useState(LIEFERANTEN_MOCK);
  const vertragsInput = useRef<HTMLInputElement>(null);

  const berichtText = berichtAlsText(berichtAbschnitte);
  const berichtTitel = `Tagesbericht ${TAGESBERICHT.datum} ${TAGESBERICHT.projekt}`;

  const toggleMeldung = (id: string) =>
    setAufgeklappteMeldungId((aktuell) => (aktuell === id ? null : id));

  const meldungErledigen = (meldung: Meldung) =>
    aendereMeldung(meldung.id, { status: "abgeschlossen" }, { sofort: true });

  const meldungAblehnen = (meldung: Meldung) =>
    aendereMeldung(meldung.id, { status: "abgelehnt" }, { sofort: true });

  const eintragHinzufuegen = (titel: string) => {
    const id = crypto.randomUUID();
    if (planTab === "termine") setTermine((aktuell) => [...aktuell, { id, titel }]);
    else setAufgaben((aktuell) => [...aktuell, { id, titel }]);
    setNeuerEintragOffen(false);
  };

  const vertragHinzufuegen = (event: ChangeEvent<HTMLInputElement>) => {
    const datei = event.target.files?.[0];
    if (!datei) return;
    const id = crypto.randomUUID();
    setLieferanten((aktuell) => [...aktuell, { id, titel: datei.name, beschreibung: "Vertrag" }]);
    setAusgewaehlterLieferantId(id);
    event.target.value = "";
  };

  const ausgewaehlterLieferant = lieferanten.find(({ id }) => id === ausgewaehlterLieferantId);

  return (
    <div className="flex h-screen min-w-5xl flex-col overflow-hidden bg-background text-foreground">
      <CockpitHeader projekt={TAGESBERICHT.projekt} datum={MELDUNGSDATUM} />

      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 p-6">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <CardTitle>Meldungen</CardTitle>
            <span className="text-xs text-muted-foreground">
              {anstehend.length} anstehend · {abgeschlossen.length} abgeschlossen
            </span>
          </CardHeader>
          <ScrollArea className="min-h-0 flex-1">
            <CardContent className="flex flex-col gap-6">
              {meldungenFehler && <p className="text-sm text-destructive">{meldungenFehler}</p>}
              <MeldungsListe
                ueberschrift="Anstehend"
                meldungen={anstehend}
                aufgeklappteId={aufgeklappteMeldungId}
                onToggle={toggleMeldung}
                onErledigt={meldungErledigen}
                onAblehnen={meldungAblehnen}
              />
              <MeldungsListe
                ueberschrift="Abgeschlossen"
                meldungen={abgeschlossen}
                aufgeklappteId={aufgeklappteMeldungId}
                onToggle={toggleMeldung}
              />
            </CardContent>
          </ScrollArea>
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid h-56 shrink-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
            <Card className="min-h-0 overflow-hidden">
              <CardHeader>
                <CardTitle>
                  Tagesbericht {TAGESBERICHT.datum}
                  <br />
                  {TAGESBERICHT.projekt}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 text-sm text-muted-foreground">
                {TAGESBERICHT.zusammenfassung}
              </CardContent>
              <CardContent className="flex justify-end">
                <Button variant="outline" onClick={() => setBerichtOffen(true)}>
                  Bericht sehen
                </Button>
              </CardContent>
            </Card>

            <Card className="min-h-0 overflow-hidden">
              <Tabs
                value={planTab}
                onValueChange={(tab) => {
                  setPlanTab(tab);
                  setNeuerEintragOffen(false);
                }}
                className="flex h-full min-h-0 flex-col gap-(--card-spacing)"
              >
                <CardHeader className="flex shrink-0 items-center justify-center gap-2">
                  <TabsList className="w-auto">
                    <TabsTrigger value="termine">Termine</TabsTrigger>
                    <TabsTrigger value="aufgaben">Aufgaben</TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={planTab === "termine" ? "Termin hinzufügen" : "Aufgabe hinzufügen"}
                    onClick={() => setNeuerEintragOffen(true)}
                  >
                    <PlusIcon />
                  </Button>
                </CardHeader>
                <ScrollArea className="min-h-0 flex-1">
                  <CardContent className="flex flex-col gap-2">
                    {neuerEintragOffen && (
                      <NeuerEintrag
                        platzhalter={planTab === "termine" ? "Neuer Termin" : "Neue Aufgabe"}
                        onHinzufuegen={eintragHinzufuegen}
                        onAbbrechen={() => setNeuerEintragOffen(false)}
                      />
                    )}
                    <TabsContent value="termine" className="flex flex-col gap-2">
                      {termine.map(({ id, titel }) => (
                        <div key={id} className="rounded-xl bg-background p-3 text-sm">
                          {titel}
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="aufgaben">
                      <AufgabenListe
                        aufgaben={aufgaben}
                        onEntfernen={(id) =>
                          setAufgaben((aktuell) => aktuell.filter((aufgabe) => aufgabe.id !== id))
                        }
                      />
                    </TabsContent>
                  </CardContent>
                </ScrollArea>
              </Tabs>
            </Card>
          </div>

          <Card className="min-h-0 flex-1 overflow-hidden">
            <Tabs
              defaultValue="vertraege"
              className="flex h-full min-h-0 flex-col gap-(--card-spacing)"
            >
              <CardHeader className="shrink-0">
                <TabsList className="w-auto">
                  <TabsTrigger value="vertraege">Verträge</TabsTrigger>
                  <TabsTrigger value="bauplaene">Baupläne</TabsTrigger>
                  <TabsTrigger value="lieferungen">Lieferungen</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto">
                <TabsContent
                  value="vertraege"
                  className="grid h-full min-h-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4"
                >
                    <div className="flex min-h-0 flex-col gap-3">
                      <div className="flex gap-2">
                        <Input placeholder="Stichwortsuche" aria-label="Stichwortsuche" />
                        <Select value={aktivePhase} onValueChange={setAktivePhase}>
                          <SelectTrigger aria-label="Phase" className="w-40 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={KEINE_AUSWAHL}>Keine Auswahl</SelectItem>
                            {PHASEN.map((phase) => (
                              <SelectItem key={phase} value={phase}>
                                {phase}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={aktivesGewerk} onValueChange={setAktivesGewerk}>
                          <SelectTrigger aria-label="Gewerk" className="w-40 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={KEINE_AUSWAHL}>Keine Auswahl</SelectItem>
                            {GEWERKE.map((gewerk) => (
                              <SelectItem key={gewerk} value={gewerk}>
                                {gewerk}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-2">
                      <ScrollArea className="min-h-0 flex-1">
                        <div className="flex flex-col gap-2 pr-3">
                          {lieferanten.map(({ id, titel, beschreibung }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setAusgewaehlterLieferantId(id)}
                              className={`flex h-14 shrink-0 items-start justify-between gap-2 rounded-lg bg-background px-3 py-2 text-left ${
                                ausgewaehlterLieferantId === id ? "ring-2 ring-inset ring-primary" : ""
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{titel}</span>
                                {beschreibung && (
                                  <span className="text-xs text-muted-foreground">
                                    {beschreibung}
                                  </span>
                                )}
                              </div>
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border">
                                <FileTextIcon className="size-5 text-muted-foreground" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                      <Separator />
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Vertrag hinzufügen"
                          onClick={() => vertragsInput.current?.click()}
                        >
                          <PlusIcon />
                        </Button>
                        <input
                          ref={vertragsInput}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={vertragHinzufuegen}
                        />
                      </div>
                      </div>
                    </div>
                    <ScrollArea className="h-full min-h-0 rounded-xl bg-background">
                    <div className="flex flex-col gap-2 p-3">
                      <span className="text-sm">Vorschau</span>
                      {ausgewaehlterLieferant && (
                        <>
                          <span className="text-xs font-medium">{ausgewaehlterLieferant.titel}</span>
                          <span className="text-xs whitespace-pre-line text-muted-foreground">
                            {ausgewaehlterLieferant.vorschau ?? ausgewaehlterLieferant.beschreibung}
                          </span>
                        </>
                      )}
                    </div>
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="bauplaene" className="flex flex-col gap-2">
                  {BAUPLAENE_MOCK.map(({ id, titel, status }) => (
                    <ListenEintrag key={id} titel={titel} status={status} />
                  ))}
                </TabsContent>
                <TabsContent value="lieferungen" className="flex flex-col gap-2">
                  {SUBUNTERNEHMER_MOCK.map(({ id, titel, status }) => (
                    <ListenEintrag key={id} titel={titel} status={status} />
                  ))}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>

      <Dialog open={berichtOffen} onOpenChange={setBerichtOffen}>
        <DialogContent className="h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tagesbericht</DialogTitle>
          </DialogHeader>
          <ScrollArea className="min-h-0 rounded-xl bg-background">
            <article aria-label="Tagesbericht bearbeiten" className="flex flex-col gap-4 p-4">
              <h1 className="text-lg font-semibold">{berichtTitel}</h1>
              {berichtAbschnitte.map(({ titel, text }, index) => (
                <section key={titel} className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold text-primary">{titel}</h2>
                  <p
                    contentEditable="plaintext-only"
                    suppressContentEditableWarning
                    aria-label={`${titel} bearbeiten`}
                    className="rounded-md text-sm whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onBlur={(event) => {
                      const neuerText = event.currentTarget.innerText;
                      setBerichtAbschnitte((aktuell) =>
                        aktuell.map((abschnitt, i) =>
                          i === index ? { ...abschnitt, text: neuerText } : abschnitt,
                        ),
                      );
                    }}
                  >
                    {text}
                  </p>
                </section>
              ))}
            </article>
          </ScrollArea>
          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={() => alsPdfHerunterladen(berichtTitel, berichtText)}>
              PDF
            </Button>
            <Button variant="outline" onClick={() => alsWordHerunterladen(berichtTitel, berichtText)}>
              Word
            </Button>
            <Button variant="outline" onClick={() => setMailOffen(true)}>
              <MailIcon />
              Mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MailDialog
        open={mailOffen}
        onOpenChange={setMailOffen}
        betroffeneVertraege={[]}
        deadline=""
        dokumentTyp="Tagesbericht"
        dokumentText={berichtText}
        zusammenfassung={TAGESBERICHT.zusammenfassung}
      />
    </div>
  );
}
