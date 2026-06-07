import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Phone, Mail, Send as SendIcon, MessageCircle, Ghost, Hash, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { DiscordModal, DISCORD_INVITE } from "@/components/DiscordModal";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { loadSettings, saveSettings, type Settings } from "@/lib/kronekort";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Innstillinger — Kronekort-X" }] }),
  component: SettingsPage,
});

type ProfileExt = {
  username: string | null;
  phone: string | null;
  contact_email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  snapchat: string | null;
  discord: string | null;
};

function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const [s, setS] = useState<Settings>(() => loadSettings());
  const [profile, setProfile] = useState<ProfileExt>({
    username: null, phone: null, contact_email: null,
    telegram: null, whatsapp: null, snapchat: null, discord: null,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [discordOpen, setDiscordOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username,phone,contact_email,telegram,whatsapp,snapchat,discord")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as ProfileExt); });
  }, [user]);

  function update(patch: Partial<Settings>) {
    const next = { ...s, ...patch };
    setS(next); saveSettings(next);
  }

  function patchProfile<K extends keyof ProfileExt>(k: K, v: ProfileExt[K]) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      phone: profile.phone || null,
      contact_email: profile.contact_email || null,
      telegram: profile.telegram || null,
      whatsapp: profile.whatsapp || null,
      snapchat: profile.snapchat || null,
      discord: profile.discord || null,
    }).eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message); else toast.success(t("setProfileSaved"));
  }

  return (
    <AppShell title={t("settings")} subtitle={profile.username ? `@${profile.username}` : user?.email ?? ""}>
      <Toaster position="top-center" />
      <DiscordModal open={discordOpen} onClose={() => setDiscordOpen(false)} />

      {/* Language */}
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
        <p className="mt-3 rounded-lg border border-dashed border-border bg-background/60 p-3 text-[11px] text-muted-foreground">
          💎 <span className="font-medium text-foreground">DeepL Pro</span> kan kobles til for proff oversettelse av blogginnlegg og support-chat. Be admin om å legge til <code className="font-mono">DEEPL_API_KEY</code>.
        </p>
      </section>

      {/* Contact info */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Kontaktinfo</p>
        <p className="mt-1 text-xs text-muted-foreground">Brukes for varsler og kontoadministrasjon</p>
        <div className="mt-3 space-y-2">
          <Field icon={<Phone className="h-4 w-4" />} placeholder="+47 …" value={profile.phone ?? ""} onChange={(v) => patchProfile("phone", v)} label="Telefon" />
          <Field icon={<Mail className="h-4 w-4" />} placeholder="navn@eksempel.no" value={profile.contact_email ?? ""} onChange={(v) => patchProfile("contact_email", v)} label="E-post for varsler" type="email" />
        </div>
      </section>

      {/* Social handles */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Sosiale håndtak</p>
        <p className="mt-1 text-xs text-muted-foreground">Få varsler levert dit du foretrekker</p>
        <div className="mt-3 space-y-2">
          <Field icon={<SendIcon className="h-4 w-4 text-[#229ED9]" />} placeholder="@brukernavn" value={profile.telegram ?? ""} onChange={(v) => patchProfile("telegram", v)} label="Telegram" />
          <Field icon={<MessageCircle className="h-4 w-4 text-[#25D366]" />} placeholder="+47 …" value={profile.whatsapp ?? ""} onChange={(v) => patchProfile("whatsapp", v)} label="WhatsApp" />
          <Field icon={<Ghost className="h-4 w-4 text-[#FFFC00]" />} placeholder="snap-bruker" value={profile.snapchat ?? ""} onChange={(v) => patchProfile("snapchat", v)} label="Snapchat" />
          <Field icon={<Hash className="h-4 w-4 text-[#5865F2]" />} placeholder="bruker#0000" value={profile.discord ?? ""} onChange={(v) => patchProfile("discord", v)} label="Discord" />
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {savingProfile ? "Lagrer…" : "Lagre profil"}
        </button>
      </section>

      {/* Discord server CTA */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#5865F2]/15 via-card to-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Bli med på Discord-serveren</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Live-varsler, SoS-kanal, beta-tester og direkte kontakt med teamet. 2 481 medlemmer.
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">{DISCORD_INVITE}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30">
            <Hash className="h-5 w-5" />
          </span>
        </div>
        <button
          onClick={() => setDiscordOpen(true)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Se serverinfo og bli med
        </button>
      </section>

      {/* Notification channels */}
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

function Field({
  icon, label, value, onChange, placeholder, type = "text",
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </label>
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
