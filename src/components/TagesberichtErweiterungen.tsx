import { createContext, useContext, useEffect, useRef } from "react";
import { FileTextIcon, UsersIcon } from "lucide-react";
import Heading from "@tiptap/extension-heading";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

import { PRIORITY_COLORS, PriorityFlag } from "@/components/PriorityFlag";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { anzeigeTitel, type Meldung } from "@/lib/meldungen";

/** Gutter icons shown per section before the rest collapses into a "+N" badge. */
const MAX_SICHTBARE_QUELLEN = 3;

type QuellenKontextWert = {
  meldungen: Map<string, Meldung>;
  hervorgehobeneId: string | null;
  onHervorheben: (id: string | null) => void;
  onOeffnen: (id: string) => void;
};

export const QuellenKontext = createContext<QuellenKontextWert>({
  meldungen: new Map(),
  hervorgehobeneId: null,
  onHervorheben: () => {},
  onOeffnen: () => {},
});

const formatZeitpunkt = (timestamp: string) =>
  `${new Date(timestamp).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })} Uhr`;

function MeldungsInfo({ meldung }: { meldung: Meldung }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{anzeigeTitel(meldung)}</span>
        <PriorityFlag priority={meldung.priority} />
      </div>
      <p className="text-muted-foreground">
        {formatZeitpunkt(meldung.timestamp)}
        {meldung.location && ` · ${meldung.location}`}
      </p>
      <p className="line-clamp-4 whitespace-pre-line">{meldung.content}</p>
    </div>
  );
}

function QuellenIcon({ meldung }: { meldung: Meldung }) {
  const { hervorgehobeneId, onHervorheben, onOeffnen } = useContext(QuellenKontext);
  const Icon = meldung.vorgangstyp === "Besprechungsprotokoll" ? UsersIcon : FileTextIcon;
  const aktiv = hervorgehobeneId === meldung.id;

  return (
    <HoverCard openDelay={150} closeDelay={50}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`Quelle: ${anzeigeTitel(meldung)}`}
          className={`flex size-5 items-center justify-center rounded-full transition-colors hover:bg-muted ${
            aktiv ? "bg-muted ring-2 ring-primary/40" : ""
          }`}
          onMouseEnter={() => onHervorheben(meldung.id)}
          onMouseLeave={() => onHervorheben(null)}
          onFocus={() => onHervorheben(meldung.id)}
          onBlur={() => onHervorheben(null)}
          onClick={() => onOeffnen(meldung.id)}
        >
          <Icon
            className="size-3.5 text-muted-foreground"
            style={meldung.priority > 1 ? { color: PRIORITY_COLORS[meldung.priority] } : undefined}
          />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="left" align="start">
        <MeldungsInfo meldung={meldung} />
        <p className="mt-2 text-muted-foreground">Klicken, um die Meldung zu öffnen.</p>
      </HoverCardContent>
    </HoverCard>
  );
}

function WeitereQuellen({ meldungen }: { meldungen: Meldung[] }) {
  const { onOeffnen } = useContext(QuellenKontext);
  return (
    <HoverCard openDelay={150} closeDelay={50}>
      <HoverCardTrigger asChild>
        <span className="flex h-5 min-w-5 cursor-default items-center justify-center rounded-full bg-muted px-1 text-[0.625rem] text-muted-foreground tabular-nums">
          +{meldungen.length}
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="left" align="start" className="flex flex-col">
        {meldungen.map((meldung) => (
          <button
            key={meldung.id}
            type="button"
            className="rounded-md px-1.5 py-1 text-left hover:bg-muted"
            onClick={() => onOeffnen(meldung.id)}
          >
            {anzeigeTitel(meldung)}
          </button>
        ))}
      </HoverCardContent>
    </HoverCard>
  );
}

function UeberschriftAnsicht({ node }: NodeViewProps) {
  const { meldungen } = useContext(QuellenKontext);
  const ebene = node.attrs.level as 1 | 2 | 3;
  const quellen = (node.attrs.quellen as string[])
    .map((id) => meldungen.get(id))
    .filter((meldung): meldung is Meldung => meldung !== undefined);
  const sichtbar = quellen.slice(0, MAX_SICHTBARE_QUELLEN);
  const weitere = quellen.slice(MAX_SICHTBARE_QUELLEN);
  const hatQuellen = quellen.length > 0;

  const spalteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // ProseMirror starts a text selection on mousedown and would swallow the icon click.
    const spalte = spalteRef.current;
    const stoppeMausklick = (event: Event) => event.stopPropagation();
    spalte?.addEventListener("mousedown", stoppeMausklick);
    return () => spalte?.removeEventListener("mousedown", stoppeMausklick);
  }, [hatQuellen]);

  return (
    <NodeViewWrapper className={ebene === 1 ? "relative" : "relative mt-3"}>
      {hatQuellen && (
        <div
          ref={spalteRef}
          contentEditable={false}
          className="absolute top-0 right-full mr-2 flex flex-col items-center gap-0.5 select-none"
        >
          {sichtbar.map((meldung) => (
            <QuellenIcon key={meldung.id} meldung={meldung} />
          ))}
          {weitere.length > 0 && <WeitereQuellen meldungen={weitere} />}
        </div>
      )}
      {/* NodeViewContent only types "div", but any tag works at runtime. */}
      <NodeViewContent as={`h${ebene}` as "div"} />
    </NodeViewWrapper>
  );
}

/** Heading that remembers which Meldungen flowed into its section (`quellen`). */
export const AbschnittsUeberschrift = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      quellen: { default: [] as string[], rendered: false },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(UeberschriftAnsicht);
  },
}).configure({ levels: [1, 2, 3] });
