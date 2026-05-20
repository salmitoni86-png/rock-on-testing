// Domain layer — DNB Kronekort only. Polling is capped at 6/day and
// routed through a server-side proxy rotator (see /api/public/poll-saldo).

export type Card = {
  id: string;
  name: string;
  provider: "DNB"; // DNB Kronekort only
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

export const MAX_POLLS_PER_DAY = 6;

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

const KEY_CARDS = "kronekort.cards.v2";
const KEY_TX = "kronekort.tx.v2";
const KEY_SETTINGS = "kronekort.settings.v2";

export type Settings = {
  notifications: boolean;
  mockMode: boolean;
  pollHistory: number[]; // timestamps (ms) of saldo polls in last 24h
};

const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  mockMode: true,
  pollHistory: [],
};

function seedCards(): Card[] {
  return [
    { id: "dnb-1", name: "DNB Kronekort", provider: "DNB", last4: "4821", balance: 18420 },
  ];
}

function seedTx(): Tx[] {
  const now = Date.now();
  const day = 86400_000;
  const items: Omit<Tx, "id" | "isSalary">[] = [
    { cardId: "dnb-1", date: new Date(now).toISOString(), merchant: "REMA 1000", amount: -342, category: "Mat" },
    { cardId: "dnb-1", date: new Date(now - 3600_000).toISOString(), merchant: "Ruter", amount: -42, category: "Transport" },
    { cardId: "dnb-1", date: new Date(now - 1 * day).toISOString(), merchant: "Espresso House", amount: -68, category: "Kafé" },
    { cardId: "dnb-1", date: new Date(now - 2 * day).toISOString(), merchant: "NAV UTBETALING", amount: 12450, category: "Inntekt" },
    { cardId: "dnb-1", date: new Date(now - 3 * day).toISOString(), merchant: "KIWI", amount: -512, category: "Mat" },
    { cardId: "dnb-1", date: new Date(now - 4 * day).toISOString(), merchant: "Vinmonopolet", amount: -429, category: "Annet" },
    { cardId: "dnb-1", date: new Date(now - 5 * day).toISOString(), merchant: "Netflix", amount: -149, category: "Abonnement" },
    { cardId: "dnb-1", date: new Date(now - 6 * day).toISOString(), merchant: "ARBEIDSGIVER AS LØNN", amount: 38200, category: "Inntekt" },
    { cardId: "dnb-1", date: new Date(now - 7 * day).toISOString(), merchant: "Bunnpris", amount: -218, category: "Mat" },
    { cardId: "dnb-1", date: new Date(now - 8 * day).toISOString(), merchant: "Apotek 1", amount: -94, category: "Helse" },
    { cardId: "dnb-1", date: new Date(now - 10 * day).toISOString(), merchant: "Spotify", amount: -119, category: "Abonnement" },
    { cardId: "dnb-1", date: new Date(now - 12 * day).toISOString(), merchant: "Meny", amount: -624, category: "Mat" },
    { cardId: "dnb-1", date: new Date(now - 14 * day).toISOString(), merchant: "H&M", amount: -399, category: "Klær" },
    { cardId: "dnb-1", date: new Date(now - 16 * day).toISOString(), merchant: "Circle K", amount: -780, category: "Drivstoff" },
    { cardId: "dnb-1", date: new Date(now - 18 * day).toISOString(), merchant: "Foodora", amount: -287, category: "Mat" },
    { cardId: "dnb-1", date: new Date(now - 20 * day).toISOString(), merchant: "REMA 1000", amount: -456, category: "Mat" },
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
  if (existing && existing.length) {
    // Enforce DNB-only invariant on legacy stores
    const dnb = existing.filter((c) => c.provider === "DNB");
    if (dnb.length) return dnb;
  }
  const seeded = seedCards();
  safeSet(KEY_CARDS, seeded);
  return seeded;
}
export function saveCards(c: Card[]) { safeSet(KEY_CARDS, c.filter((x) => x.provider === "DNB")); }

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

// Polling quota — capped at MAX_POLLS_PER_DAY rolling 24h.
export function pollsRemaining(s: Settings): number {
  const cutoff = Date.now() - 86400_000;
  const recent = s.pollHistory.filter((t) => t > cutoff);
  return Math.max(0, MAX_POLLS_PER_DAY - recent.length);
}
export function nextPollIn(s: Settings): { h: number; m: number } | null {
  const cutoff = Date.now() - 86400_000;
  const recent = s.pollHistory.filter((t) => t > cutoff).sort((a, b) => a - b);
  if (recent.length < MAX_POLLS_PER_DAY) return null;
  const oldest = recent[0];
  const ms = oldest + 86400_000 - Date.now();
  return { h: Math.floor(ms / 3_600_000), m: Math.floor((ms % 3_600_000) / 60_000) };
}
export function recordPoll(s: Settings): Settings {
  const cutoff = Date.now() - 86400_000;
  return { ...s, pollHistory: [...s.pollHistory.filter((t) => t > cutoff), Date.now()] };
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
  return { mIn, mOut, dIn, dOut, monthlyNet: mIn - mOut };
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
