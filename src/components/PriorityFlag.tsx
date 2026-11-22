import { FlagIcon } from "lucide-react";

/** Flag colour per priority (1 = information only, 5 = safety risk or work stoppage). */
export const PRIORITY_COLORS: Record<number, string> = {
  1: "#000000",
  2: "#3b82f6",
  3: "#eab308",
  4: "#ef4444",
  5: "#8b5cf6",
};

/** Coloured flag with the priority number on a neutral pill (matches the Satellite select). */
export function PriorityFlag({ priority }: { priority: number }) {
  const color = PRIORITY_COLORS[priority];

  return (
    <span
      role="img"
      aria-label={`Priorität ${priority}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-input bg-background px-2 py-0.5 text-xs font-medium"
    >
      <FlagIcon
        className="size-3.5"
        style={{ color, fill: color, stroke: color }}
      />
      {priority}
    </span>
  );
}
