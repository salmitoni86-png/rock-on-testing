import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CreditCard, RefreshCw, Sparkles, Users, ShieldCheck, Bell, Globe, BookOpen, Lock, Receipt, BarChart3, PlusCircle } from "lucide-react";
import { LivingBackground, HeroText } from "@/components/LivingBackground";
import { DemoVideoSection } from "@/components/DemoVideoSection";
import { ShareBar } from "@/components/ShareBar";
import { LiveWorldMap } from "@/components/LiveWorldMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kronekort-X — saldo i sanntid, helt uten styr" },
      {
        name: "description",
        content:
          "Følg DNB Kronekort-saldoen din automatisk 6 ganger om dagen, del kortet trygt med familien, og få varsel når lønn eller NAV-utbetaling lander.",
      },
      { property: "og:title", content: "Kronekort-X — saldo i sanntid, helt uten styr" },
      {
        property: "og:description",
        content: "Automatisk saldo, smart deling og varsler — for hele familien.",
      },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <LivingBackground />
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[color:var(--bcard-c)] text-primary-foreground">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Kronekort-X</span>
        </div>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link to="/blog" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Blogg</Link>
          <Link to="/analytics" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Live</Link>
          <Link to="/about" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Om</Link>
          <Link to="/login" className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">Logg inn</Link>
          <Link
            to="/signup"
            className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            Opprett konto
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              For DNB Kronekort-brukere
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              <HeroText text="Vet hvor kronene dine er" />
              <span className="block bg-gradient-to-r from-primary via-[color:var(--bcard-c)] to-[color:var(--salary)] bg-clip-text text-transparent">
                <HeroText text="— før banken gjør det." />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Kronekort-X henter saldoen din automatisk gjennom dagen, varsler deg når lønn
              eller NAV lander, og lar deg dele kortet trygt med familien — uten å gi fra
              deg passord.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
              >
                Kom i gang gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-accent"
              >
                Jeg har allerede konto
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Ingen kortpassord. Ingen BankID-styr. Bare oversikt.
            </p>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="balance-card mx-auto max-w-sm rounded-3xl p-7">
              <p className="text-xs uppercase tracking-widest text-white/70">Månedlig saldo</p>
              <p className="tabular mt-2 font-display text-5xl font-semibold">+42 180 kr</p>
              <p className="mt-1 text-xs text-white/60">DNB Kronekort · •••• 4821</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[color:var(--income)]">Inn i dag</p>
                  <p className="tabular mt-1 text-sm font-semibold text-white">+12 450 kr</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[color:var(--spend)]">Ut i dag</p>
                  <p className="tabular mt-1 text-sm font-semibold text-white">−412 kr</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                NAV utbetaling oppdaget kl. 08:00
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-x-10 -bottom-10 -top-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/10 via-transparent to-[color:var(--bcard-c)]/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* About the project */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-accent/30 p-8 sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Hva er Kronekort-X?
          </span>
          <h2 className="mt-5 max-w-3xl font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            En enkel, vakker oversikt over DNB Kronekort — saldo, transaksjoner og forbruk samlet på ett sted.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Kronekort-X er laget for familier og enkeltpersoner som vil følge med på Kronekortet uten å logge
            inn i nettbanken hele tiden. Du legger til kortet ditt, ser saldoen oppdatert gjennom dagen,
            blar i alle transaksjoner med søk og perioder, og deler oversikten trygt med dem du stoler på.
            Hvert kort kan låses med en egen PIN-kode, og all data ligger trygt lagret i skyen.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat icon={<Receipt className="h-4 w-4" />} title="Alle transaksjoner" body="Søk, filtrer på dato og bla med paginering." />
            <MiniStat icon={<BarChart3 className="h-4 w-4" />} title="Forbruk over tid" body="Måned, 3 mnd, halvår og år — med kategorier." />
            <MiniStat icon={<Lock className="h-4 w-4" />} title="PIN-låst" body="Lås hvert kort med en kode lagret som sikker hash." />
            <MiniStat icon={<Users className="h-4 w-4" />} title="Delt i familien" body="Inviter andre med godkjenning fra eier." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">Slik fungerer det</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Tre steg fra konto til full oversikt.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Step n="1" icon={<PlusCircle className="h-5 w-5" />} title="Legg til kortet"
            body="Registrer DNB Kronekortet med navn, kortnummer og en valgfri PIN-kode for å låse visningen." />
          <Step n="2" icon={<RefreshCw className="h-5 w-5" />} title="Hold saldoen oppdatert"
            body="Saldoen oppdateres automatisk gjennom dagen, og du varsles når lønn eller NAV lander." />
          <Step n="3" icon={<BarChart3 className="h-5 w-5" />} title="Følg forbruket"
            body="Se transaksjoner, forbruk per periode og kategorier — og del oversikten med familien." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Tre ting som gjør hverdagen enklere
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Bygd for folk som vil ha kontroll uten å åpne nettbanken hver halvtime.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Feature
            icon={<RefreshCw className="h-5 w-5" />}
            title="Automatisk saldo, 6× om dagen"
            body="Kortet oppdateres kl. 08, 10, 12, 14, 16 og 20 — uten at du løfter en finger. Inaktive kort sjekkes én gang i døgnet."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="Del kortet trygt med familien"
            body="Inviter samboer, barn eller foreldre med brukernavn. Du godkjenner hver tilgang — og kan fjerne den når du vil."
          />
          <Feature
            icon={<Bell className="h-5 w-5" />}
            title="Lønn, NAV og store kjøp"
            body="Få push, e-post, SMS eller WhatsApp idet lønna lander eller saldoen synker under terskelen din."
          />
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
        <div className="rounded-3xl border border-border bg-card p-8">
          <ShieldCheck className="mx-auto h-8 w-8 text-[color:var(--income)]" />
          <h3 className="mt-4 font-display text-xl font-semibold">Trygghet først</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Vi lagrer aldri BankID eller kortpassord. All deling går gjennom godkjenning fra
            kortets eier, og data ligger trygt i Lovable Cloud.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Opprett konto
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-accent"
            >
              Les mer om prosjektet
            </Link>
          </div>
        </div>
      </section>

      {/* Demo video */}
      <DemoVideoSection />

      {/* Live map preview */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" /> Live
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Aktive akkurat nå</h2>
          </div>
          <Link to="/analytics" className="hidden text-sm text-primary hover:underline sm:inline">Åpne full visning →</Link>
        </div>
        <div className="mt-6"><LiveWorldMap /></div>
      </section>

      {/* Share */}
      <section className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-2 pb-3">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">Les bloggen →</Link>
        </div>
        <ShareBar />
      </section>


      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Kronekort-X · Bygget med ❤ i Norge ·{" "}
        <Link to="/about" className="underline hover:text-foreground">
          Støtt utviklerne
        </Link>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-accent/40">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function MiniStat({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="relative rounded-3xl border border-border bg-card p-6">
      <span className="absolute right-5 top-5 font-display text-4xl font-bold text-primary/10">{n}</span>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

