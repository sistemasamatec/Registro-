-- Chamada leve usada pelo GitHub (todos os dias) para o projecto grátis não ser pausado por falta de uso.
create or replace function public.ping() returns timestamptz
language sql stable security invoker set search_path = public as $$ select now() $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
