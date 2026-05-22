
# Plan: Splash, accounts, card sharing, scheduled polling, About page

## 1. Enable Lovable Cloud
Provisions auth + Postgres for accounts, cards, and sharing.

## 2. Splash / landing route (`/`)
- New marketing landing page using the current navy/dark gradient theme already in `styles.css` (`--bcard-a/b/c`).
- Big, creative hero headline + subhead about how Kronekort-X makes tracking salary, NAV and spending effortless.
- Three feature tiles: "Automatisk saldo 6×/dag", "Del kortet trygt med familie", "Lønn & NAV varsler".
- CTAs: **Opprett konto** / **Logg inn** (and "Se demo" → opens dashboard with mock data).
- Move the current dashboard from `/` to `/app` (under `_authenticated`).

Creative heading direction (final wording TBD): something like
"Vet hvor kronene dine er — før banken gjør det."

## 3. Auth
- Email + password (default) and Google sign-in via Lovable broker.
- Routes: `/login`, `/signup`, `/reset-password`.
- `profiles` table (id → auth.users, username unique, display_name, created_at) with auto-insert trigger on signup. Username is what other users will reference for sharing.
- `_authenticated` layout guards `/app`, `/cards`, `/stats`, `/settings`.

## 4. Card model + sharing
Tables:
- `cards`: id, owner_id (auth.users), name, last4, card_number_encrypted, is_active, created_at.
- `card_members`: card_id, user_id, role (`owner` | `viewer`), accepted_at. Unique (card_id, user_id).
- `card_share_requests`: card_id, requested_by, status (`pending`|`accepted`|`declined`), created_at.

Flows:
- Owner registers card under **Cards → Add Kronekort** (card number, optional nickname).
- Other user goes to **Cards → Join card**, enters the card's short ID or owner username + last4 → creates a `card_share_requests` row.
- Owner sees pending requests under **Card settings** and approves/declines. Approval inserts a `card_members` row.
- Owner can also directly add a member by username from Card settings.
- RLS: card readable if `auth.uid()` is in `card_members` for that card; only `owner` role can modify card / approve requests / add members.

## 5. Saldo polling (scheduled + on-demand)
Server-side scheduler hitting DNB's saldo endpoint at **08, 10, 12, 14, 16, 20 Europe/Oslo** for active cards, **once/day** for inactive cards. Manual "Sync now" stays, but no longer counts against a per-user quota — server enforces schedule.

Implementation:
- `createServerFn` `pollCardSaldo(cardId)` — server route under `/api/public/cron/poll-saldo` triggered by pg_cron via Cloud, plus on-demand call from UI.
- Continue using a rotating proxy list (existing `PROXY_LIST` env) so requests don't all originate from one IP.
- Write each result to `card_balances` (card_id, balance, polled_at, proxy_used) and update `cards.last_balance`.

**Important caveat to flag to the user before building this**: dnb.no/kort/Kronekort/saldo is behind DNB's BankID login — it cannot be scraped server-side from a card number alone. Realistic options are (a) keep the current **mock/demo** polling, or (b) integrate DNB's Open Banking PSD2 APIs (requires DNB developer account + per-user consent). Plan assumes option (a) for now with the architecture ready to swap in (b). I'll confirm with you before writing scraping code.

## 6. About / Donate page (`/about`)
- Story of the app, dev credits.
- External donation buttons: Buy Me a Coffee + Ko-fi (URLs you provide; placeholders until then).
- Reachable from splash footer and bottom nav (replace one slot or add as menu item).

## 7. Routing summary
```
/                  splash (public)
/login /signup     auth
/about             about + donate (public)
/_authenticated/
  app              dashboard (previous index)
  cards            list + add + join + settings
  cards/$id        card detail incl. share approvals
  stats
  settings
```

## Open question
The note `@file:.lovable` at the end of your message — I'm not sure what file/instruction you meant. If it's a reference doc or asset, please share it; otherwise I'll proceed as above.
