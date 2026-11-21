import type { GanttFeature, GanttMarkerProps, GanttStatus } from "@/components/kibo-ui/gantt";

export type Vorgang = GanttFeature & { gewerk: string };

const STATUS = {
  geplant: { id: "geplant", name: "Geplant", color: "#a3a3a3" },
  inArbeit: { id: "in-arbeit", name: "In Arbeit", color: "#3b82f6" },
  verzug: { id: "verzug", name: "Verzug", color: "#ef4444" },
  abgeschlossen: { id: "abgeschlossen", name: "Abgeschlossen", color: "#22c55e" },
} satisfies Record<string, GanttStatus>;

export const VORGAENGE_MOCK: Vorgang[] = [
  { id: "v1", gewerk: "Rohbau", name: "Baugrube & Verbau", startAt: new Date(2026, 8, 1), endAt: new Date(2026, 8, 25), status: STATUS.abgeschlossen },
  { id: "v2", gewerk: "Rohbau", name: "Bodenplatte", startAt: new Date(2026, 8, 28), endAt: new Date(2026, 9, 16), status: STATUS.abgeschlossen },
  { id: "v3", gewerk: "Rohbau", name: "Mauerwerk EG/OG", startAt: new Date(2026, 9, 19), endAt: new Date(2026, 10, 27), status: STATUS.verzug },
  { id: "v4", gewerk: "Rohbau", name: "Decke über OG", startAt: new Date(2026, 10, 23), endAt: new Date(2026, 11, 11), status: STATUS.inArbeit },
  { id: "v5", gewerk: "Dach", name: "Dachstuhl", startAt: new Date(2026, 11, 14), endAt: new Date(2027, 0, 15), status: STATUS.geplant },
  { id: "v6", gewerk: "Dach", name: "Dacheindeckung", startAt: new Date(2027, 0, 18), endAt: new Date(2027, 1, 5), status: STATUS.geplant },
  { id: "v7", gewerk: "Haustechnik", name: "Elektro Rohinstallation", startAt: new Date(2027, 0, 11), endAt: new Date(2027, 1, 19), status: STATUS.geplant },
  { id: "v8", gewerk: "Haustechnik", name: "Sanitär Rohinstallation", startAt: new Date(2027, 0, 18), endAt: new Date(2027, 1, 26), status: STATUS.geplant },
  { id: "v9", gewerk: "Haustechnik", name: "Heizung", startAt: new Date(2027, 1, 1), endAt: new Date(2027, 2, 12), status: STATUS.geplant },
  { id: "v10", gewerk: "Ausbau", name: "Innenputz", startAt: new Date(2027, 2, 1), endAt: new Date(2027, 2, 26), status: STATUS.geplant },
  { id: "v11", gewerk: "Ausbau", name: "Estrich", startAt: new Date(2027, 2, 29), endAt: new Date(2027, 3, 16), status: STATUS.geplant },
  { id: "v12", gewerk: "Ausbau", name: "Trockenbau", startAt: new Date(2027, 2, 15), endAt: new Date(2027, 3, 9), status: STATUS.geplant },
];

export const MEILENSTEINE_MOCK: GanttMarkerProps[] = [
  { id: "m1", date: new Date(2026, 11, 18), label: "Richtfest" },
  { id: "m2", date: new Date(2027, 3, 30), label: "Abnahme Ausbau" },
];
