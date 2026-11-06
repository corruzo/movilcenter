-- =====================================================================
--  Actualización 19 · Sexo del cliente en el registro (Masculino / Femenino)
--  Ejecutar DESPUÉS de 18_garantia.sql. Se puede ejecutar más de una vez.
-- =====================================================================
alter table public.perfiles add column if not exists sexo text;
alter table public.perfiles drop constraint if exists perfiles_sexo_check;
alter table public.perfiles add constraint perfiles_sexo_check check (sexo is null or sexo in ('M','F'));

-- se toma de lo que el cliente marcó al crear la cuenta (corre después de crear el perfil)
create or replace function public._sexo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v text := upper(left(coalesce(new.raw_user_meta_data->>'sexo', ''), 1));
begin
  if v in ('M','F') then update perfiles set sexo = v where id = new.id; end if;
  return new;
end $$;
drop trigger if exists zz_sexo_usuario on auth.users;
create trigger zz_sexo_usuario after insert on auth.users for each row execute function public._sexo_usuario();
revoke execute on function public._sexo_usuario() from public, anon, authenticated;
