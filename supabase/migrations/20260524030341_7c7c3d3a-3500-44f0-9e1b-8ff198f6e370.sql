
-- ROLES
create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_uid uuid, _role app_role)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_uid and role=_role)
$$;

create policy "view own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- BLOG
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body_md text not null default '',
  cover_url text,
  category_id uuid references public.blog_categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_comments enable row level security;

create policy "cats public read" on public.blog_categories for select using (true);
create policy "cats admin write" on public.blog_categories for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create policy "posts public read" on public.blog_posts for select using (published_at is not null and published_at <= now());
create policy "posts admin read all" on public.blog_posts for select to authenticated using (has_role(auth.uid(),'admin'));
create policy "posts admin write" on public.blog_posts for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create policy "comments public read" on public.blog_comments for select using (true);
create policy "comments auth insert" on public.blog_comments for insert to authenticated with check (auth.uid() = author_id);
create policy "comments own or admin delete" on public.blog_comments for delete to authenticated using (auth.uid() = author_id or has_role(auth.uid(),'admin'));

-- FRIENDSHIPS
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  unique(requester_id, addressee_id)
);
alter table public.friendships enable row level security;
create policy "friends view own" on public.friendships for select to authenticated using (auth.uid() in (requester_id, addressee_id));
create policy "friends create" on public.friendships for insert to authenticated with check (auth.uid() = requester_id);
create policy "friends update own" on public.friendships for update to authenticated using (auth.uid() in (requester_id, addressee_id));
create policy "friends delete own" on public.friendships for delete to authenticated using (auth.uid() in (requester_id, addressee_id));

-- INVITATIONS / REFERRALS
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  code text unique not null default substr(md5(random()::text||clock_timestamp()::text),1,10),
  email text,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  manual boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.invitations enable row level security;
create policy "inv own view" on public.invitations for select to authenticated using (auth.uid() = inviter_id or auth.uid() = accepted_by or has_role(auth.uid(),'admin'));
create policy "inv own insert" on public.invitations for insert to authenticated with check (auth.uid() = inviter_id);
create policy "inv own update" on public.invitations for update to authenticated using (auth.uid() = inviter_id or has_role(auth.uid(),'admin'));

create table public.referral_tiers (
  id int primary key,
  threshold int not null,
  title text not null,
  perk text not null
);
alter table public.referral_tiers enable row level security;
create policy "tiers public read" on public.referral_tiers for select using (true);

insert into public.referral_tiers(id,threshold,title,perk) values
  (1,1,'Brons','1 mnd Pro gratis'),
  (2,3,'Sølv','3 mnd Pro + tilpasset profil'),
  (3,5,'Gull','VIP-merke + prioritert support'),
  (4,10,'Platina','Livstidsmedlemskap'),
  (5,25,'Ambassadør','Inntektsandel + tidlig tilgang');

-- SUPPORT CHAT
create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anon_id text,
  needs_human boolean not null default false,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','staff','system')),
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

create policy "convo own view" on public.support_conversations for select using (auth.uid() = user_id or has_role(auth.uid(),'admin'));
create policy "convo insert any" on public.support_conversations for insert with check (true);
create policy "convo own update" on public.support_conversations for update using (auth.uid() = user_id or has_role(auth.uid(),'admin'));

create policy "msg view by convo" on public.support_messages for select using (
  exists(select 1 from public.support_conversations c where c.id = conversation_id and (c.user_id = auth.uid() or has_role(auth.uid(),'admin')))
  or exists(select 1 from public.support_conversations c where c.id = conversation_id and c.user_id is null)
);
create policy "msg insert any" on public.support_messages for insert with check (true);

-- SITE VISITS
create table public.site_visits (
  id bigserial primary key,
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  path text,
  country text,
  city text,
  lat double precision,
  lng double precision,
  user_agent text,
  created_at timestamptz not null default now()
);
create index on public.site_visits(created_at desc);
alter table public.site_visits enable row level security;
create policy "visits anyone insert" on public.site_visits for insert with check (true);
create policy "visits admin read" on public.site_visits for select to authenticated using (has_role(auth.uid(),'admin'));
create policy "visits public live read" on public.site_visits for select using (created_at > now() - interval '15 minutes');
