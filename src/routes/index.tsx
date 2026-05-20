import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Bell, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  type Card as CardT,
  type Tx,
  formatNOK,
  loadCards,
  loadSettings,
  loadTx,
  nextPollIn,
  pollsRemaining,
  recordPoll,
  saveCards,
  saveSettings,
  saveTx,
  totals,
} from "@/lib/kronekort";
import { useLang } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saldo — DNB Kronekort" },
      { name: "description", content: "Saldo og månedsoversikt for DNB Kronekort." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useLang();
  const [cards, setCards] = useState<CardT[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [remaining, setRemaining] = useState(6);
  const [nextIn, setNextIn] = useState<{ h: number; m: number } | null>(null);

  useEffect(() => {
    setCards(loadCards());
    setTx(loadTx());
    const s = loadSettings();
    setRemaining(pollsRemaining(s));
    setNextIn(nextPollIn(s));
  }, []);

  const total = cards.reduce((s, c) => s + c.balance, 0);
  const { mIn, mOut, dIn, dOut, monthlyNet } = useMemo(() => totals(tx), [tx]);
  const recent = tx.slice(0, 6);
  const lastSalary = tx.find((x) => x.isSalary);

  async function syncNow() {
    const s = loadSettings();
    if (pollsRemaining(s) <= 0) {
      const n = nextPollIn(s);
      toast.error(t("pollLimit", { h: n?.h ?? 0, m: n?.m ?? 0 }));
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/poll-saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: cards[0]?.id ?? "dnb-1" }),
      });
      const data = await res.json();
      const updatedCards = cards.map((c, i) =>
        i === 0 ? { ...c, balance: Math.max(0, c.balance + (data.delta ?? 0)) } : c,
      );
      setCards(updatedCards);
      saveCards(updatedCards);
      const next = recordPoll(s);
      saveSettings(next);
      setRemaining(pollsRemaining(next));
      setNextIn(nextPollIn(next));
      toast.success(t("pollDone", { p: data.proxy ?? "—" }));
    } catch {
      toast.error(t("pollFail"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppShell
      title={t("greeting") + " 👋"}
      subtitle={t("subHome")}
      right={
        <button
          onClick={syncNow}
          aria-label={t("syncNow")}
          disabled={syncing || remaining <= 0}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <Toaster position="top-center" />

      <section className="balance-card mt-2 overflow-hidden rounded-3xl p-6">
        <p className="text-xs uppercase tracking-widest text-white/70">{t("monthlySaldo")}</p>
        <p className="tabular mt-2 font-display text-4xl font-semibold">
          {monthlyNet >= 0 ? "+" : ""}{formatNOK(monthlyNet)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {t("totalBalance")}: {formatNOK(total)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <MiniStat icon={<ArrowDownRight className="h-3.5 w-3.5" />} label={t("inToday")} value={formatNOK(dIn)} tone="income" />
          <MiniStat icon={<ArrowUpRight className="h-3.5 w-3.5" />} label={t("outToday")} value={formatNOK(dOut)} tone="spend" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/80">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>
            {nextIn ? t("pollLimit", { h: nextIn.h, m: nextIn.m }) : t("pollsLeft", { n: remaining })}
          </span>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label={t("inMonth")} value={formatNOK(mIn)} accent="income" />
        <StatTile label={t("outMonth")} value={formatNOK(mOut)} accent="spend" />
      </section>

      {lastSalary && (
        <section className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--salary)]/15 text-[color:var(--salary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t("salaryDetected")}</p>
            <p className="truncate text-xs text-muted-foreground">{lastSalary.merchant}</p>
          </div>
          <p className="tabular text-sm font-semibold text-[color:var(--income)]">
            +{formatNOK(lastSalary.amount)}
          </p>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("recent")}</h2>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
        <ul className="space-y-2">
          {recent.map((x) => (
            <TxRow key={x.id} tx={x} card={cards.find((c) => c.id === x.cardId)} />
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "income" | "spend" }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${tone === "income" ? "text-[color:var(--income)]" : "text-[color:var(--spend)]"}`}>
        {icon}
        <span>{label}</span>
      </div>
      <p className="tabular mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "income" | "spend" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular mt-1 font-display text-xl font-semibold ${accent === "income" ? "text-[color:var(--income)]" : "text-[color:var(--spend)]"}`}>
        {value}
      </p>
    </div>
  );
}

function TxRow({ tx, card }: { tx: Tx; card?: CardT }) {
  const income = tx.amount > 0;
  const d = new Date(tx.date);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-semibold ${income ? "bg-[color:var(--income)]/15 text-[color:var(--income)]" : "bg-[color:var(--spend)]/12 text-[color:var(--spend)]"}`}>
        {tx.merchant.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.merchant}</p>
        <p className="truncate text-xs text-muted-foreground">
          {tx.category} · {card?.name ?? "—"} · {d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
        </p>
      </div>
      <p className={`tabular text-sm font-semibold ${income ? "text-[color:var(--income)]" : ""}`}>
        {income ? "+" : ""}
        {formatNOK(tx.amount)}
      </p>
    </li>
  );
}
