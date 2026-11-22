import { useRef, useState, type ChangeEvent } from "react";
import {
  CheckIcon,
  EyeIcon,
  FlagIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
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
import { CockpitHeader } from "@/components/CockpitHeader";
import {
  PUMPEN_VERTRAG,
  ROHBAU_VERTRAG,
  STAHL_VERTRAG,
  TIEFBAU_VERTRAG,
  TRANSPORTBETON_VERTRAG,
  type Vertrag,
} from "@/lib/vertraege";
import { PRIORITY_COLORS, PriorityFlag } from "@/components/PriorityFlag";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
const MELDUNGSDATUM = new Date().toLocaleDateString("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

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
    {
      titel: "Personal und Witterung",
      text: "14 Arbeitskräfte vor Ort, trocken, 4–6 °C.",
    },
  ],
};

type BerichtAbschnitt = { titel: string; text: string };

const berichtAlsText = (abschnitte: BerichtAbschnitt[]) =>
  abschnitte.map(({ titel, text }) => `${titel}\n${text}`).join("\n\n");

const KEINE_AUSWAHL = "keine-auswahl";
const PHASEN = [
  "Einrichtung",
  "Rohbau",
  "Dach/Fassade",
  "Ausbau",
  "Ausrüstung",
  "Außenanlagen",
];
const GEWERKE = [
  "Betonarbeiten",
  "Mauerarbeiten",
  "Stahlbau",
  "Holzbau",
  "Abdichtung",
];

type Lieferant = {
  id: string;
  titel: string;
  beschreibung: string;
  vorschau?: string;
  vertrag?: Vertrag;
};

const LIEFERANTEN_MOCK: Lieferant[] = [
  {
    id: "l-1",
    titel: "Isar Transportbeton GmbH",
    beschreibung: "Transportbeton · Liefervertrag 2026",
    vertrag: TRANSPORTBETON_VERTRAG,
  },
  {
    id: "l-2",
    titel: "Brandl Betonpumpen",
    beschreibung: "Autobetonpumpe 36 m · Mietvertrag",
    vertrag: PUMPEN_VERTRAG,
  },
  {
    id: "l-3",
    titel: "Stahlhandel Obermaier",
    beschreibung: "Bewehrungsstahl BSt 500 · Rahmenvertrag",
    vertrag: STAHL_VERTRAG,
  },
  {
    id: "l-5",
    titel: "Kessler Rohbau GmbH & Co. KG",
    beschreibung: "Stahlbetonarbeiten Haus B · Nachunternehmervertrag",
    vertrag: ROHBAU_VERTRAG,
  },
  {
    id: "l-6",
    titel: "Huber Tiefbau GmbH",
    beschreibung: "Baugrube und Verbau · Rahmenvertrag",
    vertrag: TIEFBAU_VERTRAG,
  },
];

/** A contract as numbered paragraphs, like a printed document. */
function VertragText({ vertrag }: { vertrag: Vertrag }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {vertrag.kopf.map((zeile) => (
          <span key={zeile}>{zeile}</span>
        ))}
      </div>
      {vertrag.paragraphen.map(({ titel, text }, index) => (
        <section key={titel} className="flex flex-col gap-1">
          <h3 className="font-semibold">
            § {index + 1} {titel}
          </h3>
          <p className="leading-relaxed">{text}</p>
        </section>
      ))}
      <p className="border-t pt-3 text-xs text-muted-foreground">
        {vertrag.unterschrift}
      </p>
    </div>
  );
}

const SUBUNTERNEHMER_MOCK = [
  {
    id: "s-1",
    titel: "Kessler Rohbau GmbH & Co. KG",
    status: "9 Arbeitskräfte vor Ort",
  },
  { id: "s-2", titel: "Huber Tiefbau GmbH", status: "3 Arbeitskräfte vor Ort" },
  {
    id: "s-3",
    titel: "Elektro Lechner GmbH",
    status: "Baustrom, ab Decke über EG",
  },
  {
    id: "s-4",
    titel: "Wagner Haustechnik GmbH",
    status: "Grundleitungen vor Bodenplatte C",
  },
];

