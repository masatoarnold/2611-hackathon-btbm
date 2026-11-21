import { useRef, useState, type ChangeEvent } from "react";
import {
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { alsWordHerunterladen, inNeuemFensterOeffnen } from "@/lib/export";

// Mock-Daten (fiktives Projekt Wohnanlage Lindenhof, Haus B), bis die Anbindung steht
const MELDUNGSDATUM = "21.11.26";

const TAGESBERICHT = {
  datum: MELDUNGSDATUM,
  projekt: "Wohnanlage Lindenhof – Haus B",
  text: "Betonage Kellerwände Abschnitt B: Betonpumpe um 08:15 ausgefallen, Ersatzpumpe ab 10:30 im Einsatz. Transportbeton (10 t) ca. 2 h verspätet wegen Stau an der Zufahrt Nord, Betonage verschoben auf 11:45–15:30. Schalung Abschnitt C begonnen. 14 Arbeitskräfte vor Ort, trocken, 4–6 °C.",
};

const MELDUNGEN_ANSTEHEND_MOCK = [
  {
    id: "m-1",
    titel: "Meldung: Betonpumpe defekt",
    beschreibung:
      "Autobetonpumpe in Abschnitt B um 08:15 ausgefallen (Hydraulikschlauch geplatzt). Ersatzpumpe von Brandl Betonpumpen ab 10:30 im Einsatz.",
  },
  {
    id: "m-2",
    titel: "Meldung: Lieferung verspätet",
    beschreibung:
      "Transportbeton C25/30 (10 t) ca. 2 h verspätet, Stau an der Zufahrt Nord. Betonage Abschnitt B verschiebt sich auf 11:45–15:30.",
  },
  {
    id: "m-3",
    titel: "Meldung: Bewehrungspläne fehlen",
    beschreibung:
      "Freigegebene Bewehrungspläne für Abschnitt C liegen noch nicht vor. Beginn verschiebt sich voraussichtlich um 2 Arbeitstage, Behinderungsanzeige vorbereitet.",
  },
];

const MELDUNGEN_ABGESCHLOSSEN_MOCK = [
  {
    id: "m-4",
    titel: "Meldung: Kiesmangel",
    beschreibung: "Kies 0/32 (18 t) für die Sauberkeitsschicht um 08:05 nachgeliefert.",
  },
  {
    id: "m-5",
    titel: "Meeting: Baubesprechung Nr. 14",
    beschreibung:
      "Baubesprechung mit dem Bauherrn am 19.11.: Abdichtung Kellerwände und Grundwasserstand besprochen. Protokoll an alle Teilnehmer versendet.",
  },
];

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

const PHASEN = [
  "Einrichtung",
  "Rohbau",
  "Dach/Fassade",
  "Ausbau",
  "Tec Ausrüstung",
  "Außenanlagen",
];
const GEWERKE = ["Betonarbeiten", "Maurerarbeiten", "Stahlbau", "Holzbau", "Abdichtung"];

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

function ListenEintrag({ titel, status }: { titel: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
      <span>{titel}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{status}</span>
    </div>
  );
}

type Meldung = { id: string; titel: string; beschreibung: string };

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
      <h2 className="text-sm font-medium">{ueberschrift}</h2>
      <Separator />
      {meldungen.length === 0 && (
        <p className="text-sm text-muted-foreground">Keine Meldungen.</p>
      )}
      {meldungen.map((meldung) => {
        const { id, titel, beschreibung } = meldung;
        const aufgeklappt = aufgeklappteId === id;
        return (
          <div key={id} className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{titel}</span>
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
                <p className="min-h-32 text-sm text-muted-foreground">{beschreibung}</p>
                <div className="flex justify-end gap-1">
                  {mitAktionen && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Erledigt"
                        onClick={() => onErledigt?.(meldung)}
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Ablehnen"
                        onClick={() => onAblehnen?.(meldung)}
                      >
                        <XIcon />
                      </Button>
                    </>
                  )}
                  <Button variant="outline" asChild>
                    <a href={MELDUNG_WORKFLOW_PFAD}>Bearbeiten</a>
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

function AuswahlLeiste({
  optionen,
  aktiv,
  onSelect,
  size,
}: {
  optionen: string[];
  aktiv: string;
  onSelect: (option: string) => void;
  size: "sm" | "default";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {optionen.map((option) => (
        <Button
          key={option}
          size={size}
          variant={aktiv === option ? "secondary" : "outline"}
          onClick={() => onSelect(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

type Aufgabe = { id: string; titel: string; erledigt: boolean };

function AufgabenListe({
  aufgaben,
  onErledigen,
  onLoeschen,
}: {
  aufgaben: Aufgabe[];
  onErledigen: (id: string) => void;
  onLoeschen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {aufgaben.map(({ id, titel, erledigt }) => (
        <div key={id} className="flex items-center justify-between gap-2 rounded-md border p-2">
          <span className={`text-sm ${erledigt ? "text-muted-foreground line-through" : ""}`}>
            {titel}
          </span>
          <div className="flex gap-1">
            <Button
              variant={erledigt ? "secondary" : "outline"}
              size="icon"
              aria-label={erledigt ? "Aufgabe wieder öffnen" : "Aufgabe erledigen"}
              aria-pressed={erledigt}
              onClick={() => onErledigen(id)}
            >
              <CheckIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Aufgabe löschen"
              onClick={() => onLoeschen(id)}
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

  const [anstehend, setAnstehend] = useState<Meldung[]>(MELDUNGEN_ANSTEHEND_MOCK);
  const [abgeschlossen, setAbgeschlossen] = useState<Meldung[]>(MELDUNGEN_ABGESCHLOSSEN_MOCK);
  const [termine, setTermine] = useState(TERMINE_MOCK);
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(() =>
    AUFGABEN_MOCK.map((aufgabe) => ({ ...aufgabe, erledigt: false })),
  );
  const [planTab, setPlanTab] = useState("aufgaben");
  const [neuerEintragOffen, setNeuerEintragOffen] = useState(false);
  const [berichtText, setBerichtText] = useState(TAGESBERICHT.text);
  const [berichtBearbeiten, setBerichtBearbeiten] = useState(false);
  const [lieferanten, setLieferanten] = useState(LIEFERANTEN_MOCK);
  const vertragsInput = useRef<HTMLInputElement>(null);

  const berichtTitel = `Tagesbericht ${TAGESBERICHT.datum} ${TAGESBERICHT.projekt}`;

  const toggleMeldung = (id: string) =>
    setAufgeklappteMeldungId((aktuell) => (aktuell === id ? null : id));

  const meldungErledigen = (meldung: Meldung) => {
    setAnstehend((aktuell) => aktuell.filter(({ id }) => id !== meldung.id));
    setAbgeschlossen((aktuell) => [meldung, ...aktuell]);
  };

  const meldungAblehnen = (meldung: Meldung) =>
    setAnstehend((aktuell) => aktuell.filter(({ id }) => id !== meldung.id));

  const eintragHinzufuegen = (titel: string) => {
    const id = crypto.randomUUID();
    if (planTab === "termine") setTermine((aktuell) => [...aktuell, { id, titel }]);
    else setAufgaben((aktuell) => [...aktuell, { id, titel, erledigt: false }]);
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
      <header className="flex h-12 items-center border-b px-6">
        <h1 className="text-sm font-medium">Cockpit</h1>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 p-6">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Datum: {MELDUNGSDATUM}
            </Button>
            <Button variant="outline" size="sm">
              Meldungen
            </Button>
            <Button variant="outline" size="sm">
              Thema: Defekte
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
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
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="grid h-64 shrink-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
            <Card className="min-h-0 overflow-hidden">
              <CardHeader>
                <CardTitle>
                  Tagesbericht {TAGESBERICHT.datum}
                  <br />
                  {TAGESBERICHT.projekt}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto text-sm text-muted-foreground">
                {berichtBearbeiten ? (
                  <Textarea
                    autoFocus
                    aria-label="Tagesbericht bearbeiten"
                    value={berichtText}
                    onChange={(event) => setBerichtText(event.target.value)}
                    className="min-h-0 flex-1 resize-none field-sizing-fixed"
                  />
                ) : (
                  berichtText
                )}
              </CardContent>
              <CardContent className="flex justify-end gap-1">
                <Button
                  variant="outline"
                  onClick={() => inNeuemFensterOeffnen(berichtTitel, berichtText)}
                >
                  Bericht ansehen
                </Button>
                <Button
                  variant={berichtBearbeiten ? "secondary" : "outline"}
                  size="icon"
                  aria-label={berichtBearbeiten ? "Bearbeitung beenden" : "Bericht bearbeiten"}
                  aria-pressed={berichtBearbeiten}
                  onClick={() => setBerichtBearbeiten((aktuell) => !aktuell)}
                >
                  {berichtBearbeiten ? <CheckIcon /> : <PencilIcon />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Bericht herunterladen"
                  onClick={() => alsWordHerunterladen(berichtTitel, berichtText)}
                >
                  <DownloadIcon />
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
                <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                  {neuerEintragOffen && (
                    <NeuerEintrag
                      platzhalter={planTab === "termine" ? "Neuer Termin" : "Neue Aufgabe"}
                      onHinzufuegen={eintragHinzufuegen}
                      onAbbrechen={() => setNeuerEintragOffen(false)}
                    />
                  )}
                  <TabsContent value="termine" className="flex flex-col gap-2">
                    {termine.map(({ id, titel }) => (
                      <div key={id} className="rounded-md border p-2 text-sm">
                        {titel}
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="aufgaben">
                    <AufgabenListe
                      aufgaben={aufgaben}
                      onErledigen={(id) =>
                        setAufgaben((aktuell) =>
                          aktuell.map((aufgabe) =>
                            aufgabe.id === id ? { ...aufgabe, erledigt: !aufgabe.erledigt } : aufgabe,
                          ),
                        )
                      }
                      onLoeschen={(id) =>
                        setAufgaben((aktuell) => aktuell.filter((aufgabe) => aufgabe.id !== id))
                      }
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <Card className="min-h-0 flex-1 overflow-hidden">
            <Tabs
              defaultValue="lieferungen"
              className="flex h-full min-h-0 flex-col gap-(--card-spacing)"
            >
              <CardHeader className="shrink-0">
                <TabsList className="w-auto">
                  <TabsTrigger value="lieferungen">Lieferungen</TabsTrigger>
                  <TabsTrigger value="subunternehmer">Subunternehmer</TabsTrigger>
                  <TabsTrigger value="bauplaene">Baupläne</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto">
                <TabsContent value="lieferungen" className="flex flex-col gap-3">
                  <AuswahlLeiste
                    optionen={PHASEN}
                    aktiv={aktivePhase}
                    onSelect={setAktivePhase}
                    size="default"
                  />
                  <AuswahlLeiste
                    optionen={GEWERKE}
                    aktiv={aktivesGewerk}
                    onSelect={setAktivesGewerk}
                    size="sm"
                  />
                  <div className="grid h-72 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                    <div className="flex min-h-0 flex-col gap-3">
                      <div className="flex gap-2">
                        <Input placeholder="Stichwortsuche" aria-label="Stichwortsuche" />
                        <Button variant="outline" onClick={() => vertragsInput.current?.click()}>
                          Vertrag hinzufügen
                        </Button>
                        <input
                          ref={vertragsInput}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={vertragHinzufuegen}
                        />
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                        {lieferanten.map(({ id, titel, beschreibung }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setAusgewaehlterLieferantId(id)}
                            className={`flex h-16 shrink-0 items-start justify-between gap-2 rounded-md border p-3 text-left ${
                              ausgewaehlterLieferantId === id ? "border-primary" : ""
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
                            {beschreibung && (
                              <FileTextIcon className="size-6 text-muted-foreground" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-md border p-3">
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
                  </div>
                </TabsContent>
                <TabsContent value="subunternehmer" className="flex flex-col gap-2">
                  {SUBUNTERNEHMER_MOCK.map(({ id, titel, status }) => (
                    <ListenEintrag key={id} titel={titel} status={status} />
                  ))}
                </TabsContent>
                <TabsContent value="bauplaene" className="flex flex-col gap-2">
                  {BAUPLAENE_MOCK.map(({ id, titel, status }) => (
                    <ListenEintrag key={id} titel={titel} status={status} />
                  ))}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
