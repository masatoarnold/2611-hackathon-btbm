import { DownloadIcon, MailIcon, PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAGESBERICHT = {
  datum: "21.11.26",
  projekt: "Wohnanlage Lindenhof – Haus B",
  text: "Betonage Kellerwände Abschnitt B: Betonpumpe um 08:15 ausgefallen, Ersatzpumpe ab 10:30 im Einsatz. Transportbeton (10 t) ca. 2 h verspätet wegen Stau an der Zufahrt. 14 Arbeitskräfte vor Ort, trocken, 6 °C.",
};

const VORFAELLE_MOCK = [
  { id: "vorfall-1", titel: "Betonpumpe Abschnitt B ausgefallen" },
  { id: "vorfall-2", titel: "Transportbeton 2 h verspätet" },
  { id: "vorfall-3", titel: "Bewehrungspläne Abschnitt C fehlen" },
];

const MELDUNGSDATUM = "21.11.26";

const RISIKEN_MOCK = [
  { id: "risiko-1", titel: "Betonage Bodenplatte C gefährdet (+2 AT)" },
  { id: "risiko-2", titel: "Frost ab 29.11.: Winterbaumaßnahmen nötig" },
  { id: "risiko-3", titel: "Bewehrungsstahl knapp bis KW 49" },
];

const VORFALL_MELDUNGEN_MOCK = [
  { id: "meldung-1", titel: "Behinderungsanzeige: Bewehrungspläne Abschnitt C" },
  { id: "meldung-2", titel: "Bedenkenanzeige: Abdichtung Kellerwände" },
];

const LIEFERUNGEN_MOCK = [
  { id: "lieferung-1", titel: "Transportbeton C25/30, 10 t", status: "verspätet, ca. 11:40" },
  { id: "lieferung-2", titel: "Schalungselemente Kellerwand", status: "geliefert 07:30" },
  { id: "lieferung-3", titel: "Kies 0/32, 18 t", status: "geliefert 08:05" },
  { id: "lieferung-4", titel: "Bewehrungsstahl BSt 500, 4,2 t", status: "erwartet Mo 07:00" },
];

const MELDUNG_WORKFLOW_PFAD = "/cockpit/meldung";

function Eintrag({
  titel,
  href,
  children,
}: {
  titel: string;
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
      {href ? (
        <a href={href} className="text-sm hover:underline">
          {titel}
        </a>
      ) : (
        <span className="text-sm">{titel}</span>
      )}
      {children}
    </div>
  );
}

export function Cockpit() {
  return (
    <div className="flex min-h-screen min-w-5xl flex-col bg-background text-foreground">
      <header className="flex h-12 items-center border-b px-6">
        <h1 className="text-sm font-medium">Cockpit</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-6">
        <section className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Tagesbericht {TAGESBERICHT.datum}
                <br />
                {TAGESBERICHT.projekt}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              {TAGESBERICHT.text}
            </CardContent>
            <CardContent className="flex justify-end gap-1">
              <Button variant="outline">Bericht ansehen</Button>
              <Button variant="ghost" size="icon" aria-label="Bericht bearbeiten">
                <PencilIcon />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Bericht herunterladen">
                <DownloadIcon />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Vorfälle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" size="lg" className="justify-start">
                <PlusIcon />
                Vorfall erstellen
              </Button>
              {VORFAELLE_MOCK.map(({ id, titel }) => (
                <Eintrag key={id} titel={titel} href={MELDUNG_WORKFLOW_PFAD}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Vorfall bearbeiten" asChild>
                      <a href={MELDUNG_WORKFLOW_PFAD}>
                        <PencilIcon />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Vorfall melden">
                      <MailIcon />
                    </Button>
                  </div>
                </Eintrag>
              ))}
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="risiken" className="gap-(--card-spacing)">
              <CardHeader className="flex items-center justify-between">
                <TabsList className="w-auto">
                  <TabsTrigger value="risiken">Risiken</TabsTrigger>
                  <TabsTrigger value="vorfaelle">Vorfälle</TabsTrigger>
                </TabsList>
                <span className="text-xs text-muted-foreground">Datum: {MELDUNGSDATUM}</span>
              </CardHeader>
              <CardContent>
                <TabsContent value="risiken" className="flex flex-col gap-2">
                  {RISIKEN_MOCK.map(({ id, titel }) => (
                    <Eintrag key={id} titel={titel} />
                  ))}
                </TabsContent>
                <TabsContent value="vorfaelle" className="flex flex-col gap-2">
                  {VORFALL_MELDUNGEN_MOCK.map(({ id, titel }) => (
                    <Eintrag key={id} titel={titel} />
                  ))}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lieferketten</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {LIEFERUNGEN_MOCK.map(({ id, titel, status }) => (
                <Eintrag key={id} titel={titel}>
                  <span className="shrink-0 text-xs text-muted-foreground">{status}</span>
                </Eintrag>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
