import "./index.css";
import { Cockpit } from "./pages/Cockpit";
import { CockpitMeldungWorkflow } from "./pages/Cockpit_Meldung_Workflow";
import { Satellite } from "./pages/Satellite";

export function App() {
  const path = window.location.pathname.replace(/\/+$/, "");

  if (path === "/cockpit") return <Cockpit />;
  if (path === "/cockpit/meldung") return <CockpitMeldungWorkflow />;
  if (path === "/satellite") return <Satellite />;

  return (
    <main className="p-6 text-sm text-neutral-500">Seite nicht gefunden.</main>
  );
}

export default App;
