import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { loadSettings, resetAll, saveSettings, type Settings } from "@/lib/kronekort";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Innstillinger — Kronekort" },
      { name: "description", content: "Polling, varsler og demo-modus." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => setS(loadSettings()), []);

  function update(patch: Partial<Settings>) {
    if (!s) return;
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  }

  if (!s) return <AppShell title="Innstillinger"><div /></AppShell>;

  return (
    <AppShell title="Innstillinger" subtitle="Demo-modus aktivert">
      <Toaster position="top-center" />
      <div className="space-y-4">
        <Row label="Varsler" hint="Push når penger kommer eller går">
          <Toggle checked={s.notifications} onChange={(v) => update({ notifications: v })} />
        </Row>

        <Row label="Demo-modus" hint="Genererer mock-transaksjoner i bakgrunnen">
          <Toggle checked={s.mockMode} onChange={(v) => update({ mockMode: v })} />
        </Row>

        <Row label="Polling-intervall" hint={`Hvert ${s.pollSeconds}. sekund`}>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={s.pollSeconds}
            onChange={(e) => update({ pollSeconds: Number(e.target.value) })}
            className="w-32 accent-[color:var(--primary)]"
          />
        </Row>

        <Row label="Daglig sammendrag" hint={`Sendes kl. ${String(s.dailyDigestHour).padStart(2, "0")}:00`}>
          <input
            type="number"
            min={0}
            max={23}
            value={s.dailyDigestHour}
            onChange={(e) => update({ dailyDigestHour: Number(e.target.value) })}
            className="tabular w-16 rounded-lg border border-border bg-secondary px-2 py-1 text-right text-sm"
          />
        </Row>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Bankforbindelser
        </h2>
        <ul className="space-y-2">
          {[
            { p: "DNB", url: "developer.dnb.no/psd2/v1" },
            { p: "Nordea", url: "api.nordeaopenbanking.com" },
            { p: "Sbanken", url: "publicapi.sbanken.no" },
          ].map((b) => (
            <li key={b.p} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium">{b.p}</p>
                <p className="text-xs text-muted-foreground">{b.url}</p>
              </div>
              <span className="rounded-full bg-[color:var(--salary)]/15 px-3 py-1 text-[11px] font-medium text-[color:var(--salary)]">
                Demo
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => {
          resetAll();
          toast.success("Tilbakestilt", { description: "Last siden på nytt for å se mock-data." });
          setTimeout(() => window.location.reload(), 600);
        }}
        className="mt-8 w-full rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/15"
      >
        Tilbakestill demo-data
      </button>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Kronekort Saldo · v1.0 · demo
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
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
