import { setDefaultOptions } from "date-fns";
import { de } from "date-fns/locale";
import { ListIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  GanttFeatureList,
  GanttFeatureRow,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
  type Range,
} from "@/components/kibo-ui/gantt";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MEILENSTEINE_MOCK, VORGAENGE_MOCK, type Vorgang } from "@/data/bauzeitenplan.mock";

// German month/day names and durations in all date-fns output (Gantt headers, tooltips).
setDefaultOptions({ locale: de });

const ZEITRASTER: { value: Range; label: string }[] = [
  { value: "daily", label: "Tage" },
  { value: "monthly", label: "Monate" },
  { value: "quarterly", label: "Quartale" },
];

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_SCHRITT = 25;

function groupByGewerk(vorgaenge: Vorgang[]) {
  const gewerke = new Map<string, Vorgang[]>();
  for (const vorgang of vorgaenge) {
    gewerke.set(vorgang.gewerk, [...(gewerke.get(vorgang.gewerk) ?? []), vorgang]);
  }
  return [...gewerke.entries()];
}

export function Bauzeitenplan() {
  const [vorgaenge, setVorgaenge] = useState(VORGAENGE_MOCK);
  const [zeitraster, setZeitraster] = useState<Range>("monthly");
  const [zoom, setZoom] = useState(100);
  const [vorgangslisteSichtbar, setVorgangslisteSichtbar] = useState(true);

  const gewerke = useMemo(() => groupByGewerk(vorgaenge), [vorgaenge]);

  const handleMove = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) return;
    setVorgaenge((previous) =>
      previous.map((vorgang) => (vorgang.id === id ? { ...vorgang, startAt, endAt } : vorgang)),
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <Tabs value={zeitraster} onValueChange={(value) => setZeitraster(value as Range)}>
          <TabsList className="w-auto">
            {ZEITRASTER.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Verkleinern"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setZoom((current) => current - ZOOM_SCHRITT)}
          >
            <MinusIcon />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Vergrößern"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setZoom((current) => current + ZOOM_SCHRITT)}
          >
            <PlusIcon />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={vorgangslisteSichtbar ? "secondary" : "ghost"}
            aria-pressed={vorgangslisteSichtbar}
            onClick={() => setVorgangslisteSichtbar((current) => !current)}
          >
            <ListIcon />
            Vorgangsliste
          </Button>
        </div>
      </div>

      <GanttProvider
        className="min-h-0 flex-1 rounded-md border"
        range={zeitraster}
        zoom={zoom}
        sidebarWidth={240}
      >
        {vorgangslisteSichtbar && (
          <GanttSidebar>
            {gewerke.map(([gewerk, vorgaengeImGewerk]) => (
              <GanttSidebarGroup key={gewerk} name={gewerk}>
                {vorgaengeImGewerk.map((vorgang) => (
                  <GanttSidebarItem key={vorgang.id} feature={vorgang} />
                ))}
              </GanttSidebarGroup>
            ))}
          </GanttSidebar>
        )}
        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {gewerke.map(([gewerk, vorgaengeImGewerk]) => (
              <div key={gewerk}>
                <p
                  className="sticky left-0 w-fit truncate p-2.5 text-xs font-medium text-muted-foreground"
                  style={{ height: "var(--gantt-row-height)" }}
                >
                  {vorgangslisteSichtbar ? null : gewerk}
                </p>
                {vorgaengeImGewerk.map((vorgang) => (
                  <GanttFeatureRow key={vorgang.id} features={[vorgang]} onMove={handleMove} />
                ))}
              </div>
            ))}
          </GanttFeatureList>
          {MEILENSTEINE_MOCK.map((meilenstein) => (
            <GanttMarker key={meilenstein.id} {...meilenstein} />
          ))}
          <GanttToday />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}
