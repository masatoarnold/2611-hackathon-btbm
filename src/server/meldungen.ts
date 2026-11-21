import type { BunRequest } from "bun";
import { extname, join } from "node:path";
import { z } from "zod";
import {
  findeDatei,
  findeMeldung,
  listeMeldungen,
  loescheMeldung,
  speichereDatei,
  speichereMeldung,
  UPLOAD_DIR,
} from "./db";

const AnhangSchema = z.object({
  id: z.string(),
  name: z.string(),
  typ: z.enum(["bild", "datei"]),
  mime: z.string().optional(),
  /** Real upload, served by /api/dateien/:id. */
  url: z.string().optional(),
  beschreibung: z.string().optional(),
  /** Text preview for mock files without a real upload. */
  vorschauText: z.string().optional(),
});

const MeldungSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  transcript: z.string(),
  priority: z.number().int().min(1).max(5),
  /** ISO 8601 */
  timestamp: z.string(),
  location: z.string(),
  vorgangstyp: z.string().nullable(),
  status: z.enum(["anstehend", "abgeschlossen", "abgelehnt"]),
  attachments: z.array(AnhangSchema),
});

const MeldungAenderungSchema = MeldungSchema.omit({ id: true }).partial();

export type Anhang = z.infer<typeof AnhangSchema>;
export type Meldung = z.infer<typeof MeldungSchema>;
export type MeldungStatus = Meldung["status"];

/** WebSocket topic; every write publishes "changed" so clients refetch. */
export const LIVE_TOPIC = "meldungen";

type Publisher = { publish(topic: string, data: string): unknown };
const meldeAenderung = (server: Publisher) =>
  server.publish(LIVE_TOPIC, "changed");

const nichtGefunden = () =>
  Response.json({ error: "Meldung nicht gefunden." }, { status: 404 });
const ungueltig = (error: z.ZodError) =>
  Response.json(
    { error: "Ungültige Daten.", details: z.treeifyError(error) },
    { status: 400 },
  );

export function handleListeMeldungen(): Response {
  return Response.json(listeMeldungen());
}

export async function handleErstelleMeldung(
  req: Request,
  server: Publisher,
): Promise<Response> {
  const parsed = MeldungSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ungueltig(parsed.error);
  speichereMeldung(parsed.data);
  meldeAenderung(server);
  return Response.json(parsed.data, { status: 201 });
}

export function handleLadeMeldung(
  req: BunRequest<"/api/meldungen/:id">,
): Response {
  const meldung = findeMeldung(req.params.id);
  return meldung ? Response.json(meldung) : nichtGefunden();
}

export async function handleAendereMeldung(
  req: BunRequest<"/api/meldungen/:id">,
  server: Publisher,
): Promise<Response> {
  const vorhanden = findeMeldung(req.params.id);
  if (!vorhanden) return nichtGefunden();
  const parsed = MeldungAenderungSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) return ungueltig(parsed.error);
  const meldung = { ...vorhanden, ...parsed.data };
  speichereMeldung(meldung);
  meldeAenderung(server);
  return Response.json(meldung);
}

export function handleLoescheMeldung(
  req: BunRequest<"/api/meldungen/:id">,
  server: Publisher,
): Response {
  if (!loescheMeldung(req.params.id)) return nichtGefunden();
  meldeAenderung(server);
  return new Response(null, { status: 204 });
}

/** Stores an uploaded file (multipart field "datei") in data/uploads. */
export async function handleLadeDateiHoch(req: Request): Promise<Response> {
  const form = await req.formData().catch(() => null);
  const datei = form?.get("datei");
  if (!(datei instanceof File) || datei.size === 0) {
    return Response.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const mime = datei.type || "application/octet-stream";
  const pfad = join(UPLOAD_DIR, `${id}${extname(datei.name).toLowerCase()}`);
  await Bun.write(pfad, datei);
  speichereDatei({ id, name: datei.name, mime, pfad });

  const anhang: Anhang = {
    id,
    name: datei.name,
    typ: mime.startsWith("image/") ? "bild" : "datei",
    mime,
    url: `/api/dateien/${id}`,
  };
  return Response.json(anhang, { status: 201 });
}

export function handleLadeDatei(req: BunRequest<"/api/dateien/:id">): Response {
  const datei = findeDatei(req.params.id);
  if (!datei)
    return Response.json({ error: "Datei nicht gefunden." }, { status: 404 });
  return new Response(Bun.file(datei.pfad), {
    headers: {
      "Content-Type": datei.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
