
-- Extend profiles
alter table public.profiles
  add column if not exists phone text,
  add column if not exists contact_email text,
  add column if not exists telegram text,
  add column if not exists whatsapp text,
  add column if not exists snapchat text,
  add column if not exists discord text,
  add column if not exists referred_by_code text;

-- Update handle_new_user to also capture referral code + accept invitation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  n int := 0;
  ref_code text;
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

  ref_code := lower(coalesce(new.raw_user_meta_data->>'ref_code', ''));
  if ref_code = '' then ref_code := null; end if;

  insert into public.profiles (id, username, display_name, referred_by_code)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate), ref_code);

  if ref_code is not null then
    update public.invitations
       set status = 'accepted',
           accepted_at = now(),
           accepted_by = new.id
     where code = ref_code
       and status = 'pending'
       and accepted_by is null;
  end if;

  return new;
end;
$$;

-- Ensure trigger exists on auth.users
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;
