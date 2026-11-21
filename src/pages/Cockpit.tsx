import { useState } from "react";
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

const TAGESBERICHT = {
  datum: "20.11.26",
  projekt: "Bauprojekt XYZ",
  text: "Beton-Lieferung nach Plan, Verzögerungen aufgrund des Wetters...",
};

const MELDUNGEN_ANSTEHEND_MOCK = [
  {
    id: "m-1",
    titel: "Meldung: Gerät defekt",
    beschreibung: "Betonpumpe Abschnitt B ist um 08:15 ausgefallen.",
  },
  {
    id: "m-2",
    titel: "Meldung: Lieferung Verspätet",
    beschreibung: "Transportbeton ca. 2 h verspätet.",
  },
];

const MELDUNGEN_ABGESCHLOSSEN_MOCK = [
  { id: "m-3", titel: "Meldung: Kiesmangel", beschreibung: "Kies 0/32 nachgeliefert." },
  {
    id: "m-4",
    titel: "Meeting: Bauherr Besprechung",
    beschreibung: "Besprechung mit dem Bauherrn.",
  },
];

const TERMINE_MOCK = [
  { id: "t-1", titel: "Bauherr Besprechung, 14:00" },
  { id: "t-2", titel: "Abnahme Bewehrung, Mo 07:30" },
];

const AUFGABEN_MOCK = [
  { id: "a-1", titel: "Betonpumpe Abschnitt B prüfen" },
  { id: "a-2", titel: "Abnahmeprotokoll Rohbau" },
  { id: "a-3", titel: "Glaslieferung kontrollieren" },
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

const LIEFERANTEN_MOCK = [
  { id: "l-1", titel: "Materiallieferant 1", beschreibung: "Kurzbeschreibung" },
  { id: "l-2", titel: "Materiallieferant 2", beschreibung: "Kurzbeschreibung" },
  { id: "l-3", titel: "Personal", beschreibung: "" },
];

type Meldung = { id: string; titel: string; beschreibung: string };

const MELDUNG_WORKFLOW_PFAD = "/cockpit/meldung";

function MeldungsListe({
  ueberschrift,
  meldungen,
  aufgeklappteId,
  onToggle,
  mitAktionen,
}: {
  ueberschrift: string;
  meldungen: Meldung[];
  aufgeklappteId: string | null;
  onToggle: (id: string) => void;
  mitAktionen: boolean;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{ueberschrift}</h2>
      <Separator />
      {meldungen.map(({ id, titel, beschreibung }) => {
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
                      <Button variant="outline" size="icon" aria-label="Erledigt">
                        <CheckIcon />
                      </Button>
                      <Button variant="outline" size="icon" aria-label="Ablehnen">
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

function AufgabenListe() {
  return (
    <div className="flex flex-col gap-2">
      {AUFGABEN_MOCK.map(({ id, titel }) => (
        <div key={id} className="flex items-center justify-between gap-2 rounded-md border p-2">
          <span className="text-sm">{titel}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" aria-label="Aufgabe erledigen">
              <CheckIcon />
            </Button>
            <Button variant="outline" size="icon" aria-label="Aufgabe löschen">
              <Trash2Icon />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Cockpit() {
  const [aufgeklappteMeldungId, setAufgeklappteMeldungId] = useState<string | null>("m-1");
  const [aktivePhase, setAktivePhase] = useState(PHASEN[1]);
  const [aktivesGewerk, setAktivesGewerk] = useState(GEWERKE[1]);
  const [ausgewaehlterLieferantId, setAusgewaehlterLieferantId] = useState<string | null>("l-1");

  const toggleMeldung = (id: string) =>
    setAufgeklappteMeldungId((aktuell) => (aktuell === id ? null : id));

  const ausgewaehlterLieferant = LIEFERANTEN_MOCK.find(({ id }) => id === ausgewaehlterLieferantId);

  return (
    <div className="flex h-screen min-w-5xl flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 items-center border-b px-6">
        <h1 className="text-sm font-medium">Cockpit</h1>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 p-6">
        <Card className="min-h-0 overflow-hidden">
          <CardHeader className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Datum: 19.11.26
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
              meldungen={MELDUNGEN_ANSTEHEND_MOCK}
              aufgeklappteId={aufgeklappteMeldungId}
              onToggle={toggleMeldung}
              mitAktionen
            />
            <MeldungsListe
              ueberschrift="Abgeschlossen"
              meldungen={MELDUNGEN_ABGESCHLOSSEN_MOCK}
              aufgeklappteId={aufgeklappteMeldungId}
              onToggle={toggleMeldung}
              mitAktionen={false}
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
              <CardContent className="min-h-0 flex-1 overflow-y-auto text-sm text-muted-foreground">
                {TAGESBERICHT.text}
              </CardContent>
              <CardContent className="flex justify-end gap-1">
                <Button variant="outline">Bericht ansehen</Button>
                <Button variant="outline" size="icon" aria-label="Bericht bearbeiten">
                  <PencilIcon />
                </Button>
                <Button variant="outline" size="icon" aria-label="Bericht herunterladen">
                  <DownloadIcon />
                </Button>
              </CardContent>
            </Card>

            <Card className="min-h-0 overflow-hidden">
              <Tabs
                defaultValue="aufgaben"
                className="flex h-full min-h-0 flex-col gap-(--card-spacing)"
              >
                <CardHeader className="flex shrink-0 items-center justify-center gap-2">
                  <TabsList className="w-auto">
                    <TabsTrigger value="termine">Termine</TabsTrigger>
                    <TabsTrigger value="aufgaben">Aufgaben</TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="icon" aria-label="Hinzufügen">
                    <PlusIcon />
                  </Button>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-y-auto">
                  <TabsContent value="termine" className="flex flex-col gap-2">
                    {TERMINE_MOCK.map(({ id, titel }) => (
                      <div key={id} className="rounded-md border p-2 text-sm">
                        {titel}
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="aufgaben">
                    <AufgabenListe />
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
                        <Button variant="outline">Vertrag hinzufügen</Button>
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                        {LIEFERANTEN_MOCK.map(({ id, titel, beschreibung }) => (
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
                        <span className="text-xs text-muted-foreground">
                          {ausgewaehlterLieferant.titel}
                        </span>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="subunternehmer" className="text-sm text-muted-foreground">
                  Noch keine Subunternehmer.
                </TabsContent>
                <TabsContent value="bauplaene" className="text-sm text-muted-foreground">
                  Noch keine Baupläne.
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
