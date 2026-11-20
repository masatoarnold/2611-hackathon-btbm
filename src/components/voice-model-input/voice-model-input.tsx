import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  AudioWaveformIcon,
  Copy01Icon,
  CopyCheckIcon,
  Delete02Icon,
  Loading03Icon,
  Mic01Icon,
  Moon02Icon,
  SparklesIcon,
  StopIcon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { VoiceWaveform } from "./voice-waveform";

type Status = "idle" | "recording" | "transcribing" | "ready" | "thinking" | "replying" | "done";

type Tone = "Neutral" | "Warm" | "Precise";

type Take = {
  id: string;
  title: string;
  transcript: string;
  seconds: number;
  model: string;
  when: string;
};

const MODELS = [
  { id: "nova", name: "Nova Voice 2", detail: "Realtime", latency: "~320 ms" },
  { id: "aurora", name: "Aurora Chat", detail: "Balanced", latency: "~540 ms" },
  { id: "echo", name: "Echo Mini", detail: "Fast", latency: "~180 ms" },
] as const;

const LANGUAGES = [
  { id: "en-US", label: "English (US)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "ja-JP", label: "Japanese" },
  { id: "de-DE", label: "German" },
  { id: "es-ES", label: "Spanish" },
] as const;

const TONES: Tone[] = ["Neutral", "Warm", "Precise"];

const SAMPLE_TRANSCRIPT =
  "Can you walk me through how a vector database differs from a regular index, and when should I actually use one? Keep it brief.";

const REPLIES: Record<Tone, string> = {
  Neutral: `A regular index finds exact keys: you ask for a row and it returns that row. A vector database finds things by meaning. It stores embeddings and returns the nearest neighbours, so "refund policy" can match "how do I get my money back".

Use a vector store when your queries are fuzzy: search, recommendations, and retrieval over documents. Stay with a normal index when you need exact lookups, transactions, or cheap filtering at scale.

Most production stacks run both: a relational database as the source of truth, and a vector index beside it for semantic retrieval.`,
  Warm: `Great question. The short version is that they answer different kinds of questions.

A regular index is like a library catalogue: precise, exact, "give me row 42". A vector database is more like a well-read librarian. You describe what you're after in your own words, and it finds the closest ideas by comparing embeddings.

Reach for vectors when the query is fuzzy: search, recommendations, or retrieval for a model. Keep the classic index for exact lookups and transactional work. And don't worry about replacing one with the other. Most teams happily run both.`,
  Precise: `Different retrieval models, different trade-offs.

A traditional index (B-tree, inverted index) maps exact keys to rows. A vector database stores high-dimensional embeddings and performs nearest-neighbour search, typically approximate, over semantic similarity.

Use vectors for fuzzy or semantic retrieval: search, recommendations, RAG.
Use conventional indexes for exact match, range queries, joins, and ACID guarantees.
Most systems run both, with the relational store as the source of truth.

Rule of thumb: if a user would type the query as a sentence, think vectors. If a machine would type the query as an ID, think B-tree.`,
};

const INITIAL_TAKES: Take[] = [
  {
    id: "take-1",
    title: "Vector DB vs. normal index",
    transcript: SAMPLE_TRANSCRIPT,
    seconds: 12,
    model: "Nova Voice 2",
    when: "2m ago",
  },
  {
    id: "take-2",
    title: "Meeting notes for Thursday",
    transcript:
      "Remind me to send the prototype to the design channel before Thursday standup, and add a note about the mock voice flow.",
    seconds: 8,
    model: "Echo Mini",
    when: "1h ago",
  },
  {
    id: "take-3",
    title: "Rewrite the onboarding email",
    transcript:
      "Rewrite the onboarding email so it sounds friendlier and mentions the new voice features. Keep it under one hundred and fifty words.",
    seconds: 21,
    model: "Aurora Chat",
    when: "Yesterday",
  },
];

const SUGGESTIONS = [
  {
    label: "Summarize this week's notes",
    transcript:
      "Summarize the notes I took this week and list the three decisions that still need an owner.",
  },
  {
    label: "Draft a reply to Maya",
    transcript:
      "Draft a short reply to Maya saying the prototype is ready and I'll share the walkthrough tomorrow morning.",
  },
  {
    label: "Plan a two-week sprint",
    transcript:
      "Help me plan a two-week sprint for the voice input prototype, with milestones for design, integration, and demo day.",
  },
];

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function titleFromTranscript(text: string) {
  const words = text
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  const title = words.slice(0, 5).join(" ");

  return words.length > 5 ? `${title}…` : title;
}

export function VoiceModelInputPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [tone, setTone] = useState<Tone>("Neutral");
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [language, setLanguage] = useState<string>(LANGUAGES[0].id);
  const [takes, setTakes] = useState<Take[]>(INITIAL_TAKES);
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
  const [replyMeta, setReplyMeta] = useState<{ modelId: string; tone: Tone }>({
    modelId: MODELS[0].id,
    tone: "Neutral",
  });
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const streamRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];

    if (streamRef.current !== null) {
      window.clearInterval(streamRef.current);
      streamRef.current = null;
    }
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((timer) => timer !== id);
      callback();
    }, delay);

    timeoutsRef.current.push(id);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    if (status !== "recording") return;

    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const startRecording = useCallback(() => {
    clearTimers();
    setTranscript("");
    setResponse("");
    setElapsed(0);
    setCopied(false);
    setActiveTakeId(null);
    setStatus("recording");
  }, [clearTimers]);

  const stopRecording = useCallback(() => {
    if (status !== "recording") return;

    const seconds = elapsed > 0 ? elapsed : 3;
    const takeId = `take-${Date.now()}`;
    setStatus("transcribing");

    schedule(() => {
      setTranscript(SAMPLE_TRANSCRIPT);
      setElapsed(seconds);
      setStatus("ready");
      setActiveTakeId(takeId);
      setTakes((current) => [
        {
          id: takeId,
          title: titleFromTranscript(SAMPLE_TRANSCRIPT),
          transcript: SAMPLE_TRANSCRIPT,
          seconds,
          model: MODELS.find((model) => model.id === modelId)?.name ?? MODELS[0].name,
          when: "Just now",
        },
        ...current,
      ]);
    }, 1100);
  }, [elapsed, modelId, schedule, status]);

  const toggleRecording = () => {
    if (status === "recording") {
      stopRecording();
      return;
    }

    if (status === "idle" || status === "ready" || status === "done") {
      startRecording();
    }
  };

  const sendToModel = useCallback(() => {
    if (!transcript.trim()) return;
    if (status === "recording" || status === "transcribing") return;
    if (status === "thinking" || status === "replying") return;

    clearTimers();
    setResponse("");
    setReplyMeta({ modelId, tone });
    setStatus("thinking");

    const tokens = REPLIES[tone].split(/(\s+)/).filter(Boolean);

    schedule(() => {
      let index = 0;
      setStatus("replying");

      streamRef.current = window.setInterval(() => {
        index = Math.min(index + 2, tokens.length);
        setResponse(tokens.slice(0, index).join(""));

        if (index >= tokens.length) {
          if (streamRef.current !== null) {
            window.clearInterval(streamRef.current);
            streamRef.current = null;
          }
          setStatus("done");
        }
      }, 40);
    }, 900);
  }, [clearTimers, modelId, schedule, status, tone, transcript]);

  const reset = useCallback(() => {
    clearTimers();
    setStatus("idle");
    setElapsed(0);
    setTranscript("");
    setResponse("");
    setCopied(false);
    setActiveTakeId(null);
  }, [clearTimers]);

  const loadTake = useCallback(
    (take: Take) => {
      clearTimers();
      setTranscript(take.transcript);
      setElapsed(take.seconds);
      setResponse("");
      setCopied(false);
      setActiveTakeId(take.id);
      setStatus("ready");
    },
    [clearTimers]
  );

  const applySuggestion = (text: string) => {
    clearTimers();
    setTranscript(text);
    setElapsed(Math.max(4, Math.round(text.trim().split(/\s+/).length / 2.4)));
    setResponse("");
    setCopied(false);
    setActiveTakeId(null);
    setStatus("ready");
  };

  const copyTranscript = async () => {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript);
    } catch {
      // Clipboard access can be blocked in preview environments; keep the mock.
    }

    setCopied(true);
    schedule(() => setCopied(false), 1600);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat) {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest("input, textarea, select, button, [contenteditable='true']")
        ) {
          return;
        }

        if (status === "recording") {
          event.preventDefault();
          stopRecording();
          return;
        }

        if (status === "idle" || status === "ready" || status === "done") {
          event.preventDefault();
          startRecording();
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        sendToModel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sendToModel, startRecording, status, stopRecording]);

  const activeModel = MODELS.find((model) => model.id === modelId) ?? MODELS[0];
  const replyModel = MODELS.find((model) => model.id === replyMeta.modelId) ?? MODELS[0];
  const languageLabel =
    LANGUAGES.find((item) => item.id === language)?.label ?? LANGUAGES[0].label;
  const isRecording = status === "recording";
  const isBusy =
    status === "recording" ||
    status === "transcribing" ||
    status === "thinking" ||
    status === "replying";
  const micDisabled =
    status === "transcribing" || status === "thinking" || status === "replying";
  const waveformState = isRecording
    ? "recording"
    : status === "transcribing" || status === "thinking" || status === "replying"
      ? "processing"
      : "idle";
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const hasContent = Boolean(transcript || response);
  const showResponse = status === "thinking" || status === "replying" || Boolean(response);

  const statusLabel = (() => {
    switch (status) {
      case "recording":
        return "Listening";
      case "transcribing":
        return "Transcribing";
      case "ready":
        return "Transcript ready";
      case "thinking":
        return "Thinking";
      case "replying":
        return "Responding";
      case "done":
        return "Response ready";
      default:
        return "Ready when you are";
    }
  })();

  const statusHint = (() => {
    switch (status) {
      case "recording":
        return "Speak naturally. Tap the mic again to stop.";
      case "transcribing":
        return "Turning your voice into text…";
      case "ready":
        return "Edit the transcript, then send it to the model.";
      case "thinking":
        return `Sending the transcript to ${replyModel.name}…`;
      case "replying":
        return `${replyModel.name} is writing a response…`;
      case "done":
        return "Ask a follow-up, load a recent take, or start over.";
      default:
        return "Tap the mic or press Space to start a mock recording.";
    }
  })();

  const sessionRows = [
    { label: "Model", value: activeModel.name },
    { label: "Language", value: languageLabel },
    { label: "Mode", value: "Tap to talk" },
    { label: "Est. latency", value: activeModel.latency },
  ];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
            <HugeiconsIcon icon={AudioWaveformIcon} className="size-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm leading-tight font-semibold">Cadence</p>
            <p className="text-[11px] text-muted-foreground">Voice model input</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex">
            <span className="size-1.5 rounded-full bg-signal" />
            Prototype
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark((value) => !value)}
            aria-label={isDark ? "Use light theme" : "Use dark theme"}
            aria-pressed={isDark}
          >
            <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} strokeWidth={2} />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pt-2 pb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Speak to your model
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Record a thought, edit the transcript, then send it. Everything here is simulated — no
          microphone is opened and no audio leaves this page.
        </p>
      </div>

      <main className="mx-auto grid w-full max-w-5xl items-start gap-4 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Voice input</CardTitle>
              <CardDescription>
                Choose a model and tone, then speak a thought out loud.
              </CardDescription>
              <CardAction>
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Preview
                </span>
              </CardAction>
            </CardHeader>

            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                <div className="grid min-w-0 flex-1 gap-1.5 sm:flex-none">
                  <Label
                    htmlFor="voice-model"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Model
                  </Label>
                  <Select value={modelId} onValueChange={setModelId}>
                    <SelectTrigger id="voice-model" className="w-full sm:w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid min-w-0 flex-1 gap-1.5 sm:flex-none">
                  <Label
                    htmlFor="voice-language"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="voice-language" className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full gap-1.5 sm:ml-auto sm:w-auto">
                  <span
                    id="tone-label"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Response tone
                  </span>
                  <div
                    role="group"
                    aria-labelledby="tone-label"
                    className="inline-flex rounded-md border bg-muted/40 p-0.5"
                  >
                    {TONES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={tone === option}
                        onClick={() => setTone(option)}
                        className={cn(
                          "flex-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors sm:flex-none",
                          tone === option
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border bg-muted/20 px-4 pt-6 pb-4 transition-colors sm:px-6",
                  isRecording && "border-signal/40 bg-signal-muted/60"
                )}
              >
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative">
                    {isRecording && (
                      <>
                        <span className="pointer-events-none absolute inset-0 animate-[voice-ring_2.4s_ease-out_infinite] rounded-full border border-signal/50" />
                        <span className="pointer-events-none absolute inset-0 animate-[voice-ring_2.4s_ease-out_infinite] rounded-full border border-signal/30 [animation-delay:1.2s]" />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={micDisabled}
                      aria-pressed={isRecording}
                      aria-label={
                        isRecording
                          ? "Stop recording"
                          : micDisabled
                            ? "Processing, please wait"
                            : "Start recording"
                      }
                      className={cn(
                        "relative grid size-16 place-items-center rounded-full border border-transparent transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-wait disabled:opacity-60 sm:size-20",
                        isRecording
                          ? "bg-signal text-signal-foreground shadow-lg shadow-signal/25"
                          : "bg-foreground text-background hover:opacity-90 active:translate-y-px"
                      )}
                    >
                      <HugeiconsIcon
                        icon={micDisabled ? Loading03Icon : isRecording ? StopIcon : Mic01Icon}
                        className={cn("size-6 sm:size-7", micDisabled && "animate-spin")}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="flex items-center justify-center gap-2 text-sm font-medium">
                      <span aria-live="polite" className="flex items-center gap-2">
                        {isRecording && (
                          <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                        )}
                        {statusLabel}
                      </span>
                      {elapsed > 0 && status !== "idle" && (
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {formatTime(elapsed)}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{statusHint}</p>
                  </div>

                  <VoiceWaveform state={waveformState} className="mt-2" />
                </div>
              </div>

              {status === "idle" && !transcript && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Try:</span>
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion.label}
                      variant="outline"
                      size="sm"
                      onClick={() => applySuggestion(suggestion.transcript)}
                      className="rounded-full px-2.5 text-[11px] font-normal"
                    >
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              )}

              {transcript && (
                <div className="overflow-hidden rounded-lg border bg-card">
                  <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <HugeiconsIcon
                        icon={AudioWaveformIcon}
                        className="size-3.5 shrink-0 text-muted-foreground"
                        strokeWidth={2}
                      />
                      <span className="text-xs font-medium">Transcript</span>
                      <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
                        · {formatTime(elapsed)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-[11px] text-muted-foreground">
                        {wordCount} words
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={copyTranscript}
                        aria-label={copied ? "Transcript copied" : "Copy transcript"}
                      >
                        <HugeiconsIcon
                          icon={copied ? CopyCheckIcon : Copy01Icon}
                          strokeWidth={2}
                          className={copied ? "text-signal" : undefined}
                        />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    aria-label="Transcript"
                    className="min-h-24 rounded-none border-0 bg-transparent px-3 py-2.5 text-sm/relaxed focus-visible:ring-1 focus-visible:ring-signal/40 focus-visible:ring-inset dark:bg-transparent"
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-between gap-3 border-t">
              <p className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px]">
                  Space
                </kbd>
                to record
                <span aria-hidden="true">·</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px]">
                  ⌘/Ctrl ↵
                </kbd>
                to send
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={!hasContent || isBusy}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={sendToModel}
                  disabled={!transcript.trim() || isBusy}
                >
                  {status === "thinking" ? "Sending…" : "Send to model"}
                  <HugeiconsIcon
                    icon={status === "thinking" ? Loading03Icon : ArrowRight01Icon}
                    strokeWidth={2}
                    className={status === "thinking" ? "animate-spin" : undefined}
                  />
                </Button>
              </div>
            </CardFooter>
          </Card>

          {showResponse && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded bg-signal-muted text-signal">
                    <HugeiconsIcon icon={SparklesIcon} className="size-3" strokeWidth={2} />
                  </span>
                  {replyModel.name}
                </CardTitle>
                <CardDescription>
                  {replyModel.detail} · {replyMeta.tone.toLowerCase()} tone · mock response
                </CardDescription>
                <CardAction>
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {status === "replying" && (
                      <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                    )}
                    {status === "thinking"
                      ? "Thinking"
                      : status === "replying"
                        ? "Streaming"
                        : "Complete"}
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent>
                {status === "thinking" ? (
                  <div className="grid gap-2 py-1" aria-label="Generating response">
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
                    <div className="h-2.5 w-[92%] animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
                    <div className="h-2.5 w-[74%] animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm/relaxed text-foreground/90">
                    {response}
                    {status === "replying" && (
                      <span
                        aria-hidden="true"
                        className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-[voice-caret_1s_step-end_infinite] bg-signal"
                      />
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Mock settings for this input.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2.5">
                {sessionRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="truncate font-medium text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 rounded-md border border-dashed bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
                Audio never leaves the page in this prototype.
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Recent takes</CardTitle>
              <CardDescription>Click one to load its transcript.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-0.5">
              {takes.slice(0, 4).map((take) => {
                const isActive = activeTakeId === take.id;

                return (
                  <button
                    key={take.id}
                    type="button"
                    onClick={() => loadTake(take)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-muted",
                      isActive && "bg-signal-muted ring-1 ring-signal/25"
                    )}
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-background ring-1 ring-border">
                      <HugeiconsIcon
                        icon={AudioWaveformIcon}
                        className={cn(
                          "size-3.5 text-muted-foreground",
                          isActive && "text-signal"
                        )}
                        strokeWidth={2}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{take.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {take.model} · {formatTime(take.seconds)} · {take.when}
                      </span>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-6 pb-10 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Cadence prototype · all voice, transcription, and replies are simulated.</p>
        <p>Built with React, Tailwind, and ShadCN.</p>
      </footer>
    </div>
  );
}
