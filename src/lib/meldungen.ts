import { useCallback, useEffect, useRef, useState } from "react";
import type { Anhang, Meldung, MeldungStatus } from "@/server/meldungen";

export type { Anhang, Meldung, MeldungStatus };

type MeldungAenderung = Partial<Omit<Meldung, "id">>;

/** Text fields are saved after this pause in typing. */
const SPEICHER_VERZOEGERUNG_MS = 400;
const NEUVERBINDUNG_MS = 2000;

async function anfrage<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Anfrage fehlgeschlagen.");
  return result;
}

const alsJson = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
  // Lets a pending save finish when the page is left right after typing.
  keepalive: true,
});

const meldungUrl = (id: string) => `/api/meldungen/${encodeURIComponent(id)}`;

export const ladeMeldungen = () => anfrage<Meldung[]>("/api/meldungen");
export const erstelleMeldung = (meldung: Meldung) =>
  anfrage<Meldung>("/api/meldungen", alsJson("POST", meldung));
export const aktualisiereMeldung = (id: string, aenderung: MeldungAenderung) =>
  anfrage<Meldung>(meldungUrl(id), alsJson("PATCH", aenderung));
export const loescheMeldung = (id: string) =>
  anfrage<void>(meldungUrl(id), { method: "DELETE" });

/** Uploads a photo or file to the laptop and returns it as an attachment. */
export function ladeDateiHoch(datei: File): Promise<Anhang> {
  const form = new FormData();
  form.append("datei", datei);
  return anfrage<Anhang>("/api/dateien", { method: "POST", body: form });
}

/** Calls `onAenderung` whenever the server reports a write, and after every (re)connect. */
function useLiveAktualisierung(onAenderung: () => void) {
  const callbackRef = useRef(onAenderung);
  callbackRef.current = onAenderung;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let neuverbindung: number | undefined;
    let beendet = false;

    const verbinde = () => {
      const protokoll = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protokoll}//${location.host}/api/live`);
      socket.onopen = () => callbackRef.current();
      socket.onmessage = () => callbackRef.current();
      socket.onclose = () => {
        if (!beendet)
          neuverbindung = window.setTimeout(verbinde, NEUVERBINDUNG_MS);
      };
    };

    verbinde();
    return () => {
      beendet = true;
      window.clearTimeout(neuverbindung);
      socket?.close();
    };
  }, []);
}

/**
 * Shared, live-synchronised list of Meldungen (without rejected ones).
 * Changes are applied locally right away; unsaved ones are kept on top of refetched data
 * so live updates never overwrite what the user is typing.
 */
export function useMeldungen() {
  const [serverStand, setServerStand] = useState<Meldung[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [, setVersion] = useState(0);
  const neueMeldungen = useRef(new Map<string, Meldung>());
  const ausstehend = useRef(new Map<string, MeldungAenderung>());
  const timer = useRef(new Map<string, number>());

  const zeigeLokaleAenderungen = () => setVersion((version) => version + 1);
  const meldeFehler = (error: Error) => setFehler(error.message);

  const neuLaden = useCallback(() => {
    ladeMeldungen()
      .then((liste) => {
        setServerStand(liste);
        setFehler(null);
      })
      .catch(meldeFehler)
      .finally(() => setLaedt(false));
  }, []);

  useEffect(neuLaden, [neuLaden]);
  useLiveAktualisierung(neuLaden);

  const speichere = useCallback((id: string) => {
    window.clearTimeout(timer.current.get(id));
    timer.current.delete(id);
    const gesendet = ausstehend.current.get(id);
    if (!gesendet) return;
    aktualisiereMeldung(id, gesendet)
      .then(() => {
        // Keep only fields that changed again while the request was running.
        const aktuell = ausstehend.current.get(id) ?? {};
        const offen = Object.fromEntries(
          Object.entries(aktuell).filter(
            ([feld, wert]) => wert !== gesendet[feld as keyof MeldungAenderung],
          ),
        );
        if (Object.keys(offen).length > 0) ausstehend.current.set(id, offen);
        else ausstehend.current.delete(id);
      })
      .catch(meldeFehler);
  }, []);

  // Flush unsaved text when the page is left (keepalive lets the request finish).
  useEffect(() => {
    const allesSpeichern = () => [...timer.current.keys()].forEach(speichere);
    window.addEventListener("pagehide", allesSpeichern);
    return () => {
      window.removeEventListener("pagehide", allesSpeichern);
      allesSpeichern();
    };
  }, [speichere]);

  const erstelle = (meldung: Meldung) => {
    neueMeldungen.current.set(meldung.id, meldung);
    zeigeLokaleAenderungen();
    erstelleMeldung(meldung)
      .then((gespeichert) =>
        setServerStand((aktuell) =>
          aktuell.some(({ id }) => id === gespeichert.id)
            ? aktuell
            : [gespeichert, ...aktuell],
        ),
      )
      .catch(meldeFehler)
      .finally(() => neueMeldungen.current.delete(meldung.id));
  };

  /** `sofort` saves without the typing delay (e.g. for status, priority or photos). */
  const aendere = (
    id: string,
    aenderung: MeldungAenderung,
    { sofort = false } = {},
  ) => {
    ausstehend.current.set(id, { ...ausstehend.current.get(id), ...aenderung });
    zeigeLokaleAenderungen();
    window.clearTimeout(timer.current.get(id));
    timer.current.set(
      id,
      window.setTimeout(
        () => speichere(id),
        sofort ? 0 : SPEICHER_VERZOEGERUNG_MS,
      ),
    );
  };

  const loesche = (id: string) => {
    window.clearTimeout(timer.current.get(id));
    timer.current.delete(id);
    ausstehend.current.delete(id);
    setServerStand((aktuell) => aktuell.filter((meldung) => meldung.id !== id));
    return loescheMeldung(id).catch(meldeFehler);
  };

  const bekannteIds = new Set(serverStand.map(({ id }) => id));
  const meldungen = [
    ...[...neueMeldungen.current.values()]
      .filter(({ id }) => !bekannteIds.has(id))
      .reverse(),
    ...serverStand,
  ]
    .map((meldung) => ({ ...meldung, ...ausstehend.current.get(meldung.id) }))
    .filter(({ status }) => status !== "abgelehnt");

  return { meldungen, laedt, fehler, erstelle, aendere, loesche };
}

/** crypto.randomUUID only exists in secure contexts (https/localhost), not on plain LAN http. */
export const neueMeldungsId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** "Meldung: Betonpumpe defekt" */
export const anzeigeTitel = ({
  title,
  vorgangstyp,
}: Pick<Meldung, "title" | "vorgangstyp">) =>
  vorgangstyp ? `${vorgangstyp}: ${title}` : title;
