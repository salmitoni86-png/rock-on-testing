CREATE OR REPLACE FUNCTION public.refresh_card_transactions(_card_id uuid)
RETURNS TABLE(added int, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  _merchants text[] := array['REMA 1000','Kiwi','Meny','Bunnpris','Vinmonopolet','Apotek 1','Ruter','Circle K','Spotify','Netflix','H&M','Foodora','Espresso House','Joker','Coop Extra'];
  _cats text[] := array['Mat','Mat','Mat','Mat','Annet','Helse','Transport','Drivstoff','Abonnement','Abonnement','Klær','Mat','Kafé','Mat','Mat'];
  _n int;
  i int;
  _idx int;
  _amt numeric;
  _bal numeric;
begin
  -- access control: must be a member (owner or viewer) of the card
  if not public.is_card_member(_card_id, auth.uid()) then
    raise exception 'not a card member';
  end if;

  -- only the owner can sync new activity
  if not public.is_card_owner(_card_id, auth.uid()) then
    raise exception 'only the card owner can refresh';
  end if;

  _n := 1 + floor(random() * 4)::int; -- add 1..4 new transactions
  for i in 1.._n loop
    _idx := 1 + (floor(random() * array_length(_merchants,1)))::int;
    _amt := -round((random()*900 + 30)::numeric, 0);
    insert into public.transactions (card_id, posted_at, merchant, amount_nok, category, is_salary, external_id)
    values (_card_id,
            now() - (floor(random()*6) || ' hours')::interval - (floor(random()*55) || ' minutes')::interval,
            _merchants[_idx], _amt, _cats[_idx], false,
            'sync-' || extract(epoch from now())::bigint || '-' || i);
  end loop;

  select coalesce(sum(amount_nok),0) into _bal from public.transactions where card_id = _card_id;
  update public.cards set last_balance = _bal, last_polled_at = now() where id = _card_id;

  added := _n;
  new_balance := _bal;
  return next;
end;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_card_transactions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_card_transactions(uuid) TO service_role;