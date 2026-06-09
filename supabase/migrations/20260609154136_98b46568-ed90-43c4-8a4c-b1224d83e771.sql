DROP POLICY IF EXISTS "Members can view their cards" ON public.cards;
CREATE POLICY "Members can view their cards"
ON public.cards
FOR SELECT
TO authenticated
USING (owner_id = auth.uid() OR is_card_member(id, auth.uid()));