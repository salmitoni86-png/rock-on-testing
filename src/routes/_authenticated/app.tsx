import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LogOut, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { listTransactions, seedMockTransactions, summarize, type Transaction } from "@/lib/transactions";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Saldo — Kronekort-X" }] }),
  component: Dashboard,
});

type Card = {
  id: string; name: string; last4: string | null;
  last_balance: number | null; owner_id: string;
};

function Dashboard() {
  const { t, fmt } = useLang();
  const [cards, setCards] = useState<Card[]>([]);
  const [byCard, setByCard] = useState<Record<string, Transaction[]>>({});

  async function load() {
    const { data: cs } = await supabase.from("cards").select("id,name,last4,last_balance,owner_id").order("created_at");
    const list = (cs as Card[]) ?? [];
    setCards(list);
    const entries = await Promise.all(
      list.map(async (c) => {
        const { rows } = await listTransactions({ cardId: c.id, page: 0, pageSize: 6 });
        return [c.id, rows] as const;
      })
    );
    setByCard(Object.fromEntries(entries));
  }
  useEffect(() => { load(); }, []);

  async function seed(cardId: string) {
    try { await seedMockTransactions(cardId); toast.success("Demo-data lagt til"); load(); }
    catch (e: any) { toast.error(e.message ?? "Feilet"); }
  }

  return (
    <AppShell
      title={t("greeting") + " 👋"}
      subtitle={cards.length ? `${cards.length} ${cards.length === 1 ? "kort" : "kort"}` : t("subHome")}
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
      <Toaster position="top-center" />

      {cards.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Ingen kort registrert enda.</p>
          <Link to="/cards" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Legg til DNB Kronekort <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-2 space-y-6">
          {cards.map((c) => (
            <AccountSection key={c.id} card={c} txs={byCard[c.id] ?? []} onSeed={() => seed(c.id)} fmt={fmt} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function AccountSection({
  card, txs, onSeed, fmt,
}: { card: Card; txs: Transaction[]; onSeed: () => void; fmt: ReturnType<typeof useLang>["fmt"] }) {
  const sums = useMemo(() => summarize(txs), [txs]);
  const lastSalary = txs.find((t) => t.is_salary);

  return (
    <section>
      <div className="balance-card overflow-hidden rounded-3xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/70">DNB · Kronekort</p>
            <p className="mt-1 font-display text-lg font-semibold">{card.name}</p>
          </div>
          <p className="font-mono text-xs tracking-[0.3em] text-white/70">•••• {card.last4 ?? "0000"}</p>
        </div>
        <p className="tabular mt-4 font-display text-3xl font-semibold">
          {card.last_balance != null ? fmt.money(Number(card.last_balance)) : "—"}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl bg-white/10 p-2">
            <p className="uppercase tracking-wider text-[color:var(--income)]">Inn (siste)</p>
            <p className="tabular text-sm font-semibold text-white">{fmt.money(sums.income)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <p className="uppercase tracking-wider text-[color:var(--spend)]">Ut (siste)</p>
            <p className="tabular text-sm font-semibold text-white">{fmt.money(sums.spend)}</p>
          </div>
        </div>
      </div>

      {lastSalary && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--salary)]/15 text-[color:var(--salary)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Lønn / NAV oppdaget</p>
            <p className="truncate text-xs text-muted-foreground">{lastSalary.merchant}</p>
          </div>
          <p className="tabular text-sm font-semibold text-[color:var(--income)]">+{fmt.money(Number(lastSalary.amount_nok))}</p>
        </div>
      )}

      {txs.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">Ingen transaksjoner enda</p>
          <button onClick={onSeed} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs hover:bg-accent">
            <Wand2 className="h-3.5 w-3.5" /> Generer demo-data
          </button>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {txs.map((tx) => (
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
        </ul>
      )}

      <Link
        to="/cards/$id"
        params={{ id: card.id }}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        Alle transaksjoner <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
