import logo from "@/sketch_2_cockpit.svg";

/** Title bar shared by all Cockpit pages: logo and title. */
export function CockpitHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-6 shadow-sm">
      <a href="/cockpit" className="flex items-center gap-3">
        <img src={logo} alt="" className="h-10 w-auto" />
        <span className="text-2xl font-semibold text-primary">Cockpit</span>
      </a>
    </header>
  );
}