const BAUPLAENE_MOCK = [
  { id: "b-1", titel: "Grundriss UG, Index C", status: "freigegeben 12.11." },
  {
    id: "b-2",
    titel: "Bewehrungsplan Kellerwände Abschnitt B",
    status: "freigegeben 14.11.",
  },
  {
    id: "b-3",
    titel: "Bewehrungsplan Abschnitt C",
    status: "fehlt, angefordert 18.11.",
  },
  { id: "b-4", titel: "Abdichtungsdetail Kellerwand", status: "in Prüfung" },
];

const TERMINE_HEUTE_MOCK = [
  {
    id: "t-1",
    titel: "Meeting Bauherr",
    startStunde: 8,
    dauerStunden: 1.5,
    eigen: true,
  },
  {
    id: "t-2",
    titel: "Parkettierung",
    startStunde: 8.5,
    dauerStunden: 2.5,
    eigen: false,
  },
  {
    id: "t-3",
    titel: "Abnahme Rohbau",
    startStunde: 10.5,
    dauerStunden: 1,
    eigen: true,
  },
  {
    id: "t-4",
    titel: "Glaslieferung",
    startStunde: 13,
    dauerStunden: 1,
    eigen: false,
  },
];

const AUFGABEN_MOCK = [
  { id: 1, titel: "Betonpumpe Abschnitt B prüfen", erledigt: false },
  { id: 2, titel: "Lieferschein Glas unterschreiben", erledigt: true },
  { id: 3, titel: "Abnahmeprotokoll Rohbau erstellen", erledigt: false },
  { id: 4, titel: "Sicherheitseinweisung Parkettierer", erledigt: true },
  { id: 5, titel: "Baustrom Container 2 kontrollieren", erledigt: false },
];

const formatUhrzeit = (stunde: number) => {
  const gesamtMinuten = Math.round(stunde * 60);
  return `${String(Math.floor(gesamtMinuten / 60)).padStart(2, "0")}:${String(gesamtMinuten % 60).padStart(2, "0")}`;
};

function ListenEintrag({ titel, status }: { titel: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-background p-3 text-sm">
      <span>{titel}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{status}</span>
    </div>
  );
}

