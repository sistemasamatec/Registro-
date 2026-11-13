-- AMA TEC · Oficina — esquema da base de dados (Supabase / PostgreSQL)
-- Projecto SEPARADO do ERP. Executar uma vez no SQL Editor do Supabase.

-- ---------------------------------------------------------------------
-- Perfis (um por utilizador do Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null default '',
  role       text not null default 'tecnico' check (role in ('admin','tecnico')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and active) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin') $$;

-- O primeiro utilizador criado fica administrador; os seguintes ficam técnicos.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_user boolean := not exists (select 1 from public.profiles);
begin
  -- só o primeiro utilizador entra activo (administrador); os outros ficam inactivos até o administrador os activar
  insert into public.profiles (id, email, name, role, active)
  values (
    new.id, lower(new.email),
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    case when first_user then 'admin' else 'tecnico' end,
    first_user
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nunca deixar a oficina sem administrador activo.
create or replace function public.keep_one_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and old.active and (new.role <> 'admin' or not new.active) then
    if not exists (select 1 from public.profiles where id <> old.id and role = 'admin' and active) then
      raise exception 'Tem de existir pelo menos um administrador activo.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_keep_one_admin on public.profiles;
create trigger profiles_keep_one_admin before update on public.profiles
  for each row execute function public.keep_one_admin();

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active());
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, role, active) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Registos: relatórios, equipamentos, ordens de serviço, clientes, tipos
-- (cada linha guarda o registo completo em JSON)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['reports','equipamentos','ordens','clientes','tipos'] loop
    execute format($f$create table if not exists public.%I (
      key        text primary key,
      data       jsonb not null,
      saved_at   timestamptz not null default now(),
      created_by uuid default auth.uid()
    )$f$, t);
    execute format('create index if not exists %I on public.%I (saved_at desc)', t || '_saved_at_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_active())', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_active())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_active()) with check (public.is_active())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

alter table public.reports      drop constraint if exists reports_key_ck;
alter table public.reports      add  constraint reports_key_ck      check (key ~ '^[A-Z0-9]{2,4}-[0-9]{4,}$');
alter table public.equipamentos drop constraint if exists equipamentos_key_ck;
alter table public.equipamentos add  constraint equipamentos_key_ck check (key ~ '^EQ-[0-9]{4,}$');
alter table public.ordens       drop constraint if exists ordens_key_ck;
alter table public.ordens       add  constraint ordens_key_ck       check (key ~ '^OS-[0-9]{4,}$');
alter table public.clientes     drop constraint if exists clientes_key_ck;
alter table public.clientes     add  constraint clientes_key_ck     check (key ~ '^CL-[0-9]{4,}$');
alter table public.tipos        drop constraint if exists tipos_key_ck;
alter table public.tipos        add  constraint tipos_key_ck        check (key ~ '^[A-Z0-9]{2,4}$');

-- ---------------------------------------------------------------------
-- Numeração automática (sem repetições, mesmo com várias pessoas ao mesmo tempo)
-- ---------------------------------------------------------------------
create table if not exists public.counters (
  prefix text primary key check (prefix ~ '^[A-Z0-9]{2,4}$'),
  last   integer not null default 0
);
alter table public.counters enable row level security;      -- sem políticas: só as funções acedem
revoke all on public.counters from anon, authenticated;

create or replace function public.next_number(p text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.is_active() then raise exception 'Sem acesso' using errcode = '42501'; end if;
  if p !~ '^[A-Z0-9]{2,4}$' then raise exception 'Prefixo inválido'; end if;
  insert into public.counters (prefix, last) values (p, 1)
  on conflict (prefix) do update set last = public.counters.last + 1
  returning last into n;
  return n;
end $$;

-- usada ao importar uma cópia de segurança, para a numeração continuar depois do maior número importado
create or replace function public.bump_counter(p text, n integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Só administradores' using errcode = '42501'; end if;
  if p !~ '^[A-Z0-9]{2,4}$' then raise exception 'Prefixo inválido'; end if;
  insert into public.counters (prefix, last) values (p, greatest(n,0))
  on conflict (prefix) do update set last = greatest(public.counters.last, excluded.last);
end $$;

revoke all on function public.next_number(text)          from public, anon;
revoke all on function public.bump_counter(text, integer) from public, anon;
grant execute on function public.next_number(text)          to authenticated;
grant execute on function public.bump_counter(text, integer) to authenticated;

-- funções internas: não expostas pela API
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.keep_one_admin()  from public, anon, authenticated;
revoke all on function public.is_active()       from public, anon;
revoke all on function public.is_admin()        from public, anon;
grant execute on function public.is_active() to authenticated;
grant execute on function public.is_admin()  to authenticated;
