import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { loadSettings, resetAll, saveSettings, type Settings } from "@/lib/kronekort";
import { LANGS, useLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Innstillinger — DNB Kronekort" },
      { name: "description", content: "Språk, varsler og demo-modus." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => setS(loadSettings()), []);

  function update(patch: Partial<Settings>) {
    if (!s) return;
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  }

  if (!s) return <AppShell title={t("settings")}><div /></AppShell>;

  return (
    <AppShell title={t("settings")} subtitle={t("demoActive")}>
      <Toaster position="top-center" />
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">{t("language")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("languageHint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  lang === l.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary hover:bg-accent"
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span className="truncate">{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Row label={t("notifications")} hint={t("notifHint")}>
          <Toggle checked={s.notifications} onChange={(v) => update({ notifications: v })} />
        </Row>

        <Row label={t("demoMode")} hint={t("demoHint")}>
          <Toggle checked={s.mockMode} onChange={(v) => update({ mockMode: v })} />
        </Row>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">{t("pollCap")}</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("bankConn")}
        </h2>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium">DNB Kronekort</p>
            <p className="text-xs text-muted-foreground">developer.dnb.no/psd2/v1</p>
          </div>
          <span className="rounded-full bg-[color:var(--salary)]/15 px-3 py-1 text-[11px] font-medium text-[color:var(--salary)]">
            {t("demoBadge")}
          </span>
        </div>
      </div>

      <button
        onClick={() => {
          resetAll();
          toast.success(t("resetDone"), { description: t("resetHint") });
          setTimeout(() => window.location.reload(), 600);
        }}
        className="mt-8 w-full rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/15"
      >
        {t("reset")}
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        DNB Kronekort Saldo · v1.1 · demo
      </p>
    </AppShell>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="ml-3 shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
