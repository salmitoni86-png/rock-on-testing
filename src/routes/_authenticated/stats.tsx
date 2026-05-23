import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "Statistikk — Kronekort-X" }] }),
  component: StatsPage,
});

type Balance = { card_id: string; balance: number; polled_at: string };

function StatsPage() {
  const { t, fmt } = useLang();
  const [balances, setBalances] = useState<Balance[]>([]);

  useEffect(() => {
    supabase.from("card_balances").select("card_id,balance,polled_at")
      .order("polled_at", { ascending: false }).limit(60)
      .then(({ data }) => setBalances((data as Balance[]) ?? []));
  }, []);

  const total = useMemo(() => {
    const latest = new Map<string, number>();
    for (const b of balances) if (!latest.has(b.card_id)) latest.set(b.card_id, Number(b.balance));
    return Array.from(latest.values()).reduce((s, n) => s + n, 0);
  }, [balances]);

  return (
    <AppShell title={t("stats")} subtitle={t("last14")}>
      <section className="balance-card mt-2 rounded-3xl p-6">
        <p className="text-xs uppercase tracking-widest text-white/70">{t("totalBalance")}</p>
        <p className="tabular mt-2 font-display text-3xl font-semibold">{fmt.money(total)}</p>
        <p className="mt-2 text-xs text-white/60">{balances.length} datapunkter</p>
      </section>
      <section className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Saldo-historikk</p>
        <ul className="mt-3 space-y-1 text-sm">
          {balances.slice(0, 20).map((b, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-muted-foreground">{fmt.date(b.polled_at)}</span>
              <span className="tabular font-medium">{fmt.money(Number(b.balance))}</span>
            </li>
          ))}
          {balances.length === 0 && (
            <li className="text-sm text-muted-foreground">Ingen saldo-data enda.</li>
          )}
        </ul>
      </section>
    </AppShell>
  );
}
