import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  File01Icon,
  Mail01Icon,
  PencilEdit01Icon,
  SendIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// Platzhalterdaten, bis die Anbindung steht
const SUBUNTERNEHMER = [
  { id: "1", name: "Subunternehmer Tiefbau" },
  { id: "2", name: "Subunternehmer Elektro" },
  { id: "3", name: "Subunternehmer Rohbau" },
  { id: "4", name: "Subunternehmer Trockenbau" },
  { id: "5", name: "Subunternehmer Haustechnik" },
  { id: "6", name: "Subunternehmer Dachdeckung" },
];

const ZUSAMMENFASSUNG_PLATZHALTER =
  "Zusammenfassung des Vorfalls wird hier angezeigt. Dieser Text ist ein Platzhalter und wird später durch die KI-gestützte Auswertung der Meldung ersetzt.";

export function CockpitMeldungWorkflow() {
  const [ausgewaehlterSubunternehmer, setAusgewaehlterSubunternehmer] =
    useState<string | null>(null);

  return (
    <div className="grid h-screen grid-cols-[5fr_5fr_3fr] gap-4 bg-background p-4 text-foreground">
      {/* Linke Spalte: Incident und Subunternehmer */}
      <div className="grid min-h-0 grid-rows-[3fr_2fr] gap-4">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle className="text-base">Incident: Lieferverspätung</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <section className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">Zusammenfassung</h3>
              <p className="text-muted-foreground">{ZUSAMMENFASSUNG_PLATZHALTER}</p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              {["Bild 1", "Bild 2"].map((bild) => (
                <div
                  key={bild}
                  className="flex aspect-square items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground"
                >
                  {bild}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="icon" aria-label="Dokument anzeigen">
              <HugeiconsIcon icon={File01Icon} />
            </Button>
            <Button variant="outline" size="icon" aria-label="Bearbeiten">
              <HugeiconsIcon icon={PencilEdit01Icon} />
            </Button>
            <Button variant="outline" size="icon" aria-label="Löschen">
              <HugeiconsIcon icon={Delete02Icon} />
            </Button>
            <Button variant="default" className="ml-auto">
              Dokument erstellen
            </Button>
          </CardFooter>
        </Card>

        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Vorgeschlagene Subunternehmer</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            <ul className="flex flex-col gap-2">
              {SUBUNTERNEHMER.map((unternehmer) => {
                const istAusgewaehlt = ausgewaehlterSubunternehmer === unternehmer.id;
                return (
                  <li key={unternehmer.id} className="flex items-center gap-2">
                    <Button
                      variant={istAusgewaehlt ? "secondary" : "outline"}
                      className="flex-1 justify-start"
                      aria-pressed={istAusgewaehlt}
                      onClick={() => setAusgewaehlterSubunternehmer(unternehmer.id)}
                    >
                      {unternehmer.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`E-Mail an ${unternehmer.name}`}
                    >
                      <HugeiconsIcon icon={Mail01Icon} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Mittlere Spalte: Dateiansicht */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>Anzeige / E-Mail / Bericht</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
            Dateiansicht folgt
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline">PDF</Button>
          <Button variant="outline">Word</Button>
          <Button variant="outline" size="icon" aria-label="E-Mail">
            <HugeiconsIcon icon={Mail01Icon} />
          </Button>
        </CardFooter>
      </Card>

      {/* Rechte Spalte: KI-Chat */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>KI-Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
          <Textarea
            readOnly
            className="min-h-0 flex-1"
            placeholder="KI-Antworten erscheinen hier"
          />
          <div className="flex items-end gap-2">
            <Textarea placeholder="Nachricht an die KI" className="flex-1" />
            <Button size="icon" aria-label="Senden">
              <HugeiconsIcon icon={SendIcon} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
