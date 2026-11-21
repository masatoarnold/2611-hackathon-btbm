import { useState } from "react";
import {
  CheckIcon,
  FileTextIcon,
  FlagIcon,
  ImageIcon,
  MicIcon,
  PencilIcon,
  PlusIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Report = {
  id: number;
  title: string;
  content: string;
  transcript: string;
  priority: number;
};

type View = { name: "list" } | { name: "new" } | { name: "detail"; id: number };

const TEMPLATES = ["Meldung", "Besprechungsprotokoll"];

const PRIORITIES = [1, 2, 3, 4, 5];
const DEFAULT_PRIORITY = 3;
const PRIORITY_COLOR_CLASSES: Record<number, string> = {
  1: "text-foreground",
  2: "text-blue-500",
  3: "text-yellow-500",
  4: "text-red-500",
  5: "text-violet-500",
};

const INITIAL_REPORTS: Report[] = [
  {
    id: 1,
    title: "Equipment defekt",
    content: "Betonpumpe an Abschnitt B ausgefallen. Ersatz wurde angefragt.",
    transcript: "Hier ist die Betonpumpe an Abschnitt B ausgefallen, wir brauchen Ersatz...",
    priority: 4,
  },
  {
    id: 2,
    title: "Lieferverspätung",
    content: "Betonlieferung 10t verspätet sich um 2 Stunden.",
    transcript: "Der Betonlieferant hat gerade angerufen, es dauert zwei Stunden länger...",
    priority: 2,
  },
];

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
  const updateReport = (id: number, content: string) =>
    setReports((current) =>
      current.map((report) => (report.id === id ? { ...report, content } : report)),
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
              onFinish={(report) => {
                addReport(report);
                setView({ name: "detail", id: report.id });
              }}
              onCancel={() => setView({ name: "list" })}
            />
          )}
          {view.name === "detail" && (
            <ReportDetail
              report={reports.find((report) => report.id === view.id)}
              onChange={(content) => updateReport(view.id, content)}
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
            <Select
              value={String(report.priority)}
              onValueChange={(value) => onChangePriority(report.id, Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="w-16 shrink-0 tabular-nums"
                aria-label="Priorität ändern"
              >
                <span className="flex items-center gap-1">
                  <FlagIcon className={`fill-current ${PRIORITY_COLOR_CLASSES[report.priority]}`} />
                  {report.priority}
                </span>
              </SelectTrigger>
              <SelectContent position="popper" align="end" className="min-w-0">
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={String(priority)} className="pr-7">
                    <FlagIcon className={`fill-current ${PRIORITY_COLOR_CLASSES[priority]}`} />
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function NewReport({
  onFinish,
  onCancel,
}: {
  onFinish: (report: Report) => void;
  onCancel: () => void;
}) {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [attachmentCount, setAttachmentCount] = useState(0);

  const finish = () =>
    onFinish({
      id: Date.now(),
      title: `${template}: Lieferverspätung`,
      content: text || "Automatisch erstellte Zusammenfassung (Mock).",
      transcript: "Mock-Transkript der Audioaufnahme...",
      priority: DEFAULT_PRIORITY,
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Vorlage</span>
        {TEMPLATES.map((name) => (
          <Button
            key={name}
            variant={template === name ? "default" : "outline"}
            onClick={() => setTemplate(name)}
          >
            {name}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3">
          <Button
            size="icon-lg"
            variant={isRecording ? "destructive" : "outline"}
            className="size-16 rounded-full"
            onClick={() => setIsRecording((current) => !current)}
          >
            {isRecording ? <SquareIcon className="size-6" /> : <MicIcon className="size-6" />}
          </Button>
          <span className="text-xs">
            {isRecording ? "Aufnahme läuft… 00:12" : "Audio aufzeichnen"}
          </span>
        </CardContent>
      </Card>

      <Textarea
        placeholder="Text eingeben…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Vorgangstyp erkannt…</span>
        <span className="flex items-center gap-2">
          Lieferverspätung
          <Button size="icon-xs" variant="outline" aria-label="Bestätigen">
            <CheckIcon />
          </Button>
          <Button size="icon-xs" variant="outline" aria-label="Ablehnen">
            <Trash2Icon />
          </Button>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs text-muted-foreground">
          {attachmentCount} Anhänge gespeichert
        </span>
        <Button
          size="icon-lg"
          variant="outline"
          className="size-10 rounded-full"
          aria-label="Anhang hinzufügen"
          onClick={() => setAttachmentCount((current) => current + 1)}
        >
          <PlusIcon />
        </Button>
        <Button variant="ghost" size="lg" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button size="lg" onClick={finish}>
          Fertig
        </Button>
      </div>
    </div>
  );
}

function ReportDetail({
  report,
  onChange,
  onDelete,
  onConfirm,
}: {
  report: Report | undefined;
  onChange: (content: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  if (!report) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{report.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          className="min-h-40"
          value={report.content}
          readOnly={!isEditing}
          onChange={(event) => onChange(event.target.value)}
        />
        {showTranscript && (
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            {report.transcript}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {["Bild 1", "Bild 2"].map((label) => (
            <div
              key={label}
              className="flex h-24 flex-col items-center justify-center gap-1 rounded-md border text-xs text-muted-foreground"
            >
              <ImageIcon className="size-5" />
              {label}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            size="icon-lg"
            variant={showTranscript ? "default" : "outline"}
            aria-label="Transkript"
            onClick={() => setShowTranscript((current) => !current)}
          >
            <FileTextIcon />
          </Button>
          <Button
            size="icon-lg"
            variant={isEditing ? "default" : "outline"}
            aria-label="Bearbeiten"
            onClick={() => setIsEditing((current) => !current)}
          >
            <PencilIcon />
          </Button>
          <Button size="icon-lg" variant="destructive" aria-label="Löschen" onClick={onDelete}>
            <Trash2Icon />
          </Button>
          <Button size="icon-lg" aria-label="Bestätigen" onClick={onConfirm}>
            <CheckIcon />
          </Button>
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
