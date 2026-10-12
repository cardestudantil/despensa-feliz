-- Acesso administrativo do Despensa Pacatito
-- Execute este arquivo no SQL Editor do projeto Supabase conectado ao aplicativo.
-- A autorização usa o e-mail vindo do JWT assinado pelo Supabase.

create or replace function public.is_despensa_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'beraldosjc@yahoo.com.br';
$$;

revoke all on function public.is_despensa_admin() from public;
grant execute on function public.is_despensa_admin() to authenticated;

alter table public.despensa enable row level security;

drop policy if exists "Admin full access to all despensas" on public.despensa;
create policy "Admin full access to all despensas"
on public.despensa
for all
to authenticated
using (public.is_despensa_admin())
with check (public.is_despensa_admin());
