import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Bell, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  type Card as CardT,
  type Tx,
  formatNOK,
  loadCards,
  loadSettings,
  loadTx,
  saveCards,
  saveTx,
  tick,
  totals,
} from "@/lib/kronekort";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saldo — Kronekort" },
      { name: "description", content: "Sanntids saldo, dagens forbruk og lønnsvarsler." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [cards, setCards] = useState<CardT[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setCards(loadCards());
    setTx(loadTx());
  }, []);

  // Background polling — mirrors POLL_INTERVAL_SECONDS from the Python app.
  useEffect(() => {
    const s = loadSettings();
    if (!s.mockMode) return;
    const id = setInterval(() => {
      setCards((prevC) => {
        let nextC = prevC;
        setTx((prevT) => {
          const r = tick(prevC, prevT);
          nextC = r.cards;
          if (r.newTx && s.notifications) {
            const sign = r.newTx.amount > 0 ? "+" : "";
            toast(`${r.newTx.merchant}`, {
              description: `${sign}${formatNOK(r.newTx.amount)} · ${r.newTx.category}`,
            });
          }
          if (r.newTx) {
            saveTx(r.tx);
            saveCards(r.cards);
          }
          return r.tx;
        });
        return nextC;
      });
    }, Math.max(5, s.pollSeconds) * 1000);
    return () => clearInterval(id);
  }, []);

  const total = cards.reduce((s, c) => s + c.balance, 0);
  const { mIn, mOut, dIn, dOut } = useMemo(() => totals(tx), [tx]);
  const recent = tx.slice(0, 6);
  const lastSalary = tx.find((t) => t.isSalary);

  function syncNow() {
    setSyncing(true);
    setTimeout(() => {
      const r = tick(cards, tx);
      setCards(r.cards);
      setTx(r.tx);
      saveCards(r.cards);
      saveTx(r.tx);
      setSyncing(false);
      toast.success("Synk fullført", {
        description: r.newTx ? `Ny transaksjon: ${r.newTx.merchant}` : "Ingen nye transaksjoner",
      });
    }, 600);
  }

  return (
    <AppShell
      title="God dag 👋"
      subtitle="Her er dine kort akkurat nå"
      right={
        <button
          onClick={syncNow}
          aria-label="Synk nå"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <Toaster position="top-center" />

      <section className="balance-card mt-2 overflow-hidden rounded-3xl p-6">
        <p className="text-xs uppercase tracking-widest text-white/70">Total saldo</p>
        <p className="tabular mt-2 font-display text-4xl font-semibold">{formatNOK(total)}</p>
        <p className="mt-1 text-xs text-white/60">{cards.length} kort · oppdatert nå</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <MiniStat icon={<ArrowDownRight className="h-3.5 w-3.5" />} label="Inn i dag" value={formatNOK(dIn)} tone="income" />
          <MiniStat icon={<ArrowUpRight className="h-3.5 w-3.5" />} label="Ut i dag" value={formatNOK(dOut)} tone="spend" />
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label="Inn denne måneden" value={formatNOK(mIn)} accent="income" />
        <StatTile label="Ut denne måneden" value={formatNOK(mOut)} accent="spend" />
      </section>

      {lastSalary && (
        <section className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--salary)]/15 text-[color:var(--salary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Lønn / NAV oppdaget</p>
            <p className="truncate text-xs text-muted-foreground">{lastSalary.merchant}</p>
          </div>
          <p className="tabular text-sm font-semibold text-[color:var(--income)]">
            +{formatNOK(lastSalary.amount)}
          </p>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Siste aktivitet</h2>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
        <ul className="space-y-2">
          {recent.map((t) => (
            <TxRow key={t.id} tx={t} card={cards.find((c) => c.id === t.cardId)} />
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
