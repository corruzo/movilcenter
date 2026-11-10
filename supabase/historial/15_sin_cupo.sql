-- =====================================================================
--  Actualización 15 · Sin límite de cupo
--  Ya no hay un monto máximo para financiar. Solo se bloquea pedir un
--     crédito nuevo si el cliente tiene cuotas vencidas o ya tiene el
--     máximo de créditos abiertos en esa tienda.
--  Ejecutar DESPUÉS de 14_sin_zelle.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Sin límite de cupo -------------------------------------------------
create or replace function public._elegibilidad(uid uuid, financiado numeric) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare cfg configuracion := _cfg(); t int := _tienda_actual(); liquidados int; usado numeric; activos int; mora boolean; motivos text[] := '{}';
begin
  select count(*) into liquidados from creditos where usuario_id = uid and estado = 'liquidado' and (t is null or tienda_id = t);
  select coalesce(sum(case when c.estado = 'evaluacion' then c.monto_financiado
                           else (select coalesce(sum(q.monto), 0) from cuotas q where q.credito_id = c.id and q.estado <> 'pagada') end), 0),
         count(*) filter (where c.estado in ('evaluacion','activo','en_mora'))
    into usado, activos
    from creditos c where c.usuario_id = uid and c.estado in ('evaluacion','activo','en_mora') and (t is null or c.tienda_id = t);
  select coalesce(bool_or(estado = 'en_mora'), false) into mora from creditos where usuario_id = uid;
  if mora then motivos := array_append(motivos, 'Tienes un crédito con cuotas vencidas. Ponte al día para solicitar uno nuevo.'::text); end if;
  if activos >= cfg.max_creditos then motivos := array_append(motivos, format('Ya tienes %s créditos abiertos en esta tienda (máximo %s).', activos, cfg.max_creditos)); end if;
  return jsonb_build_object('limite', null, 'usado', round(usado, 2), 'disponible', null,
                            'activos', activos, 'en_mora', mora, 'liquidados', liquidados,
                            'ok', cardinality(motivos) = 0, 'motivos', to_jsonb(motivos));
end $$;

-- (Los avisos por correo se descartaron: los recordatorios se envían por WhatsApp desde el panel.)
drop trigger if exists correo_aviso on public.notificaciones;
drop function if exists public._correo_aviso();
