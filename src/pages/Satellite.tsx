import { useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  FlagIcon,
  MicIcon,
  PlusIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDictation } from "@/lib/speech";

type Report = {
  id: number;
  title: string;
  content: string;
  transcript: string;
  priority: number;
  timestamp: Date;
  location: string;
  vorgangstyp: string | null;
  attachments: string[];
};

type View = { name: "list" } | { name: "new"; id?: number } | { name: "detail"; id: number };

const VORGANGSTYPEN = ["Meldung", "Besprechungsprotokoll"];
const NO_VORGANGSTYP_VALUE = "keine-auswahl";

const PRIORITIES = [1, 2, 3, 4, 5];
const DEFAULT_PRIORITY = 1;
const PRIORITY_COLORS: Record<number, string> = {
  1: "var(--foreground)",
  2: "#3b82f6",
  3: "#eab308",
  4: "#ef4444",
  5: "#8b5cf6",
};

const INITIAL_REPORTS: Report[] = [
  {
    id: 1,
    title: "Equipment defekt",
    content: "Betonpumpe an Abschnitt B ausgefallen. Ersatz wurde angefragt.",
    transcript: "Hier ist die Betonpumpe an Abschnitt B ausgefallen, wir brauchen Ersatz...",
    priority: 4,
    timestamp: new Date(2026, 10, 21, 8, 15),
    location: "Abschnitt B",
    vorgangstyp: "Meldung",
    attachments: [],
  },
  {
    id: 2,
    title: "Lieferverspätung",
    content: "Betonlieferung 10t verspätet sich um 2 Stunden.",
    transcript: "Der Betonlieferant hat gerade angerufen, es dauert zwei Stunden länger...",
    priority: 2,
    timestamp: new Date(2026, 10, 21, 9, 40),
    location: "Baustelleneinfahrt",
    vorgangstyp: null,
    attachments: [],
  },
];

const formatDuration = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const HOURS = Array.from({ length: 10 }, (_, index) => index + 7);
const HOUR_HEIGHT_PX = 48;

const APPOINTMENTS = [
  { title: "Meeting Bauherr", startHour: 8, durationHours: 1.5, own: true },
  { title: "Parkettierung", startHour: 8.5, durationHours: 2.5, own: false },
  { title: "Abnahme Rohbau", startHour: 10.5, durationHours: 1, own: true },
  { title: "Glaslieferung", startHour: 13, durationHours: 1, own: false },
];

type Todo = {
  id: number;
  title: string;
  done: boolean;
};

const INITIAL_TODOS: Todo[] = [
  { id: 1, title: "Betonpumpe Abschnitt B prüfen", done: false },
  { id: 2, title: "Lieferschein Glas unterschreiben", done: true },
  { id: 3, title: "Abnahmeprotokoll Rohbau erstellen", done: false },
  { id: 4, title: "Sicherheitseinweisung Parkettierer", done: true },
  { id: 5, title: "Baustrom Container 2 kontrollieren", done: false },
];

