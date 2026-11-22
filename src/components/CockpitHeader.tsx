import logo from "@/sketch_2_cockpit.svg";

import { Button } from "@/components/ui/button";

/** Title bar shared by all Cockpit pages: logo and a link to the site app. */
export function CockpitHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-6 shadow-sm">
      <a href="/cockpit" className="flex items-center gap-3">
        <img src={logo} alt="" className="h-10 w-auto" />
        <span className="text-2xl font-semibold text-primary">Cockpit</span>
      </a>
      <Button variant="outline" size="sm" asChild>
        <a href="/satellite">Baustellen-App öffnen</a>
      </Button>
    </header>
  );
}
