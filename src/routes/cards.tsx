import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { type Card as CardT, formatNOK, loadCards, saveCards } from "@/lib/kronekort";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      { title: "Kort — Kronekort" },
      { name: "description", content: "Administrer dine bankkort fra DNB, Nordea og Sbanken." },
    ],
  }),
  component: CardsPage,
});

const PROVIDERS: CardT["provider"][] = ["DNB", "Nordea", "Sbanken", "Mock"];

function CardsPage() {
  const [cards, setCards] = useState<CardT[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => setCards(loadCards()), []);

  function addCard(provider: CardT["provider"]) {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const next: CardT = {
      id: `c${Date.now()}`,
      name: `${provider} konto`,
      provider,
      last4,
      balance: Math.floor(2000 + Math.random() * 30000),
    };
    const updated = [...cards, next];
    setCards(updated);
    saveCards(updated);
    setAdding(false);
  }

  function remove(id: string) {
    const updated = cards.filter((c) => c.id !== id);
    setCards(updated);
    saveCards(updated);
  }

  return (
    <AppShell
      title="Dine kort"
      subtitle={`${cards.length} aktive kort`}
      right={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label="Legg til kort"
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      {adding && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Velg leverandør</p>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => addCard(p)}
                className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-4">
        {cards.map((c, i) => (
          <li key={c.id} className="balance-card relative overflow-hidden rounded-3xl p-5" style={{ filter: `hue-rotate(${i * 30}deg)` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/70">{c.provider}</p>
                <p className="mt-1 font-display text-lg font-semibold">{c.name}</p>
              </div>
              <button
                onClick={() => remove(c.id)}
                aria-label="Fjern kort"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="tabular mt-6 font-mono text-base tracking-[0.3em] text-white/80">
              •••• •••• •••• {c.last4}
            </p>
            <p className="tabular mt-3 font-display text-2xl font-semibold">{formatNOK(c.balance)}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
