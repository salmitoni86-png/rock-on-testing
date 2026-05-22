
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are readable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  candidate text;
  n int := 0;
begin
  base_username := lower(coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1),
    'user'
  ));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  if length(base_username) < 3 then base_username := base_username || 'user'; end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base_username || n::text;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Cards
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'DNB Kronekort',
  card_number text not null,
  last4 text generated always as (right(card_number, 4)) stored,
  is_active boolean not null default true,
  last_balance numeric,
  last_polled_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.cards enable row level security;

-- Card members (owner + viewers)
create table public.card_members (
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','viewer')),
  accepted_at timestamptz not null default now(),
  primary key (card_id, user_id)
);
alter table public.card_members enable row level security;

-- Auto-insert owner as member
create or replace function public.handle_new_card()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.card_members (card_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end; $$;
create trigger on_card_created
after insert on public.cards
for each row execute function public.handle_new_card();

-- Helper to avoid recursive RLS
create or replace function public.is_card_member(_card_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.card_members where card_id = _card_id and user_id = _user_id);
$$;

create or replace function public.is_card_owner(_card_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.card_members where card_id = _card_id and user_id = _user_id and role = 'owner');
$$;

create policy "Members can view their cards"
  on public.cards for select to authenticated
  using (public.is_card_member(id, auth.uid()));
create policy "Users can create their own cards"
  on public.cards for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can update cards"
  on public.cards for update to authenticated using (public.is_card_owner(id, auth.uid()));
create policy "Owners can delete cards"
  on public.cards for delete to authenticated using (public.is_card_owner(id, auth.uid()));

create policy "Members can view co-members"
  on public.card_members for select to authenticated
  using (public.is_card_member(card_id, auth.uid()));
create policy "Owners can add members"
  on public.card_members for insert to authenticated
  with check (public.is_card_owner(card_id, auth.uid()) or user_id = auth.uid());
create policy "Owners can remove members"
  on public.card_members for delete to authenticated
  using (public.is_card_owner(card_id, auth.uid()));

-- Share requests
create table public.card_share_requests (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (card_id, requested_by)
);
alter table public.card_share_requests enable row level security;

create policy "Owners and requester can view share requests"
  on public.card_share_requests for select to authenticated
  using (requested_by = auth.uid() or public.is_card_owner(card_id, auth.uid()));
create policy "Authenticated users can request"
  on public.card_share_requests for insert to authenticated
  with check (requested_by = auth.uid());
create policy "Owners can update requests"
  on public.card_share_requests for update to authenticated
  using (public.is_card_owner(card_id, auth.uid()));

-- Balance history
create table public.card_balances (
  id bigserial primary key,
  card_id uuid not null references public.cards(id) on delete cascade,
  balance numeric not null,
  polled_at timestamptz not null default now(),
  proxy_used text
);
alter table public.card_balances enable row level security;
create policy "Members can view balances"
  on public.card_balances for select to authenticated
  using (public.is_card_member(card_id, auth.uid()));
