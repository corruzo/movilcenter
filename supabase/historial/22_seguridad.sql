-- =====================================================================
--  Actualización 22 · Refuerzo de seguridad
--  La tienda maneja datos sensibles (cédulas, fotos de identidad,
--  comprobantes, deudas). Este archivo cierra todo lo que no hace falta:
--   1. RLS activo en todas las tablas.
--   2. Nadie escribe directo en las tablas desde la página: toda
--      escritura pasa por funciones que validan quién la pide.
--   3. Los visitantes sin cuenta solo leen el catálogo, las tiendas y la
--      configuración pública; nada de clientes, pedidos ni pagos.
--   4. Las funciones internas no se pueden llamar desde la página.
--   5. Las fotos de identidad y los comprobantes son privados.
--  Ejecutar DESPUÉS de 21_gama_accesorios_bs.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. RLS en todas las tablas --------------------------------------------
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' loop
    execute format('alter table public.%I enable row level security', r.relname);
    -- sin FORCE: las funciones seguras (dueñas de las tablas) siguen pudiendo escribir
    execute format('alter table public.%I no force row level security', r.relname);
  end loop;
end $$;

-- 2. Sin escritura directa ------------------------------------------------
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke usage, select, update on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

-- 3. Visitantes sin cuenta: solo lo público --------------------------------
revoke select on all tables in schema public from anon;
grant select on public.productos, public.tiendas, public.configuracion to anon;
alter default privileges in schema public revoke select on tables from anon;
-- los clientes con cuenta leen solo sus filas (lo decide RLS)
grant select on all tables in schema public to authenticated;

-- 4. Funciones internas fuera del alcance de la página ---------------------
--    Los visitantes solo pueden: ver la fecha, postularse a un empleo y
--    hacer un encargo (y las comprobaciones que usa el catálogo).
do $$
declare r record;
  publicas text[] := array['hoy','postular','encargar','es_admin','es_admin_de'];
begin
  for r in select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) args
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f' loop
    if r.proname = any(publicas) then
      execute format('grant execute on function public.%I(%s) to anon, authenticated', r.proname, r.args);
    else
      if has_function_privilege('authenticated', r.oid, 'execute') and r.proname !~ '^_' then
        execute format('grant execute on function public.%I(%s) to authenticated', r.proname, r.args);
      end if;
      execute format('revoke execute on function public.%I(%s) from public, anon', r.proname, r.args);
    end if;
  end loop;
end $$;
-- las funciones que se creen después no quedan abiertas a visitantes
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public grant execute on functions to authenticated;

-- las funciones que usan las reglas de acceso deben poder ejecutarse con sesión
grant execute on function public._cliente_de_mi_tienda(uuid) to authenticated;
grant execute on function public._cliente_de_mi_tienda_txt(text) to authenticated;
grant execute on function public._ve_financiamiento(int) to authenticated;
grant execute on function public.mi_tienda_admin() to authenticated;
grant execute on function public.es_admin_general() to authenticated;

-- 5. Archivos privados ----------------------------------------------------
update storage.buckets set public = false where id in ('documentos', 'comprobantes');
update storage.buckets set public = true  where id = 'productos';
