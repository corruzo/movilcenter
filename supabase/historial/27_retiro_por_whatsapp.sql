-- =====================================================================
--  Actualización 27 · Retiro personal, acordado por WhatsApp
--  Las tiendas no tienen local fijo, así que el cliente puede elegir
--  "Retiro personal": no paga envío y acuerda por WhatsApp con la tienda
--  dónde y cuándo retirar. Flujo del pedido:
--    Preparando → Listo para retirar (lo marca el admin) → Entregado.
--  Ejecutar DESPUÉS de 26. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. la opción vuelve a la lista de entregas
update public.configuracion
   set envio = envio || jsonb_build_object('retiro', jsonb_build_object(
         'nombre', 'Retiro personal', 'costo', 0,
         'detalle', 'Sin costo de envío. Acordamos contigo por WhatsApp dónde y cuándo lo retiras.'))
 where id = 1;

-- 2. ya no se bloquea el retiro (solo se mantiene fuera Zelle)
create or replace function public._solo_online() returns trigger
language plpgsql as $$
begin
  if new.metodo_pago = 'zelle' then raise exception 'Elige pago móvil, transferencia, efectivo o USDT.'; end if;
  return new;
end $$;

-- 3. el admin avisa que el pedido está listo para retirar
create or replace function public.marcar_listo_retiro(pid bigint) returns void
language plpgsql security definer set search_path = public as $$
declare o pedidos;
begin
  perform _requiere_admin_de((select tienda_id from pedidos where id = pid));
  update pedidos set estado = 'listo_retiro'
   where id = pid and estado = 'preparando' and envio_metodo = 'retiro' returning * into o;
  if not found then raise exception 'Ese pedido no es de retiro o no está en preparación.'; end if;
  perform _notificar(o.usuario_id, format('Tu pedido %s está listo. Escríbenos por WhatsApp para acordar dónde y cuándo lo retiras.', o.codigo));
  perform _log(format('Pedido %s listo para retirar', o.codigo));
end $$;
revoke execute on function public.marcar_listo_retiro(bigint) from public, anon;
grant execute on function public.marcar_listo_retiro(bigint) to authenticated;

-- 4. un pedido de retiro no se "despacha"
create or replace function public._no_despachar_retiro() returns trigger
language plpgsql as $$
begin
  if new.estado = 'enviado' and new.envio_metodo = 'retiro' then
    raise exception 'Este pedido es de retiro: márcalo como "Listo para retirar".';
  end if;
  return new;
end $$;
drop trigger if exists no_despachar_retiro on public.pedidos;
create trigger no_despachar_retiro before update of estado on public.pedidos
  for each row execute function public._no_despachar_retiro();
revoke execute on function public._no_despachar_retiro() from public, anon, authenticated;
