import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Printer, ArrowLeft, Lock, ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { listTransactions, periodSummary, type Transaction, type PeriodSummary } from "@/lib/transactions";
import { verifyCardPin } from "@/lib/card-pin.functions";

export const Route = createFileRoute("/_authenticated/cards/$id")({
  head: () => ({ meta: [{ title: "Transaksjoner — Kronekort-X" }] }),
  component: CardDetail,
});

type Card = { id: string; name: string; last4: string | null; last_balance: number | null; owner_name: string | null; pin_hash: string | null };

type PeriodKey = "month" | "3m" | "6m" | "year";
const PERIODS: { key: PeriodKey; labelKey: string; months: number }[] = [
  { key: "month", labelKey: "pMonth", months: 1 },
  { key: "3m", labelKey: "p3m", months: 3 },
  { key: "6m", labelKey: "p6m", months: 6 },
  { key: "year", labelKey: "pYear", months: 12 },
];

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function monthsAgo(n: number) { const d = new Date(); d.setMonth(d.getMonth() - n); return d; }

function CardDetail() {
  const { id } = Route.useParams();
  const { t, fmt } = useLang();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const verifyPinFn = useServerFn(verifyCardPin);

  const [card, setCard] = useState<Card | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);

  const [period, setPeriod] = useState<PeriodKey>("month");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(isMobile ? 10 : 20);
  const [from, setFrom] = useState(isoDay(monthsAgo(1)));
  const [to, setTo] = useState(isoDay(new Date()));
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<PeriodSummary | null>(null);

  useEffect(() => { setPageSize(isMobile ? 10 : 20); }, [isMobile]);

  useEffect(() => {
    supabase.from("cards").select("id,name,last4,last_balance,owner_name,pin_hash").eq("id", id).maybeSingle()
      .then(({ data }) => {
        const c = data as Card | null;
        setCard(c);
        if (c && !c.pin_hash) setUnlocked(true);
      });
  }, [id]);

  function applyPeriod(key: PeriodKey) {
    const def = PERIODS.find((p) => p.key === key)!;
    setPeriod(key);
    setPage(0);
    setFrom(isoDay(monthsAgo(def.months)));
    setTo(isoDay(new Date()));
  }

  const fromISO = useMemo(() => new Date(from + "T00:00:00").toISOString(), [from]);
  const toISO = useMemo(() => new Date(to + "T23:59:59").toISOString(), [to]);

  useEffect(() => {
    if (!unlocked) return;
    listTransactions({ cardId: id, page, pageSize, from: fromISO, to: toISO })
      .then((r) => { setRows(r.rows); setTotal(r.total); });
  }, [id, page, pageSize, fromISO, toISO, unlocked]);

  useEffect(() => {
    if (!unlocked) return;
    periodSummary({ cardId: id, from: fromISO, to: toISO }).then(setSummary).catch(() => setSummary(null));
  }, [id, fromISO, toISO, unlocked]);

  async function tryUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) return toast.error(t("tPinDigits"));
    setChecking(true);
    try {
      const res = await verifyPinFn({ data: { cardId: id, pin } });
      if (res.ok) { setUnlocked(true); setPin(""); }
      else toast.error(t("wrongPin"));
    } catch (err: any) { toast.error(err?.message ?? t("tFailed")); }
    finally { setChecking(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (card && card.pin_hash && !unlocked) {
    return (
      <AppShell title={card.name} subtitle={t("lockedWithPin")}>
        <Toaster position="top-center" />
        <div className="mt-8 mx-auto max-w-xs rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium">{t("enterPinToView")}</p>
          <form onSubmit={tryUnlock} className="mt-4 space-y-3">
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-primary"
            />
            <button disabled={checking} className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {checking ? t("checkingWord") : t("unlockWord")}
            </button>
          </form>
          <Link to="/cards" className="mt-4 inline-block text-xs text-muted-foreground hover:underline">{t("backToCards")}</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={card?.name ?? t("cardFallback")}
      subtitle={`${card?.owner_name ? card.owner_name + " · " : ""}•••• ${card?.last4 ?? "0000"} · ${total} ${t("txWord")}`}
      right={
        <Link to="/cards" className="grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-accent" aria-label={t("backWord")}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      {/* Period chips */}
      <div className="mt-2 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPeriod(p.key)}
            className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
              period === p.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {/* Usage summary */}
      <section className="mt-3 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("spendInPeriod")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[color:var(--income)]/10 p-3">
            <ArrowDownLeft className="mx-auto h-4 w-4 text-[color:var(--income)]" />
            <p className="tabular mt-1 text-sm font-semibold text-[color:var(--income)]">{fmt.money(summary?.income ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">{t("inWord")}</p>
          </div>
          <div className="rounded-xl bg-[color:var(--spend)]/10 p-3">
            <ArrowUpRight className="mx-auto h-4 w-4 text-[color:var(--spend)]" />
            <p className="tabular mt-1 text-sm font-semibold">{fmt.money(summary?.spend ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">{t("outWord")}</p>
          </div>
          <div className="rounded-xl bg-secondary/60 p-3">
            <p className="tabular mt-1 text-sm font-semibold">{fmt.money(summary?.net ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">{t("netWord")} · {summary?.count ?? 0} tx</p>
          </div>
        </div>
        {summary && summary.topCategories.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {summary.topCategories.map((c) => {
              const pct = summary.spend > 0 ? Math.round((c.total / summary.spend) * 100) : 0;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{c.category}</span>
                    <span className="tabular font-medium">{fmt.money(c.total)} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Manual range + page size + print */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("fromWord")}</span>
          <input type="date" value={from} onChange={(e) => { setPage(0); setFrom(e.target.value); }}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("toWord")}</span>
          <input type="date" value={to} onChange={(e) => { setPage(0); setTo(e.target.value); }}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
        </label>
        <div className="col-span-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs">
            {t("perPage")}
            <select value={pageSize} onChange={(e) => { setPage(0); setPageSize(Number(e.target.value)); }}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <button
            onClick={() => navigate({ to: "/cards/$id/print", params: { id }, search: { from, to } as any })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> {t("printWord")}
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-semibold ${tx.amount_nok > 0 ? "bg-[color:var(--income)]/15 text-[color:var(--income)]" : "bg-[color:var(--spend)]/12 text-[color:var(--spend)]"}`}>
              {tx.merchant.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {tx.merchant}
                {tx.is_salary && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-[color:var(--salary)]/15 px-1.5 py-0.5 text-[9px] font-medium text-[color:var(--salary)] align-middle">
                    <Sparkles className="h-2.5 w-2.5" /> Lønn
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {tx.category ?? "Annet"} · {fmt.date(tx.posted_at)}
              </p>
            </div>
            <p className={`tabular shrink-0 text-sm font-semibold ${tx.amount_nok > 0 ? "text-[color:var(--income)]" : ""}`}>
              {tx.amount_nok > 0 ? "+" : ""}{fmt.money(Number(tx.amount_nok))}
            </p>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ingen transaksjoner i valgt periode.
          </li>
        )}
      </ul>

      <nav className="mt-4 flex items-center justify-between text-sm">
        <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Forrige
        </button>
        <span className="text-xs text-muted-foreground">Side {page + 1} / {totalPages}</span>
        <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 disabled:opacity-40">
          Neste <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </AppShell>
  );
}
