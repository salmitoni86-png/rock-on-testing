import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Copy, Check, Trophy, Mail } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { ShareBar } from "@/components/ShareBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/invites")({
  head: () => ({ meta: [{ title: "Inviter — Kronekort-X" }] }),
  component: InvitesPage,
});

type Invite = { id: string; code: string; email: string | null; status: string; accepted_at: string | null; created_at: string; manual: boolean; note: string | null };
type Tier = { id: number; threshold: number; title: string; perk: string };

function InvitesPage() {
  const { user } = useAuth();
  const { t, fmt } = useLang();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [manual, setManual] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("invitations")
      .select("id,code,email,status,accepted_at,created_at,manual,note")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false });
    setInvites((data ?? []) as Invite[]);
  }
  useEffect(() => {
    load();
    supabase.from("referral_tiers").select("*").order("threshold").then(({ data }) => setTiers((data ?? []) as Tier[]));
  }, [user]);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("invitations").insert({
      inviter_id: user.id,
      email: email.trim() || null,
      note: note.trim() || null,
      manual,
    });
    if (error) toast.error(error.message); else { toast.success(t("inviteCreated")); setEmail(""); setNote(""); setManual(false); load(); }
  }

  function inviteUrl(code: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "https://kronekort-x.lovable.app";
    return `${base}/signup?ref=${code}`;
  }

  async function copyInvite(code: string) {
    await navigator.clipboard.writeText(inviteUrl(code));
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!user) return null;

  const accepted = invites.filter((i) => i.status === "accepted");
  const pending = invites.filter((i) => i.status === "pending");
  const old = invites.filter((i) => i.status === "expired" || i.status === "revoked");
  const count = accepted.length;
  const nextTier = tiers.find((t) => t.threshold > count);
  const currentTier = [...tiers].reverse().find((t) => t.threshold <= count);
  const progress = nextTier ? Math.min(100, ((count - (currentTier?.threshold ?? 0)) / (nextTier.threshold - (currentTier?.threshold ?? 0))) * 100) : 100;

  return (
    <AppShell title={t("invitesTitle")} subtitle={t("invitesSub", { a: count, s: invites.length })}>
      <Toaster position="top-center" />

      {/* Rewards stepper */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-[color:var(--bcard-c)]/10 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[color:var(--bcard-c)]" />
          <p className="text-sm font-medium">
            {currentTier ? t("levelYouAre", { title: currentTier.title }) : t("unlockFirst")}
          </p>
        </div>
        {nextTier && (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("toNext", { n: nextTier.threshold - count, title: nextTier.title, perk: nextTier.perk })}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--bcard-c)] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
        <ol className="mt-5 grid gap-2 sm:grid-cols-5">
          {tiers.map((tier) => {
            const unlocked = count >= tier.threshold;
            return (
              <li key={tier.id} className={`relative rounded-xl border p-3 text-xs ${unlocked ? "border-[color:var(--income)]/50 bg-[color:var(--income)]/10" : "border-border bg-card/60"}`}>
                <p className="font-semibold">{tier.title}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{tier.threshold} {t("friendsWord")}</p>
                <p className="mt-1 text-muted-foreground">{tier.perk}</p>
                {unlocked && <Check className="absolute right-2 top-2 h-3 w-3 text-[color:var(--income)]" />}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">{t("newInvite")}</p>
        <form onSubmit={createInvite} className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailOptPh")} type="email" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("noteOptPh")} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
            {t("manualInvite")}
          </label>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
            <Plus className="h-4 w-4" /> {t("createInvite")}
          </button>
        </form>
      </section>

      <div className="mt-4">
        <ShareBar title={t("shareInviteTitle")} />
      </div>

      <InviteList title={t("pendingTitle", { n: pending.length })} items={pending} onCopy={copyInvite} copied={copied} inviteUrl={inviteUrl} t={t} fmt={fmt} />
      <InviteList title={t("acceptedTitle", { n: accepted.length })} items={accepted} onCopy={copyInvite} copied={copied} inviteUrl={inviteUrl} t={t} fmt={fmt} />
      {old.length > 0 && <InviteList title={t("oldTitle", { n: old.length })} items={old} onCopy={copyInvite} copied={copied} inviteUrl={inviteUrl} t={t} fmt={fmt} />}
    </AppShell>
  );
}

function InviteList({ title, items, onCopy, copied, inviteUrl, t, fmt }: { title: string; items: Invite[]; onCopy: (c: string) => void; copied: string | null; inviteUrl: (c: string) => string; t: (k: string, v?: Record<string, string | number>) => string; fmt: { date: (d: Date | string | number, o?: Intl.DateTimeFormatOptions) => string } }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-mono">{inviteUrl(i.code)}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {i.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {i.email}</span>}
                  {i.manual && <span className="rounded-full bg-muted px-1.5">{t("manualTag")}</span>}
                  <span>{fmt.date(i.created_at, { day: "numeric", month: "short", year: "numeric" })}</span>
                  {i.accepted_at && <span className="text-[color:var(--income)]">{t("acceptedTag")}</span>}
                </p>
                {i.note && <p className="mt-0.5 text-[11px] text-muted-foreground">{i.note}</p>}
              </div>
              <button onClick={() => onCopy(i.code)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card hover:bg-accent">
                {copied === i.code ? <Check className="h-4 w-4 text-[color:var(--income)]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
