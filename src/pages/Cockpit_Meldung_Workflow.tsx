import { useState } from "react";
import { FileTextIcon, MailIcon, PaperclipIcon, SendIcon, Trash2Icon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
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

const ANHAENGE = ["Lieferschein_Beton.pdf", "Foto_Lieferverzug.jpg"];

const ZUSAMMENFASSUNG_PLATZHALTER =
  "Zusammenfassung des Vorfalls wird hier angezeigt. Dieser Text ist ein Platzhalter und wird später durch die KI-gestützte Auswertung der Meldung ersetzt.";

const TRANSKRIPT_MOCK =
  "Der Betonlieferant hat gerade angerufen. Die Lieferung von 10 t verspätet sich um etwa zwei Stunden.\n\nGrund laut Lieferant: Verkehrsbehinderung auf der Zufahrt zur Baustelle.\n\nIch habe die Betonpumpe in Abschnitt B vorsorglich umdisponiert und den Subunternehmer Tiefbau informiert.";

export function CockpitMeldungWorkflow() {
  const [zusammenfassung, setZusammenfassung] = useState(ZUSAMMENFASSUNG_PLATZHALTER);
  const [zeigtTranskript, setZeigtTranskript] = useState(false);
  const [ausgewaehlterSubunternehmer, setAusgewaehlterSubunternehmer] =
    useState<string | null>(null);

  return (
    <div className="grid h-screen grid-cols-[5fr_5fr_3fr] gap-4 bg-background p-4 text-foreground">
      {/* Linke Spalte: Incident und Subunternehmer */}
      <div className="grid min-h-0 grid-rows-[3fr_2fr] gap-4">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Incident: Lieferverspätung</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
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
              <div className="flex gap-2">
                {["Bild 1", "Bild 2"].map((bild) => (
                  <div
                    key={bild}
                    className="flex size-20 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground"
                  >
                    {bild}
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium">Anhänge</h3>
              <ul className="flex flex-col gap-2">
                {ANHAENGE.map((anhang) => (
                  <li key={anhang}>
                    <Item variant="outline">
                      <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                      <ItemContent>
                        <ItemTitle>{anhang}</ItemTitle>
                      </ItemContent>
                    </Item>
                  </li>
                ))}
              </ul>
            </section>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              variant={zeigtTranskript ? "default" : "outline"}
              aria-pressed={zeigtTranskript}
              onClick={() => setZeigtTranskript((current) => !current)}
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
                  <AlertDialogTitle>Incident löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchtest du diesen Incident wirklich löschen? Diese Aktion kann nicht
                    rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction variant="destructive">Löschen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button className="ml-auto">Dokument erstellen</Button>
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
                      <MailIcon />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Mittlere Spalte: Dateiansicht bzw. Transkript */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>Anzeige / E-Mail / Bericht</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {zeigtTranskript ? (
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted p-3 text-xs whitespace-pre-line">
              {TRANSKRIPT_MOCK}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
              Dateiansicht folgt
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline">PDF</Button>
          <Button variant="outline">Word</Button>
          <Button variant="outline" size="icon" aria-label="E-Mail">
            <MailIcon />
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
              <SendIcon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
