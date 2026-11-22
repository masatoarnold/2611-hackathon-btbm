import { BoldIcon, ListIcon, SparklesIcon } from "lucide-react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";

import { AbschnittsUeberschrift, QuellenKontext } from "@/components/TagesberichtErweiterungen";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Meldung } from "@/lib/meldungen";

const ENTWURF_SCHLUESSEL = "tagesbericht-entwurf";

const ABSATZ = "text";
const BLOCK_AUSWAHL = [
  { wert: ABSATZ, label: "Text" },
  { wert: "1", label: "Überschrift 1" },
  { wert: "2", label: "Überschrift 2" },
  { wert: "3", label: "Überschrift 3" },
];

function ladeEntwurf(): JSONContent | undefined {
  try {
    const roh = localStorage.getItem(ENTWURF_SCHLUESSEL);
    return roh ? JSON.parse(roh) : undefined;
  } catch {
    return undefined;
  }
}

const speichereEntwurf = (dokument: JSONContent) =>
  localStorage.setItem(ENTWURF_SCHLUESSEL, JSON.stringify(dokument));

/** IDs of all Meldungen that flowed into the report. */
function sammleQuellen(dokument: ProseMirrorNode) {
  const ids = new Set<string>();
  dokument.descendants((knoten) => {
    if (knoten.type.name === "heading") {
      (knoten.attrs.quellen as string[]).forEach((id) => ids.add(id));
    }
  });
  return [...ids].sort();
}

const textKnoten = (text: string) => [{ type: "text", text }];

/** One section per Meldung: its title as heading, its summary as paragraphs. Oldest first. */
function abschnittsKnoten(meldungen: Meldung[]): JSONContent[] {
  return [...meldungen]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .flatMap(({ id, title, content }) => [
      {
        type: "heading",
        attrs: { level: 2, quellen: [id] },
        content: textKnoten(title.trim() || "Meldung"),
      },
      ...content
        .split("\n")
        .filter((zeile) => zeile.trim())
        .map((zeile) => ({ type: "paragraph", content: textKnoten(zeile.trim()) })),
    ]);
}

function Werkzeugleiste({
  editor,
  block,
  fett,
  liste,
  leer,
  onNeuErstellen,
}: {
  editor: Editor;
  block: string;
  fett: boolean;
  liste: boolean;
  leer: boolean;
  onNeuErstellen: () => void;
}) {
  const blockWechseln = (wert: string) => {
    const kette = editor.chain().focus();
    if (wert === ABSATZ) kette.setParagraph().run();
    else kette.setHeading({ level: Number(wert) as 1 | 2 | 3 }).run();
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 rounded-full bg-muted p-1">
      <Select value={block} onValueChange={blockWechseln} disabled={leer}>
        <SelectTrigger
          size="sm"
          aria-label="Textart"
          className="w-36 shrink-0 border-transparent bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_AUSWAHL.map(({ wert, label }) => (
            <SelectItem key={wert} value={wert}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant={fett ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Fett"
        aria-pressed={fett}
        disabled={leer}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon />
      </Button>
      <Button
        variant={liste ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Aufzählung"
        aria-pressed={liste}
        disabled={leer}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon />
      </Button>
      <div className="ml-auto">
        {!leer && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <SparklesIcon />
                Neu erstellen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tagesbericht neu erstellen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Der aktuelle Bericht wird ersetzt, auch deine Änderungen gehen verloren.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={onNeuErstellen}>Neu erstellen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

/**
 * WYSIWYG editor for the Tagesbericht. Headings carry the Meldungen they were built from
 * and show them as small icons in the left margin. The draft is kept in localStorage.
 */
export function TagesberichtEditor({
  meldungen,
  titel,
  hervorgehobeneId,
  onHervorheben,
  onMeldungOeffnen,
  onMarkdownChange,
}: {
  meldungen: Meldung[];
  /** Main heading of a newly created report. */
  titel: string;
  hervorgehobeneId: string | null;
  onHervorheben: (id: string | null) => void;
  onMeldungOeffnen: (id: string) => void;
  onMarkdownChange: (markdown: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
        underline: false,
      }),
      AbschnittsUeberschrift,
      Markdown,
    ],
    content: ladeEntwurf(),
    editorProps: {
      attributes: {
        "aria-label": "Tagesbericht bearbeiten",
        class: `flex flex-col gap-2 text-sm outline-none [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-primary [&_h3]:text-sm [&_h3]:font-medium [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5`,
      },
    },
    onCreate: ({ editor }) => onMarkdownChange(editor.getMarkdown()),
    onUpdate: ({ editor }) => {
      speichereEntwurf(editor.getJSON());
      onMarkdownChange(editor.getMarkdown());
    },
  });

  const zustand = useEditorState({
    editor,
    selector: ({ editor }) => ({
      leer: editor?.isEmpty ?? true,
      fett: editor?.isActive("bold") ?? false,
      liste: editor?.isActive("bulletList") ?? false,
      block: editor?.isActive("heading") ? String(editor.getAttributes("heading").level) : ABSATZ,
      quellen: editor ? sammleQuellen(editor.state.doc) : [],
    }),
  });

  if (!editor) return null;

  const fehlendeMeldungen = meldungen.filter(({ id }) => !zustand.quellen.includes(id));

  const erstelle = (modus: "neu" | "ergaenzen") => {
    if (modus === "neu") {
      editor.commands.setContent({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: textKnoten(titel) },
          ...abschnittsKnoten(meldungen),
        ],
      });
    } else {
      editor.commands.insertContentAt(
        editor.state.doc.content.size,
        abschnittsKnoten(fehlendeMeldungen),
      );
    }
  };

  return (
    <QuellenKontext.Provider
      value={{
        meldungen: new Map(meldungen.map((meldung) => [meldung.id, meldung])),
        hervorgehobeneId,
        onHervorheben,
        onOeffnen: onMeldungOeffnen,
      }}
    >
      <div className="flex flex-col gap-3">
        <Werkzeugleiste
          editor={editor}
          block={zustand.block}
          fett={zustand.fett}
          liste={zustand.liste}
          leer={zustand.leer}
          onNeuErstellen={() => erstelle("neu")}
        />

        {zustand.leer && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {meldungen.length === 0
                ? "Keine Meldungen für den Tagesbericht vorhanden."
                : "Noch kein Tagesbericht. Er wird aus den Meldungen zusammengestellt."}
            </p>
            <Button disabled={meldungen.length === 0} onClick={() => erstelle("neu")}>
              <SparklesIcon />
              Tagesbericht erstellen
            </Button>
          </div>
        )}

        <EditorContent editor={editor} className={zustand.leer ? "hidden" : "pl-9"} />

        {!zustand.leer && fehlendeMeldungen.length > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            <span>
              {fehlendeMeldungen.length === 1
                ? "1 Meldung ist noch nicht im Bericht."
                : `${fehlendeMeldungen.length} Meldungen sind noch nicht im Bericht.`}
            </span>
            <Button variant="outline" size="sm" onClick={() => erstelle("ergaenzen")}>
              Ergänzen
            </Button>
          </div>
        )}
      </div>
    </QuellenKontext.Provider>
  );
}
