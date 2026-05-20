// Mock domain layer for Kronekort Saldo — ported from the Python app's
// services/models. Pure client-side, deterministic seed, persists to localStorage.

export type Card = {
  id: string;
  name: string;
  provider: "DNB" | "Nordea" | "Sbanken" | "Mock";
  last4: string;
  balance: number; // NOK
};

export type Tx = {
  id: string;
  cardId: string;
  date: string; // ISO
  merchant: string;
  amount: number; // negative = spend, positive = income
  category: string;
  isSalary?: boolean;
};

const SALARY_KEYWORDS = ["NAV", "LØNN", "LONN", "SALARY", "UTBETALING", "TRYGD"];
const SALARY_MIN = 1000;

export function detectSalary(merchant: string, amount: number): boolean {
  if (amount < SALARY_MIN) return false;
  const m = merchant.toUpperCase();
  return SALARY_KEYWORDS.some((k) => m.includes(k));
}

export const formatNOK = (n: number) =>
  new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(n);

const KEY_CARDS = "kronekort.cards.v1";
const KEY_TX = "kronekort.tx.v1";
const KEY_SETTINGS = "kronekort.settings.v1";

export type Settings = {
  pollSeconds: number;
  notifications: boolean;
  mockMode: boolean;
  dailyDigestHour: number;
};

const DEFAULT_SETTINGS: Settings = {
  pollSeconds: 30,
  notifications: true,
  mockMode: true,
  dailyDigestHour: 7,
};

function seedCards(): Card[] {
  return [
    { id: "c1", name: "Hverdagskonto", provider: "DNB", last4: "4821", balance: 18420 },
    { id: "c2", name: "Sparekonto", provider: "Sbanken", last4: "9930", balance: 64200 },
    { id: "c3", name: "Reisekort", provider: "Nordea", last4: "1177", balance: 2310 },
  ];
}

function seedTx(): Tx[] {
  const now = Date.now();
  const day = 86400_000;
  const items: Omit<Tx, "id" | "isSalary">[] = [
    { cardId: "c1", date: new Date(now - 0 * day).toISOString(), merchant: "REMA 1000", amount: -342, category: "Mat" },
    { cardId: "c1", date: new Date(now - 0 * day - 3600_000).toISOString(), merchant: "Ruter", amount: -42, category: "Transport" },
    { cardId: "c3", date: new Date(now - 1 * day).toISOString(), merchant: "Vy Tog", amount: -289, category: "Transport" },
    { cardId: "c1", date: new Date(now - 1 * day).toISOString(), merchant: "Espresso House", amount: -68, category: "Kafé" },
    { cardId: "c2", date: new Date(now - 2 * day).toISOString(), merchant: "NAV UTBETALING", amount: 12450, category: "Inntekt" },
    { cardId: "c1", date: new Date(now - 3 * day).toISOString(), merchant: "KIWI", amount: -512, category: "Mat" },
    { cardId: "c1", date: new Date(now - 4 * day).toISOString(), merchant: "Vinmonopolet", amount: -429, category: "Annet" },
    { cardId: "c1", date: new Date(now - 5 * day).toISOString(), merchant: "Netflix", amount: -149, category: "Abonnement" },
    { cardId: "c2", date: new Date(now - 6 * day).toISOString(), merchant: "ARBEIDSGIVER AS LØNN", amount: 38200, category: "Inntekt" },
    { cardId: "c1", date: new Date(now - 7 * day).toISOString(), merchant: "Bunnpris", amount: -218, category: "Mat" },
    { cardId: "c1", date: new Date(now - 8 * day).toISOString(), merchant: "Apotek 1", amount: -94, category: "Helse" },
    { cardId: "c3", date: new Date(now - 9 * day).toISOString(), merchant: "SAS", amount: -1890, category: "Reise" },
    { cardId: "c1", date: new Date(now - 10 * day).toISOString(), merchant: "Spotify", amount: -119, category: "Abonnement" },
    { cardId: "c1", date: new Date(now - 12 * day).toISOString(), merchant: "Meny", amount: -624, category: "Mat" },
    { cardId: "c1", date: new Date(now - 14 * day).toISOString(), merchant: "H&M", amount: -399, category: "Klær" },
    { cardId: "c1", date: new Date(now - 16 * day).toISOString(), merchant: "Circle K", amount: -780, category: "Drivstoff" },
    { cardId: "c1", date: new Date(now - 18 * day).toISOString(), merchant: "Foodora", amount: -287, category: "Mat" },
    { cardId: "c1", date: new Date(now - 20 * day).toISOString(), merchant: "REMA 1000", amount: -456, category: "Mat" },
  ];
  return items.map((t, i) => ({
    ...t,
    id: `t${i}`,
    isSalary: detectSalary(t.merchant, t.amount),
  }));
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadCards(): Card[] {
  const existing = safeGet<Card[] | null>(KEY_CARDS, null);
  if (existing && existing.length) return existing;
  const seeded = seedCards();
  safeSet(KEY_CARDS, seeded);
  return seeded;
}
export function saveCards(c: Card[]) { safeSet(KEY_CARDS, c); }

export function loadTx(): Tx[] {
  const existing = safeGet<Tx[] | null>(KEY_TX, null);
  if (existing && existing.length) return existing;
  const seeded = seedTx();
  safeSet(KEY_TX, seeded);
  return seeded;
}
export function saveTx(t: Tx[]) { safeSet(KEY_TX, t); }

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...safeGet<Partial<Settings>>(KEY_SETTINGS, {}) };
}
export function saveSettings(s: Settings) { safeSet(KEY_SETTINGS, s); }

