create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  posted_at timestamptz not null,
  merchant text not null,
  amount_nok numeric not null,
  category text,
  is_salary boolean not null default false,
  external_id text,
  created_at timestamptz not null default now(),
  unique (card_id, external_id)
);
create index transactions_card_date_idx on public.transactions (card_id, posted_at desc);
alter table public.transactions enable row level security;

create policy "Members can view transactions" on public.transactions
  for select to authenticated using (public.is_card_member(card_id, auth.uid()));
create policy "Owners can insert transactions" on public.transactions
  for insert to authenticated with check (public.is_card_owner(card_id, auth.uid()));
create policy "Owners can delete transactions" on public.transactions
  for delete to authenticated using (public.is_card_owner(card_id, auth.uid()));

create or replace function public.seed_mock_transactions(_card_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  _owner uuid;
  _exists boolean;
  _merchants text[] := array['REMA 1000','Kiwi','Meny','Bunnpris','Vinmonopolet','Apotek 1','Ruter','Circle K','Spotify','Netflix','H&M','Foodora','Espresso House','Joker','Coop Extra'];
  _cats text[] := array['Mat','Mat','Mat','Mat','Annet','Helse','Transport','Drivstoff','Abonnement','Abonnement','Klær','Mat','Kafé','Mat','Mat'];
  i int;
  _amt numeric;
  _idx int;
begin
  select owner_id into _owner from public.cards where id = _card_id;
  if _owner is null or _owner <> auth.uid() then raise exception 'not card owner'; end if;
  select exists(select 1 from public.transactions where card_id = _card_id) into _exists;
  if _exists then return; end if;

  for i in 0..49 loop
    _idx := 1 + (floor(random() * array_length(_merchants,1)))::int;
    _amt := -round((random()*900 + 30)::numeric, 0);
    insert into public.transactions (card_id, posted_at, merchant, amount_nok, category, is_salary, external_id)
    values (_card_id, now() - (i || ' days')::interval - (floor(random()*23) || ' hours')::interval,
            _merchants[_idx], _amt, _cats[_idx], false, 'seed-'||i);
  end loop;
  insert into public.transactions (card_id, posted_at, merchant, amount_nok, category, is_salary, external_id)
  values (_card_id, now() - interval '3 days', 'NAV UTBETALING', 12450, 'Inntekt', true, 'seed-sal-1'),
         (_card_id, now() - interval '17 days', 'ARBEIDSGIVER AS LØNN', 38200, 'Inntekt', true, 'seed-sal-2');

  update public.cards set last_balance = (
    select coalesce(sum(amount_nok),0) from public.transactions where card_id = _card_id
  ), last_polled_at = now() where id = _card_id;
end; $$;
revoke execute on function public.seed_mock_transactions(uuid) from public, anon;
grant execute on function public.seed_mock_transactions(uuid) to authenticated;