import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Coffee, Heart, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Om Kronekort-X — historien og donasjoner" },
      {
        name: "description",
        content:
          "Hvorfor vi bygde Kronekort-X, hvem som står bak — og hvordan du kan støtte videre utvikling.",
      },
      { property: "og:title", content: "Om Kronekort-X" },
      { property: "og:description", content: "Historien bak appen og hvordan du kan støtte oss." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tilbake
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Bygd av frustrasjon. Drevet av kaffe.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Kronekort-X startet som et lite hobbyprosjekt: en måte å slippe å logge inn i
          nettbanken hver gang vi lurte på om lønna eller NAV-utbetalingen hadde kommet.
          I dag er det en åpen plattform som hele familien kan dele.
        </p>

        <section className="mt-12 space-y-4 text-muted-foreground">
          <h2 className="font-display text-2xl font-semibold text-foreground">Hvorfor</h2>
          <p>
            Norske banker har vanvittig gode apper — men ingen lar deg dele saldo med
            samboer eller foreldre uten å gi fra deg BankID. Vi ønsket en pen, rask oversikt
            som respekterer privatlivet og lar deg bestemme hvem som ser hva.
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground">Hvordan</h2>
          <p>
            Saldoen hentes automatisk seks ganger om dagen gjennom en proxy-rotasjon slik at
            ingen IP-adresse blir bombardert. Inaktive kort sjekkes én gang i døgnet for å
            spare ressurser. Tilgang til kortene styres av eieren — alltid.
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground">Hvem</h2>
          <p>
            Et lite team av norske utviklere som drikker for mye kaffe og elsker rene
            grensesnitt. Du kan støtte videre arbeid under.
          </p>
        </section>

        {/* Donate */}
        <section className="mt-12 rounded-3xl border border-border bg-card p-8 text-center">
          <Heart className="mx-auto h-8 w-8 text-[color:var(--spend)]" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Støtt utviklerne</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Kronekort-X er gratis og uten reklame. Hvis appen sparer deg tid, vurder å
            spandere en kaffe — det holder serverne i live.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="https://www.buymeacoffee.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFDD00] px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              <Coffee className="h-4 w-4" /> Buy Me a Coffee
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
            <a
              href="https://ko-fi.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF5E5B] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <Heart className="h-4 w-4" /> Ko-fi
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Send oss gjerne lenkene deres så bytter vi placeholderne med ekte konti.
          </p>
        </section>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Kronekort-X · v1.3 · Bygget med Lovable Cloud
        </p>
      </main>
    </div>
  );
}
