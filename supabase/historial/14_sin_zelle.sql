-- =====================================================================
--  Actualización 14 · Sin Zelle
--  Las tiendas cobran solo en bolívares: pago móvil y transferencia.
--  Ejecutar DESPUÉS de 13_frases.sql. Se puede ejecutar más de una vez.
-- =====================================================================
update public.tiendas set datos_pago = coalesce(datos_pago, '{}'::jsonb) - 'zelle' - 'efectivo';
update public.configuracion set datos_pago = coalesce(datos_pago, '{}'::jsonb) - 'zelle' - 'efectivo' where id = 1;

create or replace function public._solo_online() returns trigger
language plpgsql as $$
begin
  if new.envio_metodo = 'retiro' then raise exception 'Las tiendas son solo online: elige delivery o envío nacional.'; end if;
  if new.metodo_pago in ('efectivo', 'zelle') then raise exception 'Elige pago móvil o transferencia.'; end if;
  return new;
end $$;

-- los comprobantes también: solo pago móvil o transferencia
create or replace function public._pago_metodo() returns trigger
language plpgsql as $$
begin
  if new.metodo = 'zelle' then raise exception 'Elige pago móvil o transferencia.'; end if;
  return new;
end $$;
drop trigger if exists pago_metodo on public.pagos;
create trigger pago_metodo before insert on public.pagos for each row execute function public._pago_metodo();
