import { createFileRoute, Link } from "@tanstack/react-router";
import { LivingBackground } from "@/components/LivingBackground";
import { LiveWorldMap } from "@/components/LiveWorldMap";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Live aktivitet — Kronekort-X" },
      { name: "description", content: "Se hvor Kronekort-X brukes akkurat nå — live globalt kart." },
      { property: "og:title", content: "Live aktivitet — Kronekort-X" },
      { property: "og:description", content: "Se hvor Kronekort-X brukes akkurat nå — live globalt kart." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useLang();
  return (
    <div className="relative min-h-screen bg-background">
      <LivingBackground density={8} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link to="/" className="font-display text-lg font-semibold">Kronekort-X</Link>
        <nav className="text-sm">
          <Link to="/blog" className="px-3 py-2 text-muted-foreground hover:text-foreground">{t("navBlogg")}</Link>
          <Link to="/about" className="px-3 py-2 text-muted-foreground hover:text-foreground">{t("navOm")}</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t("liveTitle")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t("liveSub")}
        </p>
        <div className="mt-8">
          <LiveWorldMap />
        </div>
      </main>
    </div>
  );
}
