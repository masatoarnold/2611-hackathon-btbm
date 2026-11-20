import { cn } from "@/lib/utils";

type WaveformState = "idle" | "recording" | "processing";

type VoiceWaveformProps = {
  state: WaveformState;
  className?: string;
};

const BAR_COUNT = 48;

const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, index) => {
  const wave = Math.sin(index * 0.55) * 0.5 + Math.sin(index * 0.19 + 1.3) * 0.5;
  const envelope = Math.sin((index / (BAR_COUNT - 1)) * Math.PI);

  return 0.18 + Math.abs(wave) * 0.52 * (0.35 + envelope * 0.65);
});

const HEIGHT_SCALE: Record<WaveformState, number> = {
  idle: 0.35,
  recording: 1,
  processing: 0.45,
};

export function VoiceWaveform({ state, className }: VoiceWaveformProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-14 w-full items-center justify-center gap-[2px] sm:gap-[3px]",
        className
      )}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className={cn(
            "h-full max-w-[5px] flex-1 rounded-full transition-[height,background-color] duration-500",
            state === "idle" && "bg-foreground/15",
            state === "recording" && "animate-[voice-bar_ease-in-out_infinite] bg-signal",
            state === "processing" && "animate-pulse bg-muted-foreground/45"
          )}
          style={{
            height: `${height * HEIGHT_SCALE[state] * 100}%`,
            animationDelay: state === "recording" ? `${(index % 9) * -90}ms` : undefined,
            animationDuration:
              state === "recording" ? `${800 + (index % 7) * 120}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
