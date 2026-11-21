import { Fragment, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  FlagIcon,
  ImageIcon,
  MailIcon,
  PaperclipIcon,
  RotateCcwIcon,
  SendIcon,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Textarea } from "@/components/ui/textarea";

// Platzhalterdaten, bis die Anbindung steht
const SUBUNTERNEHMER = [
  {
    id: "tiefbau",
    name: "Subunternehmer Tiefbau",
    vertraege: ["Rahmenvertrag Tiefbau 2026.pdf", "Nachtrag 1 Erdarbeiten.pdf"],
  },
  {
    id: "elektro",
    name: "Subunternehmer Elektro",
    vertraege: ["Werkvertrag Elektro.pdf"],
  },
  {
    id: "rohbau",
    name: "Subunternehmer Rohbau",
    vertraege: ["Rahmenvertrag Rohbau.pdf", "Versicherungsnachweis.pdf"],
  },
  {
    id: "trockenbau",
    name: "Subunternehmer Trockenbau",
    vertraege: ["Werkvertrag Trockenbau.pdf"],
  },
  {
    id: "haustechnik",
    name: "Subunternehmer Haustechnik",
    vertraege: ["Rahmenvertrag Haustechnik.pdf"],
  },
  {
    id: "dachdeckung",
    name: "Subunternehmer Dachdeckung",
    vertraege: ["Werkvertrag Dachdeckung.pdf"],
  },
];

const ANHAENGE = [
  { name: "Lieferschein_Beton.pdf", beschreibung: "PDF · 240 KB" },
  { name: "Foto_Lieferverzug.jpg", beschreibung: "Bild · 2,1 MB" },
];
const BILDER = ["Bild 1", "Bild 2"];

const DOKUMENTTYPEN = ["Behinderungsanzeige", "Tagesbericht", "Bedenkenanzeige", "Meetingprotokoll"];

const ZUSAMMENFASSUNG_PLATZHALTER =
  "Zusammenfassung des Vorfalls wird hier angezeigt. Dieser Text ist ein Platzhalter und wird später durch die KI-gestützte Auswertung der Meldung ersetzt.";

const TRANSKRIPT_MOCK =
  "Der Betonlieferant hat gerade angerufen. Die Lieferung von 10 t verspätet sich um etwa zwei Stunden.\n\nGrund laut Lieferant: Verkehrsbehinderung auf der Zufahrt zur Baustelle.\n\nIch habe die Betonpumpe in Abschnitt B vorsorglich umdisponiert und den Subunternehmer Tiefbau informiert.";

const CHAT_VERLAUF: {
  id: string;
  rolle: "ki" | "nutzer";
  text: string;
  aktion?: string;
  hatAenderungsAktion?: boolean;
}[] = [
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
};

type BetroffenerVertrag = {
  vertrag: string;
  unternehmer: string;
};

const dateiTab = (name: string): Tab => ({ id: `datei:${name}`, title: name, typ: "datei" });

export function CockpitMeldungWorkflow() {
  const [zusammenfassung, setZusammenfassung] = useState(ZUSAMMENFASSUNG_PLATZHALTER);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [aktiverTab, setAktiverTab] = useState("");
  const [betroffeneVertraege, setBetroffeneVertraege] = useState<BetroffenerVertrag[]>([]);
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
      current.map((tab) => (tab.id === id ? { ...tab, dokumentTyp, title: dokumentTyp } : tab)),
    );

  const toggleVertrag = (vertrag: string, unternehmer: string) =>
    setBetroffeneVertraege((current) =>
      current.some((eintrag) => eintrag.vertrag === vertrag)
        ? current.filter((eintrag) => eintrag.vertrag !== vertrag)
        : [...current, { vertrag, unternehmer }],
    );

  const entferneVertrag = (vertrag: string) =>
    setBetroffeneVertraege((current) => current.filter((eintrag) => eintrag.vertrag !== vertrag));

  const betroffeneNamen = betroffeneVertraege.map((eintrag) => eintrag.vertrag);

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
              <ul className="flex flex-col gap-2">
                {BILDER.map((bild) => (
                  <li key={bild}>
                    <Attachment size="sm" className="w-full">
                      <AttachmentMedia>
                        <ImageIcon />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{bild}</AttachmentTitle>
                        <AttachmentDescription>Bild</AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentTrigger
                        aria-label={`${bild} öffnen`}
                        onClick={() => oeffneTab(dateiTab(bild))}
                      />
                    </Attachment>
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
          <CardFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => oeffneTab({ id: "transkript", title: "Transkript", typ: "transkript" })}
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
            <Button
              className="ml-auto"
              onClick={() =>
                oeffneTab({ id: `dokument-${Date.now()}`, title: "Neues Dokument", typ: "dokument" })
              }
            >
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
              {SUBUNTERNEHMER.map((unternehmer) => (
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
        </Card>
      </div>

      {/* Mittlere Spalte: Anzeige mit Tabs für geöffnete Dateien */}
      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>Anzeige</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {tabs.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
              Keine Datei geöffnet
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
                    onAbbrechen={() => schliesseTab(tab.id)}
                  />
                </TabsContent>
              ))}
            </Tabs>
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {CHAT_VERLAUF.map((nachricht) => {
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
  onAbbrechen,
}: {
  tab: Tab;
  onWaehleDokumentTyp: (typ: string) => void;
  onAbbrechen: () => void;
}) {
  if (tab.typ === "transkript") {
    return (
      <div className="rounded-md bg-muted p-3 text-xs whitespace-pre-line">
        {TRANSKRIPT_MOCK}
      </div>
    );
  }

  if (tab.typ === "dokument") {
    return tab.dokumentTyp ? (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
        {tab.dokumentTyp}: Inhalt wird später befüllt
      </div>
    ) : (
      <DokumentTypAuswahl onWaehle={onWaehleDokumentTyp} onAbbrechen={onAbbrechen} />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
      Dateiansicht folgt
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
