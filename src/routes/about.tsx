import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Coffee, Heart, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";

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
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("backWord")}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("aboutTitle")}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          {t("aboutIntro")}
        </p>

        <section className="mt-12 space-y-4 text-muted-foreground">
          <h2 className="font-display text-2xl font-semibold text-foreground">{t("aboutWhyH")}</h2>
          <p>{t("aboutWhyP")}</p>
          <h2 className="font-display text-2xl font-semibold text-foreground">{t("aboutHowH")}</h2>
          <p>{t("aboutHowP")}</p>
          <h2 className="font-display text-2xl font-semibold text-foreground">{t("aboutWhoH")}</h2>
          <p>{t("aboutWhoP")}</p>
        </section>

        {/* Donate */}
        <section className="mt-12 rounded-3xl border border-border bg-card p-8 text-center">
          <Heart className="mx-auto h-8 w-8 text-[color:var(--spend)]" />
          <h2 className="mt-4 font-display text-2xl font-semibold">{t("donateTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("donateBody")}
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
            {t("donateNote")}
          </p>
        </section>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          {t("aboutFooter")}
        </p>
      </main>
    </div>
  );
}
