
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_card() from public, anon, authenticated;
revoke execute on function public.is_card_member(uuid, uuid) from public, anon;
revoke execute on function public.is_card_owner(uuid, uuid) from public, anon;
