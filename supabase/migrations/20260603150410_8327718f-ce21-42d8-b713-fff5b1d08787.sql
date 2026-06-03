-- ===== Abuse prevention on profiles =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS warning_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE OR REPLACE FUNCTION public.is_banned(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT banned FROM public.profiles WHERE id = _uid), false)
$$;

-- ===== Warnings log =====
CREATE TABLE public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_warnings TO authenticated;
GRANT ALL ON public.user_warnings TO service_role;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warn own or admin view" ON public.user_warnings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- ===== Earning tips =====
CREATE TABLE public.earning_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text NOT NULL,
  hashtag text,
  kr_amount numeric NOT NULL DEFAULT 0,
  min_withdraw numeric NOT NULL DEFAULT 0,
  withdraw_multiplier numeric NOT NULL DEFAULT 1,
  click_count int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.earning_tips TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.earning_tips TO authenticated;
GRANT ALL ON public.earning_tips TO service_role;
ALTER TABLE public.earning_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips public read" ON public.earning_tips
  FOR SELECT USING (status = 'active');
CREATE POLICY "tips admin read all" ON public.earning_tips
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "tips insert own" ON public.earning_tips
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "tips owner or admin update" ON public.earning_tips
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "tips owner or admin delete" ON public.earning_tips
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'));

-- ===== Tip comments =====
CREATE TABLE public.earning_tip_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.earning_tip_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.earning_tip_comments TO authenticated;
GRANT ALL ON public.earning_tip_comments TO service_role;
ALTER TABLE public.earning_tip_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipc public read" ON public.earning_tip_comments
  FOR SELECT USING (true);
CREATE POLICY "tipc insert own" ON public.earning_tip_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "tipc owner or admin delete" ON public.earning_tip_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'));

-- ===== Tip ratings =====
CREATE TABLE public.earning_tip_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id uuid NOT NULL,
  user_id uuid NOT NULL,
  stars int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tip_id, user_id)
);
GRANT SELECT ON public.earning_tip_ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.earning_tip_ratings TO authenticated;
GRANT ALL ON public.earning_tip_ratings TO service_role;
ALTER TABLE public.earning_tip_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipr public read" ON public.earning_tip_ratings
  FOR SELECT USING (true);
CREATE POLICY "tipr insert own" ON public.earning_tip_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "tipr update own" ON public.earning_tip_ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "tipr delete own" ON public.earning_tip_ratings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ===== Click counter =====
CREATE OR REPLACE FUNCTION public.increment_tip_click(_tip_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.earning_tips SET click_count = click_count + 1
  WHERE id = _tip_id AND status = 'active';
$$;
GRANT EXECUTE ON FUNCTION public.increment_tip_click(uuid) TO anon, authenticated;