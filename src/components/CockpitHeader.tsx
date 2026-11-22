import { Button } from "@/components/ui/button";

/** Title bar shared by all Cockpit pages: title, date and a link to the site app. */
export function CockpitHeader({ datum }: { datum: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-6 shadow-sm">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold text-primary">
          <a href="/cockpit">Cockpit</a>
        </h1>
        <span className="text-xs text-muted-foreground">{datum}</span>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href="/satellite">Baustellen-App öffnen</a>
      </Button>
    </header>
  );
}
