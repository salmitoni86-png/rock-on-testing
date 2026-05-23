import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Printer, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { listTransactions, type Transaction } from "@/lib/transactions";

export const Route = createFileRoute("/_authenticated/cards/$id")({
  head: () => ({ meta: [{ title: "Transaksjoner — Kronekort-X" }] }),
  component: CardDetail,
});

type Card = { id: string; name: string; last4: string | null; last_balance: number | null };

function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthAgoISO() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }

function CardDetail() {
  const { id } = Route.useParams();
  const { fmt } = useLang();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(isMobile ? 10 : 20);
  const [from, setFrom] = useState(monthAgoISO());
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => { setPageSize(isMobile ? 10 : 20); }, [isMobile]);

  useEffect(() => {
    supabase.from("cards").select("id,name,last4,last_balance").eq("id", id).maybeSingle()
      .then(({ data }) => setCard(data as Card));
  }, [id]);

  useEffect(() => {
    listTransactions({
      cardId: id, page, pageSize,
      from: new Date(from + "T00:00:00").toISOString(),
      to: new Date(to + "T23:59:59").toISOString(),
    }).then((r) => { setRows(r.rows); setTotal(r.total); });
  }, [id, page, pageSize, from, to]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell
      title={card?.name ?? "Kort"}
      subtitle={`•••• ${card?.last4 ?? "0000"} · ${total} transaksjoner`}
      right={
        <Link to="/cards" className="grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-accent" aria-label="Tilbake">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fra</span>
          <input type="date" value={from} onChange={(e) => { setPage(0); setFrom(e.target.value); }}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Til</span>
          <input type="date" value={to} onChange={(e) => { setPage(0); setTo(e.target.value); }}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
        </label>
        <div className="col-span-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs">
            Per side:
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
            <Printer className="h-3.5 w-3.5" /> Skriv ut
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-semibold ${tx.amount_nok > 0 ? "bg-[color:var(--income)]/15 text-[color:var(--income)]" : "bg-[color:var(--spend)]/12 text-[color:var(--spend)]"}`}>
              {tx.merchant.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tx.merchant}</p>
              <p className="truncate text-xs text-muted-foreground">{tx.category ?? "—"} · {fmt.date(tx.posted_at)}</p>
            </div>
            <p className={`tabular text-sm font-semibold ${tx.amount_nok > 0 ? "text-[color:var(--income)]" : ""}`}>
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
