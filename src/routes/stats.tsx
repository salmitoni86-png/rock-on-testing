import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { dailySeries, loadTx, totals, type Tx } from "@/lib/kronekort";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistikk — DNB Kronekort" },
      { name: "description", content: "Daglig forbruk og kategorianalyse." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { t, fmt } = useLang();
  const [tx, setTx] = useState<Tx[]>([]);
  useEffect(() => setTx(loadTx()), []);

  const series = useMemo(() => dailySeries(tx, 14), [tx]);
  const max = Math.max(1, ...series.map((s) => Math.max(s.spend, s.income)));
  const tot = totals(tx);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of tx) if (x.amount < 0) map.set(x.category, (map.get(x.category) ?? 0) + -x.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [tx]);
  const catMax = Math.max(1, ...byCategory.map(([, v]) => v));

  return (
    <AppShell title={t("stats")} subtitle={t("last14")}>
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("spendMonth")}</p>
            <p className="tabular mt-1 font-display text-2xl font-semibold text-[color:var(--spend)]">
              {fmt.money(tot.mOut)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t("income")}</p>
            <p className="tabular mt-1 font-display text-base font-semibold text-[color:var(--income)]">
              +{fmt.money(tot.mIn)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex h-40 items-end gap-1.5">
          {series.map((s) => (
            <div key={s.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end gap-0.5">
                <div className="flex-1 rounded-t-sm bg-[color:var(--spend)]/70" style={{ height: `${(s.spend / max) * 100}%` }} />
                <div className="flex-1 rounded-t-sm bg-[color:var(--income)]/70" style={{ height: `${(s.income / max) * 100}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{fmt.date(s.date, { day: "numeric" })}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-semibold">{t("categories")}</h2>
        <ul className="space-y-3 rounded-3xl border border-border bg-card p-4">
          {byCategory.map(([cat, val]) => (
            <li key={cat}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{cat}</span>
                <span className="tabular text-muted-foreground">{fmt.money(val)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[color:var(--spend)]/70 to-[color:var(--spend)]"
                  style={{ width: `${(val / catMax) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
