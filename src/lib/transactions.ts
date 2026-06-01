import { supabase } from "@/integrations/supabase/client";

export type Transaction = {
  id: string;
  card_id: string;
  posted_at: string;
  merchant: string;
  amount_nok: number;
  category: string | null;
  is_salary: boolean;
};

export async function listTransactions(opts: {
  cardId: string;
  page: number;
  pageSize: number;
  from?: string; // ISO
  to?: string;
}): Promise<{ rows: Transaction[]; total: number }> {
  const { cardId, page, pageSize, from, to } = opts;
  let q = supabase
    .from("transactions")
    .select("id,card_id,posted_at,merchant,amount_nok,category,is_salary", { count: "exact" })
    .eq("card_id", cardId)
    .order("posted_at", { ascending: false });
  if (from) q = q.gte("posted_at", from);
  if (to) q = q.lte("posted_at", to);
  const start = page * pageSize;
  q = q.range(start, start + pageSize - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data as Transaction[]) ?? [], total: count ?? 0 };
}

export async function seedMockTransactions(cardId: string) {
  const { error } = await supabase.rpc("seed_mock_transactions", { _card_id: cardId });
  if (error) throw error;
}

export function summarize(rows: Transaction[]) {
  let income = 0,
    spend = 0;
  for (const r of rows) {
    const a = Number(r.amount_nok);
    if (a > 0) income += a;
    else spend += -a;
  }
  return { income, spend, net: income - spend, count: rows.length };
}

export type PeriodSummary = {
  income: number;
  spend: number;
  net: number;
  count: number;
  topCategories: { category: string; total: number }[];
};

// Aggregates all transactions for a card within a period (for usage stats).
export async function periodSummary(opts: {
  cardId: string;
  from: string;
  to: string;
}): Promise<PeriodSummary> {
  const { cardId, from, to } = opts;
  const { data, error } = await supabase
    .from("transactions")
    .select("amount_nok,category")
    .eq("card_id", cardId)
    .gte("posted_at", from)
    .lte("posted_at", to)
    .order("posted_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  const rows = (data as { amount_nok: number; category: string | null }[]) ?? [];
  let income = 0,
    spend = 0;
  const cats = new Map<string, number>();
  for (const r of rows) {
    const a = Number(r.amount_nok);
    if (a > 0) income += a;
    else {
      spend += -a;
      const c = r.category ?? "Annet";
      cats.set(c, (cats.get(c) ?? 0) + -a);
    }
  }
  const topCategories = Array.from(cats.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  return { income, spend, net: income - spend, count: rows.length, topCategories };
}

