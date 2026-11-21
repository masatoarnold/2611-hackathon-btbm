import { DownloadIcon, MailIcon, PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAGESBERICHT = {
  datum: "20.11.26",
  projekt: "Bauprojekt XYZ",
  text: "Beton-Lieferung nach Plan, Verzögerungen aufgrund des Wetters…",
};

const VORFAELLE_MOCK = [
  { id: "vorfall-1", titel: "Vorfall 1: Gerät defekt" },
  { id: "vorfall-2", titel: "Vorfall 2: Materialmangel" },
];

const MELDUNGSDATUM = "19.11.26";

const RISIKEN_MOCK = [
  { id: "risiko-1", titel: "Risiko: Wetterverzögerung Betonarbeiten" },
  { id: "risiko-2", titel: "Risiko: Lieferengpass Bewehrungsstahl" },
];

const VORFALL_MELDUNGEN_MOCK = [
  { id: "meldung-1", titel: "Meldung: Gerät defekt" },
  { id: "meldung-2", titel: "Meldung: Baumaterial defekt" },
];

function Eintrag({ titel, children }: { titel: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
      <span className="text-sm">{titel}</span>
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
                <Eintrag key={id} titel={titel}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Vorfall bearbeiten">
                      <PencilIcon />
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
            <CardContent className="flex-1" />
          </Card>
        </section>
      </main>
    </div>
  );
}
