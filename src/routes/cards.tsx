import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { type Card as CardT, loadCards, saveCards } from "@/lib/kronekort";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: "DNB Kronekort" },
      { name: "description", content: "Administrer dine DNB Kronekort." },
    ],
  }),
  component: CardsPage,
});

function CardsPage() {
  const { t, fmt } = useLang();
  const [cards, setCards] = useState<CardT[]>([]);

  useEffect(() => setCards(loadCards()), []);

  function addCard() {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const next: CardT = {
      id: `dnb-${Date.now()}`,
      name: `DNB Kronekort`,
      provider: "DNB",
      last4,
      balance: Math.floor(2000 + Math.random() * 30000),
    };
    const updated = [...cards, next];
    setCards(updated);
    saveCards(updated);
  }

  function remove(id: string) {
    const updated = cards.filter((c) => c.id !== id);
    setCards(updated);
    saveCards(updated);
  }

  return (
    <AppShell
      title={t("cards")}
      subtitle={t("activeCards", { n: cards.length })}
      right={
        <button
          onClick={addCard}
          aria-label={t("addCard")}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <p className="mb-4 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        {t("onlyDnb")}
      </p>

      <ul className="space-y-4">
        {cards.map((c) => (
          <li key={c.id} className="balance-card relative overflow-hidden rounded-3xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/70">{c.provider} · Kronekort</p>
                <p className="mt-1 font-display text-lg font-semibold">{c.name}</p>
              </div>
              <button
                onClick={() => remove(c.id)}
                aria-label="Remove"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="tabular mt-6 font-mono text-base tracking-[0.3em] text-white/80">
              •••• •••• •••• {c.last4}
            </p>
            <p className="tabular mt-3 font-display text-2xl font-semibold">{fmt.money(c.balance)}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
