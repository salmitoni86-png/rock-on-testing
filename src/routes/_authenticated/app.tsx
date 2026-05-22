import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Bell, LogOut, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  type Card as CardT, type Tx,
  loadCards, loadTx, totals,
} from "@/lib/kronekort";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Saldo — Kronekort-X" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, fmt } = useLang();
  const [cards, setCards] = useState<CardT[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);

  useEffect(() => {
    setCards(loadCards());
    setTx(loadTx());
  }, []);

  const total = cards.reduce((s, c) => s + c.balance, 0);
  const { mIn, mOut, dIn, dOut, monthlyNet } = useMemo(() => totals(tx), [tx]);
  const recent = tx.slice(0, 6);
  const lastSalary = tx.find((x) => x.isSalary);

  return (
    <AppShell
      title={t("greeting") + " 👋"}
      subtitle={t("subHome")}
      right={
        <button
          onClick={() => supabase.auth.signOut()}
          aria-label="Logg ut"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
        </button>
      }
    >
      <section className="balance-card mt-2 overflow-hidden rounded-3xl p-6">
        <p className="text-xs uppercase tracking-widest text-white/70">{t("monthlySaldo")}</p>
        <p className="tabular mt-2 font-display text-4xl font-semibold">
          {monthlyNet >= 0 ? "+" : ""}{fmt.money(monthlyNet)}
        </p>
        <p className="mt-1 text-xs text-white/60">{t("totalBalance")}: {fmt.money(total)}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Mini icon={<ArrowDownRight className="h-3.5 w-3.5" />} label={t("inToday")} value={fmt.money(dIn)} tone="income" />
          <Mini icon={<ArrowUpRight className="h-3.5 w-3.5" />} label={t("outToday")} value={fmt.money(dOut)} tone="spend" />
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Tile label={t("inMonth")} value={fmt.money(mIn)} accent="income" />
        <Tile label={t("outMonth")} value={fmt.money(mOut)} accent="spend" />
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
          <p className="tabular text-sm font-semibold text-[color:var(--income)]">+{fmt.money(lastSalary.amount)}</p>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("recent")}</h2>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
        <ul className="space-y-2">
          {recent.map((x) => (
            <Row key={x.id} tx={x} card={cards.find((c) => c.id === x.cardId)} />
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function Mini({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "income" | "spend" }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider ${tone === "income" ? "text-[color:var(--income)]" : "text-[color:var(--spend)]"}`}>
        {icon}<span>{label}</span>
      </div>
      <p className="tabular mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
function Tile({ label, value, accent }: { label: string; value: string; accent: "income" | "spend" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular mt-1 font-display text-xl font-semibold ${accent === "income" ? "text-[color:var(--income)]" : "text-[color:var(--spend)]"}`}>{value}</p>
    </div>
  );
}
function Row({ tx, card }: { tx: Tx; card?: CardT }) {
  const { fmt } = useLang();
  const income = tx.amount > 0;
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-semibold ${income ? "bg-[color:var(--income)]/15 text-[color:var(--income)]" : "bg-[color:var(--spend)]/12 text-[color:var(--spend)]"}`}>
        {tx.merchant.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.merchant}</p>
        <p className="truncate text-xs text-muted-foreground">{tx.category} · {card?.name ?? "—"} · {fmt.date(tx.date)}</p>
      </div>
      <p className={`tabular text-sm font-semibold ${income ? "text-[color:var(--income)]" : ""}`}>
        {income ? "+" : ""}{fmt.money(tx.amount)}
      </p>
    </li>
  );
}
