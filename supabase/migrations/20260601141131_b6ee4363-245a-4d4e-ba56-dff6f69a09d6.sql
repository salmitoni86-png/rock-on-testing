ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS pin_hash text;