export function resetAll() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_CARDS);
  localStorage.removeItem(KEY_TX);
  localStorage.removeItem(KEY_SETTINGS);
}

// Simulate one polling "tick" — randomly add a new mock transaction.
const MOCK_MERCHANTS = [
  { m: "REMA 1000", a: [-120, -680], c: "Mat" },
  { m: "Ruter", a: [-42, -42], c: "Transport" },
  { m: "Espresso House", a: [-58, -98], c: "Kafé" },
  { m: "Circle K", a: [-300, -900], c: "Drivstoff" },
  { m: "Foodora", a: [-180, -420], c: "Mat" },
  { m: "Vinmonopolet", a: [-200, -700], c: "Annet" },
];

export function tick(cards: Card[], tx: Tx[]): { cards: Card[]; tx: Tx[]; newTx: Tx | null } {
  // 60% chance a new transaction shows up on the primary card.
  if (Math.random() > 0.6) return { cards, tx, newTx: null };
  const pick = MOCK_MERCHANTS[Math.floor(Math.random() * MOCK_MERCHANTS.length)];
  const amount = Math.round(pick.a[0] + Math.random() * (pick.a[1] - pick.a[0]));
  const cardId = cards[0]?.id ?? "c1";
  const newTx: Tx = {
    id: `t${Date.now()}`,
    cardId,
    date: new Date().toISOString(),
    merchant: pick.m,
    amount,
    category: pick.c,
    isSalary: false,
  };
  const newCards = cards.map((c) =>
    c.id === cardId ? { ...c, balance: c.balance + amount } : c,
  );
  return { cards: newCards, tx: [newTx, ...tx], newTx };
}

export function totals(tx: Tx[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let mIn = 0, mOut = 0, dIn = 0, dOut = 0;
  for (const t of tx) {
    const ts = new Date(t.date).getTime();
    if (ts >= monthStart) {
      if (t.amount > 0) mIn += t.amount; else mOut += -t.amount;
    }
    if (ts >= today) {
      if (t.amount > 0) dIn += t.amount; else dOut += -t.amount;
    }
  }
  return { mIn, mOut, dIn, dOut };
}

export function dailySeries(tx: Tx[], days = 14) {
  const out: { day: string; spend: number; income: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getTime() + 86400_000);
    let spend = 0, income = 0;
    for (const t of tx) {
      const ts = new Date(t.date).getTime();
      if (ts >= d.getTime() && ts < next.getTime()) {
        if (t.amount > 0) income += t.amount;
        else spend += -t.amount;
      }
    }
    out.push({
      day: d.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric" }),
      spend,
      income,
    });
  }
  return out;
}
