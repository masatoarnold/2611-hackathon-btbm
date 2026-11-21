import { Fragment, useState } from "react";
import {
  CheckIcon,
  FileTextIcon,
  MailIcon,
  PaperclipIcon,
  RotateCcwIcon,
  SendIcon,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { Message, MessageContent } from "@/components/ui/message";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Textarea } from "@/components/ui/textarea";
import { sendChat } from "@/lib/chat";

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

const VORFALL_TITEL = "Lieferverspätung";

type ChatNachricht = {
  id: string;
  rolle: "ki" | "nutzer";
  text: string;
  aktion?: string;
  hatAenderungsAktion?: boolean;
};

const CHAT_BEGRUESSUNG: ChatNachricht = {
  id: "begruessung",
  rolle: "ki",
  text: "Ich habe die Meldung ausgewertet und den Bautagesbericht vorbereitet. Womit soll ich ihn ergänzen?",
};

/** Turns the visible chat into API messages; the API must start with a user turn. */
function alsApiNachrichten(verlauf: ChatNachricht[]) {
  const ersteNutzerNachricht = verlauf.findIndex(({ rolle }) => rolle === "nutzer");
  return verlauf.slice(ersteNutzerNachricht).map(({ rolle, text }) => ({
    role: rolle === "ki" ? ("assistant" as const) : ("user" as const),
    content: text,
  }));
}

export function CockpitMeldungWorkflow() {
  const [zusammenfassung, setZusammenfassung] = useState(ZUSAMMENFASSUNG_PLATZHALTER);
  const [chatVerlauf, setChatVerlauf] = useState<ChatNachricht[]>([CHAT_BEGRUESSUNG]);
  const [chatEingabe, setChatEingabe] = useState("");
  const [kiAntwortet, setKiAntwortet] = useState(false);
  const [chatFehler, setChatFehler] = useState<string | null>(null);

  async function nachrichtSenden() {
    const text = chatEingabe.trim();
    if (!text || kiAntwortet) return;

    const verlauf = [...chatVerlauf, { id: crypto.randomUUID(), rolle: "nutzer" as const, text }];
    setChatVerlauf(verlauf);
    setChatEingabe("");
    setChatFehler(null);
    setKiAntwortet(true);
    try {
      const antwort = await sendChat({
        vorfall: { titel: VORFALL_TITEL, zusammenfassung },
        messages: alsApiNachrichten(verlauf),
      });
      setChatVerlauf((aktuell) => [
        ...aktuell,
        { id: crypto.randomUUID(), rolle: "ki", text: antwort },
      ]);
    } catch (error) {
      setChatFehler(error instanceof Error ? error.message : "KI-Antwort fehlgeschlagen.");
    } finally {
      setKiAntwortet(false);
    }
  }

  const [ausgewaehlterSubunternehmer, setAusgewaehlterSubunternehmer] = useState<string | null>(
    null,
  );

  return (
    <div className="grid h-screen grid-cols-[5fr_5fr_3fr] gap-4 bg-background p-4 text-foreground">
      {/* Linke Spalte: Incident und Subunternehmer */}
      <div className="grid min-h-0 grid-rows-[3fr_2fr] gap-4">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>Incident: {VORFALL_TITEL}</CardTitle>
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
                    Möchtest du diesen Incident wirklich löschen? Diese Aktion kann nicht rückgängig
                    gemacht werden.
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

      {/* Mittlere Spalte: Dateiansicht */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>Anzeige / E-Mail / Bericht</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
            Dateiansicht folgt
          </div>
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
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
                        <p className="whitespace-pre-wrap">{nachricht.text}</p>
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
            {kiAntwortet && <p className="text-xs text-muted-foreground">KI schreibt…</p>}
            {chatFehler && <p className="text-xs text-destructive">{chatFehler}</p>}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void nachrichtSenden();
            }}
          >
            <Textarea
              placeholder="Nachricht an die KI"
              className="flex-1"
              value={chatEingabe}
              onChange={(event) => setChatEingabe(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void nachrichtSenden();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Senden"
              disabled={kiAntwortet || !chatEingabe.trim()}
            >
              <SendIcon />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
