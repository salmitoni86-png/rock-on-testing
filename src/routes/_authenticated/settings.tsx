import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { loadSettings, saveSettings, type Settings } from "@/lib/kronekort";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Innstillinger — Kronekort-X" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const [s, setS] = useState<Settings>(() => loadSettings());
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? ""));
  }, [user]);

  function update(patch: Partial<Settings>) {
    const next = { ...s, ...patch };
    setS(next); saveSettings(next);
  }

  return (
    <AppShell title={t("settings")} subtitle={username ? `@${username}` : user?.email ?? ""}>
      <Toaster position="top-center" />

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">{t("language")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("languageHint")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {LANGS.map((l) => (
            <button key={l.code}
              onClick={() => setLang(l.code as Lang)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${lang === l.code ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
              <span>{l.flag}</span><span>{l.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">{t("notifications")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("notifHint")}</p>
        <Toggle label="Push" v={s.channels.push} on={(v) => update({ channels: { ...s.channels, push: v } })} />
        <Toggle label="E-post" v={s.channels.email} on={(v) => update({ channels: { ...s.channels, email: v } })} />
        <Toggle label="SMS" v={s.channels.sms} on={(v) => update({ channels: { ...s.channels, sms: v } })} />
        <Toggle label="WhatsApp" v={s.channels.whatsapp} on={(v) => update({ channels: { ...s.channels, whatsapp: v } })} />
        <Toggle label="Firebase" v={s.channels.firebase} on={(v) => update({ channels: { ...s.channels, firebase: v } })} />
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Hendelser</p>
        <Toggle label="Lønn / NAV" v={s.events.salary} on={(v) => update({ events: { ...s.events, salary: v } })} />
        <Toggle label="Store kjøp" v={s.events.largeSpend} on={(v) => update({ events: { ...s.events, largeSpend: v } })} />
        <Toggle label="Lav saldo" v={s.events.lowBalance} on={(v) => update({ events: { ...s.events, lowBalance: v } })} />
        <Toggle label="Daglig sammendrag" v={s.events.dailySummary} on={(v) => update({ events: { ...s.events, dailySummary: v } })} />
      </section>

      <button
        onClick={async () => { await supabase.auth.signOut(); toast.success("Logget ut"); }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
      >
        <LogOut className="h-4 w-4" /> Logg ut
      </button>
    </AppShell>
  );
}

function Toggle({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="mt-2 flex items-center justify-between text-sm">
      <span>{label}</span>
      <button
        onClick={() => on(!v)} type="button"
        className={`h-6 w-11 rounded-full transition-colors ${v ? "bg-primary" : "bg-muted"} relative`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${v ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
