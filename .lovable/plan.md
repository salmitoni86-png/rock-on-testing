
# Plan — Finish wiring + major feature expansion

Splitting this into phases. Phase 1 finishes the current half-done wiring (most urgent — app is broken without it). Phases 2–6 are the new features you asked for.

---

## Phase 1 — Finish current wiring (must-do first)

1. Move `/stats`, `/settings`, `/cards` under `_authenticated` layout (currently broken — routes deleted but new ones not all created).
2. Recreate `src/routes/_authenticated/stats.tsx` and `src/routes/_authenticated/settings.tsx`.
3. Fix `cards.tsx` TS error on `last4`.
4. Update `BottomNav` links to `/app`, `/cards`, `/stats`, `/settings`.
5. Add `onAuthStateChange` invalidation in `__root.tsx`.
6. Add `username` field to signup so `profiles.username` is set on first login.
7. **Single source of truth for data:** stop using `localStorage` seeded mock data on authenticated pages. Read cards + transactions from Supabase only. Keep `src/lib/kronekort.ts` helpers (`detectSalary`, `totals`, `dailySeries`) but feed them DB rows.

## Phase 2 — Transactions table + pagination + print

1. New `transactions` table (`id`, `card_id`, `posted_at`, `merchant`, `amount_nok`, `category`, `is_salary`, `external_id` unique per card to dedupe), RLS = card members.
2. Index on `(card_id, posted_at desc)`.
3. Server fn `listTransactions({ cardId, page, pageSize, from, to })` — sorted newest first, paginated.
4. Page size defaults: **desktop 20**, **mobile 10** (md breakpoint via `useIsMobile`). 15 as a user-selectable option.
5. **Per-card view on dashboard:** swap the merged stats card for one balance/recent-tx card per account (horizontally scrollable on mobile, grid on desktop). No more mixing accounts.
6. **Print view** at `/app/cards/$id/print?from=…&to=…` — server-rendered minimal layout, `window.print()` button. Lists every tx in selected timeline with totals.

## Phase 3 — Animated background + moving FX on hero text

1. New `<LivingBackground />` component: floating "X" glyphs and "kronekort-x" wordmarks drifting with parallax + slow blur, GPU-only transforms, respects `prefers-reduced-motion`. Used on splash + about + blog + testimonials.
2. Hero headline uses Motion gradient sweep + per-letter stagger on the big text.

## Phase 4 — Blog + comments

1. Tables: `blog_posts` (slug, title, excerpt, body_md, cover_url, author_id, published_at), `blog_comments` (post_id, author_id, body, created_at). RLS: posts public-readable when `published_at <= now()`; only admins write. Comments: any auth user can insert, only author or admin can delete.
2. Routes: `/blog` (list), `/blog/$slug` (detail + comments).

## Phase 5 — Testimonials + SoS/VIP page

1. Table `testimonials` (`author_id`, `name`, `role`, `body`, `rating`, `status` enum `pending|approved|rejected`, `reviewed_at`). Public sees only `approved`. Insert by any auth user. Update by admin only.
2. Route `/testimonials` — approved list + submission form.
3. Email/in-app notification to author when status changes to `approved` or `rejected` (DB trigger → `notifications` table, toast on next login).
4. Route `/vip` (or section on `/about`) — pitches SoS/VIP €5/month: loan options 1×, 2×, 3× rating, plus custom loan request form. **Payment integration not wired in this phase** — buttons land on a "coming soon" modal unless you want Stripe enabled (ask separately).

## Phase 6 — Admin + NetGuard integration

1. `user_roles` table + `app_role` enum (`admin`, `user`) + `has_role()` security-definer fn (per the user-roles security rule — never on profiles).
2. Route `/admin` gated by `has_role(uid, 'admin')`:
   - Review pending testimonials (approve/reject).
   - Manage blog posts (CRUD).
   - View NetGuard signals (see #3).
   - Manage SoS/VIP subscribers + loan requests.
3. **NetGuard bridge:** your Python NetGuard system pushes events into Supabase via a public webhook `/api/public/netguard/ingest` (HMAC-signed with `NETGUARD_WEBHOOK_SECRET`). New `netguard_events` table (admin-read only). Admin page shows a live feed (realtime subscription) + lets admin trigger actions back to NetGuard via a server fn calling its HTTP API (`NETGUARD_BASE_URL`, `NETGUARD_API_KEY`). I'll request these 3 secrets when Phase 6 starts.

---

## Questions before I start

1. **Scope per turn** — this is ~6 phases of work. Do you want me to do **all of Phase 1 + Phase 2 now** (gets the app functional + transactions/pagination/print/per-account), and then we tackle 3→6 in follow-up turns? Or push straight through everything in one shot (will be a very large change set and harder to review)?
2. **Data source for transactions** — since real DNB scraping isn't possible without BankID, should I (a) keep generating mock transactions stored in the DB so pagination/print/per-account all work end-to-end, or (b) leave the table empty until NetGuard or PSD2 feeds it?
3. **NetGuard** — do you already have it running with an HTTP API I can call, or do I scaffold a minimal Python FastAPI shim alongside this project? If you have it, share base URL shape and what events it emits.
4. **SoS/VIP payments** — wire Stripe now (€5/mo subscription + on-demand loan checkout), or leave as info page only for now?
