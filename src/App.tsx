import { useState } from "react";
import "./index.css";

const NAV_ITEMS = ["Overview", "Sessions", "Reports", "Settings"] as const;

type Section = (typeof NAV_ITEMS)[number];

export function App() {
  const [section, setSection] = useState<Section>("Overview");

  return (
    <div className="flex min-h-screen bg-white text-neutral-950">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-200 md:flex">
        <div className="flex h-12 items-center border-b border-neutral-200 px-4">
          <span className="text-sm font-semibold tracking-tight">btbm</span>
        </div>

        <nav aria-label="Primary" className="flex flex-col p-3">
          <p className="px-3 pt-1 pb-2 text-[10px] font-medium tracking-[0.14em] text-neutral-400 uppercase">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = section === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setSection(item)}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-8 items-center border-l pl-3 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-950 ${
                  isActive
                    ? "border-neutral-950 font-medium text-neutral-950"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <p className="mt-auto border-t border-neutral-200 px-4 py-3 text-[11px] text-neutral-400">
          Prototype
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 px-5">
          <h1 className="text-sm font-medium">{section}</h1>
          <p className="text-[11px] text-neutral-400">Nov 20, 2026</p>
        </header>

        <main className="flex-1" />
      </div>
    </div>
  );
}

export default App;
