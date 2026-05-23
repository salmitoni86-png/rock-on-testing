import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { listTransactions, summarize, type Transaction } from "@/lib/transactions";

type PrintSearch = { from?: string; to?: string };

export const Route = createFileRoute("/_authenticated/cards/$id/print")({
  validateSearch: (s: Record<string, unknown>): PrintSearch => ({
    from: typeof s.from === "string" ? s.from : undefined,
    to: typeof s.to === "string" ? s.to : undefined,
  }),
  head: () => ({ meta: [{ title: "Utskrift — Kronekort-X" }] }),
  component: PrintView,
});

function PrintView() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { fmt } = useLang();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [card, setCard] = useState<{ name: string; last4: string | null } | null>(null);

  const fromISO = useMemo(
    () => (search.from ? new Date(search.from + "T00:00:00").toISOString() : new Date(Date.now() - 30 * 86400_000).toISOString()),
    [search.from]
  );
  const toISO = useMemo(
    () => (search.to ? new Date(search.to + "T23:59:59").toISOString() : new Date().toISOString()),
    [search.to]
  );

  useEffect(() => {
    (async () => {
      const [{ data: c }, all] = await Promise.all([
        supabase.from("cards").select("name,last4").eq("id", id).maybeSingle(),
        fetchAll(id, fromISO, toISO),
      ]);
      setCard(c as any);
      setRows(all);
    })();
  }, [id, fromISO, toISO]);

  const sums = summarize(rows);

  return (
    <div className="min-h-screen bg-white px-6 py-10 text-black print:px-0 print:py-0">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-start justify-between border-b border-black/20 pb-4 print:hidden">
          <Link to="/cards/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black">
            <ArrowLeft className="h-4 w-4" /> Tilbake
          </Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            <Printer className="h-4 w-4" /> Skriv ut
          </button>
        </header>

        <h1 className="font-display text-2xl font-bold">Kronekort-X · Kontoutskrift</h1>
        <p className="mt-1 text-sm text-black/70">
          {card?.name ?? "DNB Kronekort"} · •••• {card?.last4 ?? "0000"}
        </p>
        <p className="text-xs text-black/60">
          Periode: {fmt.date(fromISO)} – {fmt.date(toISO)} · {rows.length} transaksjoner
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Box label="Inn" value={fmt.money(sums.income)} />
          <Box label="Ut" value={fmt.money(sums.spend)} />
          <Box label="Netto" value={fmt.money(sums.net)} />
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-black/30 text-left text-xs uppercase tracking-wider text-black/60">
              <th className="py-2 font-medium">Dato</th>
              <th className="py-2 font-medium">Forhandler</th>
              <th className="py-2 font-medium">Kategori</th>
              <th className="py-2 text-right font-medium">Beløp</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.id} className="border-b border-black/10">
                <td className="py-1.5 text-xs">{fmt.date(tx.posted_at)}</td>
                <td className="py-1.5">{tx.merchant}</td>
                <td className="py-1.5 text-xs text-black/70">{tx.category ?? "—"}</td>
                <td className={`py-1.5 text-right tabular-nums ${tx.amount_nok > 0 ? "text-emerald-700" : ""}`}>
                  {tx.amount_nok > 0 ? "+" : ""}{fmt.money(Number(tx.amount_nok))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-8 text-[10px] text-black/40">
          Generert {new Date().toLocaleString()} · Kronekort-X
        </footer>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-black/50">{label}</p>
      <p className="tabular mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

async function fetchAll(cardId: string, fromISO: string, toISO: string): Promise<Transaction[]> {
  const out: Transaction[] = [];
  let page = 0;
  const size = 200;
  while (page < 50) {
    const { rows, total } = await listTransactions({ cardId, page, pageSize: size, from: fromISO, to: toISO });
    out.push(...rows);
    if (out.length >= total || rows.length < size) break;
    page++;
  }
  return out;
}