function TermineListe() {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>Termine heute</CardTitle>
      </CardHeader>
      <ScrollArea className="min-h-0 flex-1">
        <CardContent className="flex flex-col gap-2">
          {TERMINE_HEUTE_MOCK.map(
            ({ id, titel, startStunde, dauerStunden, eigen }) => (
              <div
                key={id}
                className="flex items-center gap-3 rounded-xl bg-background p-3"
              >
                <span className="w-14 shrink-0 text-sm font-medium tabular-nums">
                  {formatUhrzeit(startStunde)}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">{titel}</span>
                  <span className="text-xs text-muted-foreground">
                    bis {formatUhrzeit(startStunde + dauerStunden)} Uhr ·{" "}
                    {eigen ? "Eigener Termin" : "Fremdgewerk"}
                  </span>
                </div>
              </div>
            ),
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

function AufgabenListe() {
  const [aufgaben, setAufgaben] = useState(AUFGABEN_MOCK);
  const [neueAufgabe, setNeueAufgabe] = useState("");

  const aufgabeUmschalten = (id: number) =>
    setAufgaben((aktuell) =>
      aktuell.map((aufgabe) =>
        aufgabe.id === id
          ? { ...aufgabe, erledigt: !aufgabe.erledigt }
          : aufgabe,
      ),
    );

  const aufgabeLoeschen = (id: number) =>
    setAufgaben((aktuell) => aktuell.filter((aufgabe) => aufgabe.id !== id));

  const aufgabeHinzufuegen = () => {
    const titel = neueAufgabe.trim();
    if (!titel) return;
    setAufgaben((aktuell) => [
      ...aktuell,
      { id: Date.now(), titel, erledigt: false },
    ]);
    setNeueAufgabe("");
  };

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>Aufgabenliste</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <ScrollArea className="-mr-3 min-h-0 flex-1">
          <ul className="flex flex-col gap-2 pr-3">
            {aufgaben.map(({ id, titel, erledigt }) => (
              <li
                key={id}
                className="flex items-start gap-3 rounded-xl bg-background p-3"
              >
                <Checkbox
                  id={`aufgabe-${id}`}
                  className="mt-0.5 border-2 border-primary"
                  checked={erledigt}
                  onCheckedChange={() => aufgabeUmschalten(id)}
                />
                <label
                  htmlFor={`aufgabe-${id}`}
                  className={`flex-1 text-sm ${erledigt ? "text-muted-foreground line-through" : ""}`}
                >
                  {titel}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${titel} löschen`}
                  onClick={() => aufgabeLoeschen(id)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
            {aufgaben.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Keine Aufgaben vorhanden.
              </p>
            )}
          </ul>
        </ScrollArea>
        <form
          className="flex shrink-0 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            aufgabeHinzufuegen();
          }}
        >
          <Input
            placeholder="Neue Aufgabe…"
            aria-label="Neue Aufgabe"
            value={neueAufgabe}
            onChange={(event) => setNeueAufgabe(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            className="disabled:opacity-100"
            aria-label="Aufgabe hinzufügen"
            disabled={!neueAufgabe.trim()}
          >
            <PlusIcon />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const MELDUNG_WORKFLOW_PFAD = "/cockpit/meldung";

/** Pending reports: most urgent first; reports of equal priority keep the newest on top. */
const nachPrioritaet = (a: Meldung, b: Meldung) =>
  b.priority - a.priority || b.timestamp.localeCompare(a.timestamp);

/** Completed reports: chronological, newest first. */
const nachZeit = (a: Meldung, b: Meldung) =>
  b.timestamp.localeCompare(a.timestamp);

const PRIORITAETEN = [1, 2, 3, 4, 5];

function PrioritySelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (priority: number) => void;
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger
        size="sm"
        hideIcon
        className="h-5 w-14 shrink-0 justify-center px-2 tabular-nums outline-none! ring-0! hover:border-input! hover:ring-0! focus:border-input! focus:ring-0! focus-visible:border-input! focus-visible:ring-0! data-[state=open]:border-input! data-[state=open]:ring-0!"
        aria-label="Priorität ändern"
      >
        <span className="flex items-center gap-1">
          <FlagIcon
            className="size-3.5"
            style={{
              color: PRIORITY_COLORS[value],
              fill: PRIORITY_COLORS[value],
              stroke: PRIORITY_COLORS[value],
            }}
          />
          {value}
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="min-w-0">
        {PRIORITAETEN.map((priority) => (
          <SelectItem
            key={priority}
            value={String(priority)}
            className="pr-7 text-xs"
          >
            <FlagIcon
              className="size-3.5"
              style={{
                color: PRIORITY_COLORS[priority],
                fill: PRIORITY_COLORS[priority],
                stroke: PRIORITY_COLORS[priority],
              }}
            />
            {priority}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MeldungsListe({
  ueberschrift,
  meldungen,
  aufgeklappteId,
  onToggle,
  onErledigt,
  onLoeschen,
  onPrioritaet,
}: {
  ueberschrift: string;
  meldungen: Meldung[];
  aufgeklappteId: string | null;
  onToggle: (id: string) => void;
  /** Without these handlers the list is read-only (no Erledigt/Löschen buttons). */
  onErledigt?: (meldung: Meldung) => void;
  onLoeschen?: (meldung: Meldung) => void;
  /** Without this handler the priority is shown as a plain flag. */
  onPrioritaet?: (meldung: Meldung, priority: number) => void;
}) {
  const mitAktionen = Boolean(onErledigt && onLoeschen);
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-primary">{ueberschrift}</h2>
      <Separator />
      {meldungen.length === 0 && (
        <p className="text-sm text-muted-foreground">Keine Meldungen.</p>
      )}
      {meldungen.map((meldung) => {
        const { id, content, attachments, priority } = meldung;
        const titel = anzeigeTitel(meldung);
        const bilder = attachments.filter(
          (anhang) => anhang.typ === "bild" && anhang.url,
        );
        const aufgeklappt = aufgeklappteId === id;
        return (
          <div
            key={id}
            className="flex flex-col gap-3 rounded-xl bg-background p-3.5"
          >
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
              {onPrioritaet ? (
                <PrioritySelect
                  value={priority}
                  onChange={(neuePrioritaet) =>
                    onPrioritaet(meldung, neuePrioritaet)
                  }
                />
              ) : (
                <PriorityFlag priority={priority} />
              )}
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
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {content}
                </p>
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
                        onClick={() => onErledigt?.(meldung)}
                      >
                        <CheckIcon />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Meldung löschen"
                          >
                            <Trash2Icon />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Meldung löschen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchtest du diese Meldung wirklich löschen? Diese
                              Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onLoeschen?.(meldung)}
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  <Button variant="outline" asChild>
                    <a
                      href={`${MELDUNG_WORKFLOW_PFAD}?id=${encodeURIComponent(id)}`}
                    >
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

export function Cockpit() {
  const [aufgeklappteMeldungId, setAufgeklappteMeldungId] = useState<
    string | null
  >("m-1");
  const [aktivePhase, setAktivePhase] = useState(PHASEN[1] ?? "");
  const [aktivesGewerk, setAktivesGewerk] = useState(GEWERKE[1] ?? "");
  const [offenerVertragId, setOffenerVertragId] = useState<string | null>(null);

  const {
    meldungen,
    fehler: meldungenFehler,
    aendere: aendereMeldung,
    loesche: loescheMeldung,
  } = useMeldungen();
  const anstehend = meldungen
    .filter(({ status }) => status === "anstehend")
    .sort(nachPrioritaet);
  const abgeschlossen = meldungen
    .filter(({ status }) => status === "abgeschlossen")
    .sort(nachZeit);
  const [berichtAbschnitte, setBerichtAbschnitte] = useState<
    BerichtAbschnitt[]
  >(TAGESBERICHT.abschnitte);

  const [mailOffen, setMailOffen] = useState(false);
  const [lieferanten, setLieferanten] = useState(LIEFERANTEN_MOCK);
  const vertragsInput = useRef<HTMLInputElement>(null);

  const berichtText = berichtAlsText(berichtAbschnitte);
  const berichtTitel = `Tagesbericht ${TAGESBERICHT.datum} ${TAGESBERICHT.projekt}`;

  const toggleMeldung = (id: string) =>
    setAufgeklappteMeldungId((aktuell) => (aktuell === id ? null : id));

  const meldungErledigen = (meldung: Meldung) =>
    aendereMeldung(meldung.id, { status: "abgeschlossen" }, { sofort: true });

  const meldungLoeschen = (meldung: Meldung) => loescheMeldung(meldung.id);

  const meldungPrioritaetAendern = (meldung: Meldung, priority: number) =>
    aendereMeldung(meldung.id, { priority }, { sofort: true });

  const vertragHinzufuegen = (event: ChangeEvent<HTMLInputElement>) => {
    const datei = event.target.files?.[0];
    if (!datei) return;
    const id = crypto.randomUUID();
    setLieferanten((aktuell) => [
      ...aktuell,
      { id, titel: datei.name, beschreibung: "Vertrag" },
    ]);
    event.target.value = "";
  };

  const offenerVertrag = lieferanten.find(({ id }) => id === offenerVertragId);

  return (
    <div className="flex h-screen min-w-5xl flex-col overflow-hidden bg-seite text-foreground">
      <CockpitHeader datum={MELDUNGSDATUM} />

      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,4fr)_minmax(0,6fr)_minmax(0,3fr)] gap-4 p-6">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <CardTitle>Meldungen</CardTitle>
            <span className="text-xs text-muted-foreground">
              {anstehend.length} anstehend · {abgeschlossen.length}{" "}
              abgeschlossen
            </span>
          </CardHeader>
          <ScrollArea className="min-h-0 flex-1">
            <CardContent className="flex flex-col gap-6">
              {meldungenFehler && (
                <p className="text-sm text-destructive">{meldungenFehler}</p>
              )}
              <MeldungsListe
                ueberschrift="Anstehend"
                meldungen={anstehend}
                aufgeklappteId={aufgeklappteMeldungId}
                onToggle={toggleMeldung}
                onErledigt={meldungErledigen}
                onLoeschen={meldungLoeschen}
                onPrioritaet={meldungPrioritaetAendern}
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

        <Card className="min-h-0 overflow-hidden">
          <Tabs
            defaultValue="tagesbericht"
            className="flex h-full min-h-0 flex-col gap-(--card-spacing)"
          >
            <CardHeader className="shrink-0">
              <TabsList className="w-auto">
                <TabsTrigger value="tagesbericht">Tagesbericht</TabsTrigger>
                <TabsTrigger value="vertraege">Verträge</TabsTrigger>
                <TabsTrigger value="bauplaene">Baupläne</TabsTrigger>
                <TabsTrigger value="lieferungen">Lieferungen</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto">
              <TabsContent value="tagesbericht" className="flex flex-col gap-4">
                <article
                  aria-label="Tagesbericht bearbeiten"
                  className="flex flex-col gap-4"
                >
                  <h1 className="text-lg font-semibold">{berichtTitel}</h1>
                  {berichtAbschnitte.map(({ titel, text }, index) => (
                    <section key={titel} className="flex flex-col gap-1">
                      <h2 className="text-sm font-semibold text-primary">
                        {titel}
                      </h2>
                      <p
                        contentEditable="plaintext-only"
                        suppressContentEditableWarning
                        aria-label={`${titel} bearbeiten`}
                        className="rounded-md text-sm whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onBlur={(event) => {
                          const neuerText = event.currentTarget.innerText;
                          setBerichtAbschnitte((aktuell) =>
                            aktuell.map((abschnitt, i) =>
                              i === index
                                ? { ...abschnitt, text: neuerText }
                                : abschnitt,
                            ),
                          );
                        }}
                      >
                        {text}
                      </p>
                    </section>
                  ))}
                </article>
                <div className="flex justify-start gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      alsPdfHerunterladen(berichtTitel, berichtText)
                    }
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      alsWordHerunterladen(berichtTitel, berichtText)
                    }
                  >
                    Word
                  </Button>
                  <Button variant="outline" onClick={() => setMailOffen(true)}>
                    <MailIcon />
                    Mail
                  </Button>
                </div>
              </TabsContent>
              <TabsContent
                value="vertraege"
                className="flex h-full min-h-0 flex-col"
              >
                <div className="flex min-h-0 flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Stichwortsuche"
                      aria-label="Stichwortsuche"
                    />
                    <Select value={aktivePhase} onValueChange={setAktivePhase}>
                      <SelectTrigger
                        aria-label="Phase"
                        className="w-40 shrink-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={KEINE_AUSWAHL}>
                          Keine Auswahl
                        </SelectItem>
                        {PHASEN.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            {phase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={aktivesGewerk}
                      onValueChange={setAktivesGewerk}
                    >
                      <SelectTrigger
                        aria-label="Gewerk"
                        className="w-40 shrink-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={KEINE_AUSWAHL}>
                          Keine Auswahl
                        </SelectItem>
                        {GEWERKE.map((gewerk) => (
                          <SelectItem key={gewerk} value={gewerk}>
                            {gewerk}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-2">
                    <ScrollArea className="-mr-3 min-h-0 flex-1">
                      <div className="flex flex-col gap-2 pr-3">
                        {lieferanten.map(({ id, titel, beschreibung }) => (
                          <div
                            key={id}
                            className="flex h-14 shrink-0 items-center justify-between gap-2 rounded-lg bg-background px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm">{titel}</span>
                              {beschreibung && (
                                <span className="text-xs text-muted-foreground">
                                  {beschreibung}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Vertrag ansehen"
                              onClick={() => setOffenerVertragId(id)}
                            >
                              <EyeIcon />
                            </Button>
                          </div>
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

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
          <TermineListe />
          <AufgabenListe />
        </div>
      </main>

      <Dialog
        open={offenerVertrag !== undefined}
        onOpenChange={(offen) => !offen && setOffenerVertragId(null)}
      >
        <DialogContent className="h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vertrag</DialogTitle>
          </DialogHeader>
          {offenerVertrag && (
            <ScrollArea className="min-h-0 rounded-xl bg-background">
              <article className="flex flex-col gap-4 p-4">
                <h1 className="text-lg font-semibold">
                  {offenerVertrag.titel}
                </h1>
                {offenerVertrag.beschreibung && (
                  <h2 className="text-sm font-semibold text-primary">
                    {offenerVertrag.beschreibung}
                  </h2>
                )}
                {offenerVertrag.vertrag ? (
                  <VertragText vertrag={offenerVertrag.vertrag} />
                ) : (
                  <p className="text-sm whitespace-pre-line">
                    {offenerVertrag.vorschau ?? "Keine Vorschau verfügbar."}
                  </p>
                )}
              </article>
            </ScrollArea>
          )}
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
