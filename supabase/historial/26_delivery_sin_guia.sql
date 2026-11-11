-- =====================================================================
--  Actualización 26 · El delivery propio no necesita número de guía
--  La guía solo se pide en los envíos por empresa (MRW, Zoom, Tealca,
--  Domesa). En el delivery propio se puede escribir quién lo lleva, o
--  dejarlo vacío.
--  Ejecutar DESPUÉS de 25. Se puede ejecutar más de una vez.
-- =====================================================================
create or replace function public.despachar_pedido(pid bigint, p_transporte text, p_guia text) returns void
language plpgsql security definer set search_path = public as $$
declare o pedidos; v_local boolean := coalesce(p_transporte, '') = 'Delivery propio'; v_guia text := nullif(trim(coalesce(p_guia, '')), '');
begin
  perform _requiere_admin_de((select tienda_id from pedidos where id = pid));
  if not v_local and length(coalesce(v_guia, '')) < 4 then raise exception 'Escribe el número de guía que te dio la empresa de envíos.'; end if;
  update pedidos set estado = 'enviado', transporte = p_transporte, guia = left(v_guia, 80) where id = pid and estado = 'preparando' returning * into o;
  if not found then raise exception 'El pedido no está en preparación.'; end if;
  if v_local then
    perform _notificar(o.usuario_id, format('Tu pedido %s va en camino con nuestro delivery%s.', o.codigo, coalesce(' (lo lleva ' || o.guia || ')', '')));
    perform _log(format('Pedido %s despachado por delivery propio%s', o.codigo, coalesce(' · ' || o.guia, '')));
  else
    perform _notificar(o.usuario_id, format('Tu pedido %s fue enviado por %s. Guía %s.', o.codigo, p_transporte, o.guia));
    perform _log(format('Pedido %s despachado · guía %s', o.codigo, o.guia));
  end if;
end $$;