export function Satellite() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [view, setView] = useState<View>({ name: "list" });

  const addReport = (report: Report) => setReports((current) => [report, ...current]);
  const updateReport = (id: number, changes: Partial<Omit<Report, "id">>) =>
    setReports((current) =>
      current.map((report) => (report.id === id ? { ...report, ...changes } : report)),
    );
  const deleteReport = (id: number) =>
    setReports((current) => current.filter((report) => report.id !== id));
  const changePriority = (id: number, priority: number) =>
    setReports((current) =>
      current.map((report) => (report.id === id ? { ...report, priority } : report)),
    );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-foreground">
      <Tabs defaultValue="reports" className="flex-1 p-4">
        <TabsList>
          <TabsTrigger value="reports">Meldungen</TabsTrigger>
          <TabsTrigger value="schedule">Tagesplan</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="flex flex-col">
          {view.name === "list" && (
            <ReportList
              reports={reports}
              onOpen={(id) => setView({ name: "detail", id })}
              onChangePriority={changePriority}
              onCreate={() => setView({ name: "new" })}
            />
          )}
          {view.name === "new" && (
            <NewReport
              initialReport={reports.find((report) => report.id === view.id)}
              onFinish={(report) => {
                if (view.id === undefined) addReport(report);
                else updateReport(report.id, report);
                setView({ name: "detail", id: report.id });
              }}
              onCancel={() => setView({ name: "list" })}
            />
          )}
          {view.name === "detail" && (
            <ReportDetail
              report={reports.find((report) => report.id === view.id)}
              onBack={() => setView({ name: "new", id: view.id })}
              onChange={(content) => updateReport(view.id, { content })}
              onChangeLocation={(location) => updateReport(view.id, { location })}
              onChangeVorgangstyp={(vorgangstyp) => updateReport(view.id, { vorgangstyp })}
              onChangeAttachments={(attachments) => updateReport(view.id, { attachments })}
              onChangePriority={(priority) => changePriority(view.id, priority)}
              onDelete={() => {
                deleteReport(view.id);
                setView({ name: "list" });
              }}
              onConfirm={() => setView({ name: "list" })}
            />
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <Schedule />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportList({
  reports,
  onOpen,
  onChangePriority,
  onCreate,
}: {
  reports: Report[];
  onOpen: (id: number) => void;
  onChangePriority: (id: number, priority: number) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {reports.map((report) => (
        <Item key={report.id} variant="outline">
          <ItemContent className="cursor-pointer" onClick={() => onOpen(report.id)}>
            <ItemTitle>{report.title}</ItemTitle>
            <ItemDescription>{report.content}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <PrioritySelect
              value={report.priority}
              onChange={(priority) => onChangePriority(report.id, priority)}
            />
          </ItemActions>
        </Item>
      ))}
      {reports.length === 0 && (
        <p className="text-xs text-muted-foreground">Noch keine Aufzeichnungen.</p>
      )}
      <div className="mt-auto flex justify-center pt-4">
        <Button size="icon-lg" className="size-14 rounded-full" onClick={onCreate}>
          <PlusIcon className="size-6" />
        </Button>
      </div>
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

function NewReport({
  initialReport,
  onFinish,
  onCancel,
}: {
  initialReport?: Report;
  onFinish: (report: Report) => void;
  onCancel: () => void;
}) {
  const [vorgangstyp, setVorgangstyp] = useState<string | null>(initialReport?.vorgangstyp ?? null);
  const [transcript, setTranscript] = useState("");
  const dictation = useDictation((spoken) =>
    setTranscript((current) => [current, spoken].filter(Boolean).join(" ")),
  );
  const isRecording = dictation.status === "recording";
  const [manualText, setManualText] = useState("");
  const [showMetadata, setShowMetadata] = useState(false);
  const [timestamp] = useState(() => initialReport?.timestamp ?? new Date());
  const [location, setLocation] = useState(initialReport?.location ?? "");
  const [priority, setPriority] = useState(initialReport?.priority ?? DEFAULT_PRIORITY);
  const [attachments, setAttachments] = useState<string[]>(initialReport?.attachments ?? []);

  const finish = () =>
    onFinish({
      id: initialReport?.id ?? Date.now(),
      title:
        initialReport?.title ??
        (vorgangstyp ? `${vorgangstyp}: Lieferverspätung` : "Lieferverspätung"),
      content:
        [transcript, manualText].filter(Boolean).join("\n\n") ||
        initialReport?.content ||
        "Automatisch erstellte Zusammenfassung (Mock).",
      transcript: transcript || initialReport?.transcript || "",
      priority,
      timestamp,
      location,
      vorgangstyp,
      attachments,
    });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3">
          <Button
            size="icon-lg"
            variant={isRecording ? "destructive" : "outline"}
            className="size-16 rounded-full"
            aria-label={isRecording ? "Aufnahme beenden" : "Aufnahme starten"}
            disabled={dictation.status === "transcribing"}
            onClick={isRecording ? dictation.stop : dictation.start}
          >
            {isRecording ? <SquareIcon className="size-6" /> : <MicIcon className="size-6" />}
          </Button>
          <span className="text-xs tabular-nums">
            {dictation.status === "recording" && `Aufnahme läuft… ${formatDuration(dictation.elapsed)}`}
            {dictation.status === "transcribing" && "Wird transkribiert…"}
            {dictation.status === "idle" && "Ton aufzeichnen"}
          </span>
          {dictation.error && <span className="text-xs text-destructive">{dictation.error}</span>}
        </CardContent>
      </Card>

      <Textarea
        placeholder="KI-generierte Zusammenfassung"
        aria-label="KI-generierte Zusammenfassung"
        value={transcript}
        readOnly
      />

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
              <span className="text-xs text-muted-foreground">Vorgangstyp</span>
              <Select
                value={vorgangstyp ?? NO_VORGANGSTYP_VALUE}
                onValueChange={(next) =>
                  setVorgangstyp(next === NO_VORGANGSTYP_VALUE ? null : next)
                }
              >
                <SelectTrigger aria-label="Vorgangstyp auswählen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={NO_VORGANGSTYP_VALUE}>Keine Auswahl</SelectItem>
                  {VORGANGSTYPEN.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Zeitstempel</span>
              <span className="text-xs tabular-nums">
                {timestamp.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Ort</span>
              <Input
                placeholder="Ort eingeben"
                aria-label="Ort"
                className="w-40"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Priorität</span>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>
          </div>
        )}
      </div>

      <PhotoAttachments photos={attachments} onChange={setAttachments} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="lg" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button size="lg" onClick={finish}>
          Weiter
        </Button>
      </div>
    </div>
  );
}

function PhotoAttachments({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const newPhotoUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    onChange([...photos, ...newPhotoUrls]);
    event.target.value = "";
  };

  const removePhoto = (photoUrl: string) => {
    URL.revokeObjectURL(photoUrl);
    onChange(photos.filter((photo) => photo !== photoUrl));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs text-muted-foreground">
          {photos.length} Fotos angehängt
        </span>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={addPhotos}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={addPhotos}
        />
        <Button
          size="icon-lg"
          variant="outline"
          className="size-10 rounded-full"
          aria-label="Foto aufnehmen"
          onClick={() => cameraInputRef.current?.click()}
        >
          <CameraIcon />
        </Button>
        <Button
          size="icon-lg"
          variant="outline"
          className="size-10 rounded-full"
          aria-label="Foto hinzufügen"
          onClick={() => galleryInputRef.current?.click()}
        >
          <PlusIcon />
        </Button>
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photoUrl) => (
            <div
              key={photoUrl}
              className="relative aspect-square overflow-hidden rounded-md border"
            >
              <img src={photoUrl} alt="Angehängtes Foto" className="size-full object-cover" />
              <Button
                size="icon-xs"
                variant="secondary"
                className="absolute top-1 right-1 rounded-full"
                aria-label="Foto entfernen"
                onClick={() => removePhoto(photoUrl)}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportDetail({
  report,
  onBack,
  onChange,
  onChangeLocation,
  onChangeVorgangstyp,
  onChangeAttachments,
  onChangePriority,
  onDelete,
  onConfirm,
}: {
  report: Report | undefined;
  onBack: () => void;
  onChange: (content: string) => void;
  onChangeLocation: (location: string) => void;
  onChangeVorgangstyp: (vorgangstyp: string | null) => void;
  onChangeAttachments: (attachments: string[]) => void;
  onChangePriority: (priority: number) => void;
  onDelete: () => void;
  onConfirm: () => void;
}) {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!report) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <Button variant="ghost" size="icon" aria-label="Zurück" onClick={onBack}>
          <ArrowLeftIcon />
        </Button>
        <CardTitle className="flex-1">{report.title}</CardTitle>
        <PrioritySelect value={report.priority} onChange={onChangePriority} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          className="min-h-40"
          value={report.content}
          onChange={(event) => onChange(event.target.value)}
        />
        {showTranscript && (
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            {report.transcript}
          </p>
        )}
        <div className="flex flex-col gap-2 rounded-md border p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Zeitstempel</span>
            <span className="tabular-nums">
              {report.timestamp.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Vorgangstyp</span>
            <Select
              value={report.vorgangstyp ?? NO_VORGANGSTYP_VALUE}
              onValueChange={(next) =>
                onChangeVorgangstyp(next === NO_VORGANGSTYP_VALUE ? null : next)
              }
            >
              <SelectTrigger aria-label="Vorgangstyp auswählen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={NO_VORGANGSTYP_VALUE}>Keine Auswahl</SelectItem>
                {VORGANGSTYPEN.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Ort</span>
            <Input
              aria-label="Ort"
              placeholder="Ort eingeben"
              className="w-40"
              value={report.location}
              onChange={(event) => onChangeLocation(event.target.value)}
            />
          </div>
        </div>
        <PhotoAttachments photos={report.attachments} onChange={onChangeAttachments} />
        <div className="flex items-center justify-between gap-2">
          <Button
            size="icon-lg"
            variant={showTranscript ? "default" : "outline"}
            aria-label="Transkript"
            onClick={() => setShowTranscript((current) => !current)}
          >
            <FileTextIcon />
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              Löschen
            </Button>
            <Button onClick={onConfirm}>
              <CheckIcon />
              Bestätigen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Schedule() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <div className="h-80 overflow-auto">
            <div
              className="flex w-max min-w-full"
              style={{ height: HOURS.length * HOUR_HEIGHT_PX }}
            >
              <div className="sticky left-0 z-10 w-12 shrink-0 bg-card">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-t text-xs text-muted-foreground"
                    style={{ height: HOUR_HEIGHT_PX }}
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
              <div className="relative min-w-[24rem] flex-1">
                {APPOINTMENTS.map((appointment) => (
                  <div
                    key={appointment.title}
                    className={
                      appointment.own
                        ? "absolute left-0 w-[48%] rounded-md border border-destructive bg-destructive/10 p-1 text-xs text-destructive"
                        : "absolute right-0 w-[48%] rounded-md border border-green-600 bg-green-600/10 p-1 text-xs text-green-700"
                    }
                    style={{
                      top: (appointment.startHour - HOURS[0]!) * HOUR_HEIGHT_PX,
                      height: appointment.durationHours * HOUR_HEIGHT_PX,
                    }}
                  >
                    {appointment.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TodoList />
    </div>
  );
}

function TodoList() {
  const [todos, setTodos] = useState(INITIAL_TODOS);

  const [newTitle, setNewTitle] = useState("");

  const toggleTodo = (id: number) =>
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );

  const addTodo = () => {
    const title = newTitle.trim();
    if (!title) return;
    setTodos((current) => [...current, { id: Date.now(), title, done: false }]);
    setNewTitle("");
  };

  const deleteTodo = (id: number) =>
    setTodos((current) => current.filter((todo) => todo.id !== id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aufgabenliste</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.done}
                onCheckedChange={() => toggleTodo(todo.id)}
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={`flex-1 ${todo.done ? "text-muted-foreground line-through" : ""}`}
              >
                {todo.title}
              </label>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`${todo.title} löschen`}
                onClick={() => deleteTodo(todo.id)}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
          {todos.length === 0 && (
            <p className="text-xs text-muted-foreground">Keine To-dos vorhanden.</p>
          )}
        </ul>

        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addTodo();
          }}
        >
          <Input
            placeholder="Neue Aufgabe…"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Aufgabe hinzufügen"
            disabled={!newTitle.trim()}
          >
            <PlusIcon />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
