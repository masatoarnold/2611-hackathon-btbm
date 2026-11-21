import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Meldung } from "./meldungen";
import { SEED_MELDUNGEN } from "./seed";

// Everything lives in data/ (gitignored). Deleting the folder resets to the seed mocks.
const DATA_DIR = join(import.meta.dir, "../../data");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

// `bun --hot` re-evaluates this module; reuse the open connection instead of leaking one per reload.
const globalForDb = globalThis as typeof globalThis & { btbmDb?: Database };
const db = (globalForDb.btbmDb ??= new Database(join(DATA_DIR, "btbm.sqlite"), {
  create: true,
  strict: true,
}));

db.run("PRAGMA journal_mode = WAL");
db.run(`CREATE TABLE IF NOT EXISTS meldungen (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  transcript TEXT NOT NULL,
  priority INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  location TEXT NOT NULL,
  vorgangstyp TEXT,
  status TEXT NOT NULL,
  attachments TEXT NOT NULL
)`);
db.run(`CREATE TABLE IF NOT EXISTS dateien (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  pfad TEXT NOT NULL
)`);

type MeldungZeile = Omit<Meldung, "attachments" | "status"> & {
  status: Meldung["status"];
  attachments: string;
};
type DateiZeile = { id: string; name: string; mime: string; pfad: string };

const zuMeldung = ({ attachments, ...zeile }: MeldungZeile): Meldung => ({
  ...zeile,
  attachments: JSON.parse(attachments),
});

const upsertMeldung = db.query(`INSERT INTO meldungen
  (id, title, content, transcript, priority, timestamp, location, vorgangstyp, status, attachments)
  VALUES ($id, $title, $content, $transcript, $priority, $timestamp, $location, $vorgangstyp, $status, $attachments)
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title, content = excluded.content, transcript = excluded.transcript,
    priority = excluded.priority, timestamp = excluded.timestamp, location = excluded.location,
    vorgangstyp = excluded.vorgangstyp, status = excluded.status, attachments = excluded.attachments`);

export function speichereMeldung(meldung: Meldung) {
  upsertMeldung.run({
    ...meldung,
    attachments: JSON.stringify(meldung.attachments),
  });
}

/** All Meldungen except rejected ones, newest first. */
export function listeMeldungen(): Meldung[] {
  return db
    .query<MeldungZeile, []>(
      "SELECT * FROM meldungen WHERE status != 'abgelehnt' ORDER BY timestamp DESC",
    )
    .all()
    .map(zuMeldung);
}

export function findeMeldung(id: string): Meldung | null {
  const zeile = db
    .query<MeldungZeile, [string]>("SELECT * FROM meldungen WHERE id = ?")
    .get(id);
  return zeile ? zuMeldung(zeile) : null;
}

export function loescheMeldung(id: string): boolean {
  return db.query("DELETE FROM meldungen WHERE id = ?").run(id).changes > 0;
}

export function speichereDatei(datei: DateiZeile) {
  db.query(
    "INSERT INTO dateien (id, name, mime, pfad) VALUES ($id, $name, $mime, $pfad)",
  ).run(datei);
}

export function findeDatei(id: string): DateiZeile | null {
  return db
    .query<DateiZeile, [string]>("SELECT * FROM dateien WHERE id = ?")
    .get(id);
}

const { anzahl } = db
  .query<{ anzahl: number }, []>("SELECT COUNT(*) AS anzahl FROM meldungen")
  .get()!;
if (anzahl === 0) {
  db.transaction(() => SEED_MELDUNGEN.forEach(speichereMeldung))();
  console.log(
    `📋 Datenbank mit ${SEED_MELDUNGEN.length} Beispiel-Meldungen angelegt`,
  );
}
