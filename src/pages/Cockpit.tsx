import { Bauzeitenplan } from "@/components/Bauzeitenplan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KENNZAHLEN = ["Termine", "Abweichungen", "Meldungen", "Dokumente"];

export function Cockpit() {
  return (
    <div className="flex min-h-screen min-w-5xl bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r p-4">
        <p className="text-sm font-medium">Navigation</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center border-b px-6">
          <h1 className="text-sm font-medium">Cockpit</h1>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          <section className="grid grid-cols-4 gap-4">
            {KENNZAHLEN.map((name) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle>{name}</CardTitle>
                </CardHeader>
                <CardContent className="h-16" />
              </Card>
            ))}
          </section>

          <section className="grid flex-1 grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Bauzeitenplan</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <Bauzeitenplan />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Berichte</CardTitle>
              </CardHeader>
              <CardContent className="h-96" />
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
