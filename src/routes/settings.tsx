import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Mail, MessageCircle, Phone, Smartphone, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import {
  loadSettings,
  resetAll,
  saveSettings,
  type Accent,
  type NotifChannels,
  type NotifEvents,
  type Settings,
  type ThemeMode,
} from "@/lib/kronekort";
import { LANGS, useLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Innstillinger — DNB Kronekort" },
      { name: "description", content: "Språk, tema, varsler og demo-modus." },
    ],
  }),
  component: SettingsPage,
});

const ACCENTS: { id: Accent; swatch: string; labelKey: string }[] = [
  { id: "navy", swatch: "linear-gradient(135deg,#1e1e5a,#0f3460)", labelKey: "accentNavy" },
  { id: "emerald", swatch: "linear-gradient(135deg,#0d7a5f,#1b4332)", labelKey: "accentEmerald" },
  { id: "coral", swatch: "linear-gradient(135deg,#e85d3a,#9b4423)", labelKey: "accentCoral" },
  { id: "violet", swatch: "linear-gradient(135deg,#7c3aed,#4c1d95)", labelKey: "accentViolet" },
];

const THEMES: { id: ThemeMode; labelKey: string; Icon: typeof Sun }[] = [
  { id: "light", labelKey: "themeLight", Icon: Sun },
  { id: "dark", labelKey: "themeDark", Icon: Moon },
  { id: "system", labelKey: "themeSystem", Icon: Monitor },
];

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
  function updateChannel(k: keyof NotifChannels, v: boolean) {
    if (!s) return;
    update({ channels: { ...s.channels, [k]: v } });
  }
  function updateEvent(k: keyof NotifEvents, v: boolean) {
    if (!s) return;
    update({ events: { ...s.events, [k]: v } });
  }

  if (!s) return <AppShell title={t("settings")}><div /></AppShell>;

  const channels: { k: keyof NotifChannels; label: string; Icon: typeof Bell }[] = [
    { k: "push", label: t("chPush"), Icon: Bell },
    { k: "firebase", label: t("chFirebase"), Icon: Smartphone },
    { k: "email", label: t("chEmail"), Icon: Mail },
    { k: "sms", label: t("chSms"), Icon: Phone },
    { k: "whatsapp", label: t("chWhatsapp"), Icon: MessageCircle },
  ];
  const events: { k: keyof NotifEvents; label: string }[] = [
    { k: "salary", label: t("evSalary") },
    { k: "largeSpend", label: t("evLargeSpend") },
    { k: "lowBalance", label: t("evLowBalance") },
    { k: "dailySummary", label: t("evDailySummary") },
    { k: "pollDone", label: t("evPollDone") },
  ];

  return (
    <AppShell title={t("settings")} subtitle={t("demoActive")}>
      <Toaster position="top-center" />

      <div className="space-y-4">
        {/* Language */}
        <Card>
          <p className="text-sm font-medium">{t("language")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("languageHint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  lang === l.code ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary hover:bg-accent"
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span className="truncate">{l.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Theme */}
        <Card>
          <p className="text-sm font-medium">{t("theme")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("themeHint")}</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ id, labelKey, Icon }) => (
              <button
                key={id}
                onClick={() => update({ theme: id })}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition-colors ${
                  s.theme === id ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Accent */}
        <Card>
          <p className="text-sm font-medium">{t("accent")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("accentHint")}</p>
          <div className="grid grid-cols-4 gap-2">
            {ACCENTS.map(({ id, swatch, labelKey }) => (
              <button
                key={id}
                onClick={() => update({ accent: id })}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] transition ${
                  s.accent === id ? "border-primary ring-2 ring-primary/40" : "border-border"
                }`}
              >
                <span className="h-10 w-full rounded-lg" style={{ background: swatch }} />
                <span className="truncate">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Master notifications */}
        <Row label={t("notifications")} hint={t("notifHint")}>
          <Toggle checked={s.notifications} onChange={(v) => update({ notifications: v })} />
        </Row>

        {/* Channels */}
        <Card>
          <p className="text-sm font-medium">{t("channels")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("channelsHint")}</p>
          <ul className="space-y-2">
            {channels.map(({ k, label, Icon }) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
                <Toggle checked={s.channels[k]} onChange={(v) => updateChannel(k, v)} disabled={!s.notifications} />
              </li>
            ))}
          </ul>
        </Card>

        {/* Events */}
        <Card>
          <p className="text-sm font-medium">{t("events")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("eventsHint")}</p>
          <ul className="space-y-2">
            {events.map(({ k, label }) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2">
                <span className="text-sm">{label}</span>
                <Toggle checked={s.events[k]} onChange={(v) => updateEvent(k, v)} disabled={!s.notifications} />
              </li>
            ))}
          </ul>
        </Card>

        {/* Contact */}
        <Card>
          <p className="text-sm font-medium">{t("contact")}</p>
          <p className="mb-3 text-xs text-muted-foreground">{t("contactHint")}</p>
          <div className="space-y-2">
            <input
              type="email"
              value={s.contactEmail}
              onChange={(e) => update({ contactEmail: e.target.value })}
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="tel"
              value={s.contactPhone}
              onChange={(e) => update({ contactPhone: e.target.value })}
              placeholder={t("phonePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </Card>

        <Row label={t("demoMode")} hint={t("demoHint")}>
          <Toggle checked={s.mockMode} onChange={(v) => update({ mockMode: v })} />
        </Row>

        <Card>
          <p className="text-sm font-medium">{t("pollCap")}</p>
        </Card>
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
        DNB Kronekort Saldo · v1.2 · demo
      </p>
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4">{children}</div>;
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

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-40 ${checked ? "bg-primary" : "bg-secondary"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
