-- =====================================================================
--  Actualización 15 · Sin límite de cupo y avisos por correo
--  1. Ya no hay un monto máximo para financiar. Solo se bloquea pedir un
--     crédito nuevo si el cliente tiene cuotas vencidas o ya tiene el
--     máximo de créditos abiertos en esa tienda.
--  2. Cada aviso que el cliente recibe en "Notificaciones" (recordatorio
--     de cuota, mora, pago verificado, pedido enviado...) también le llega
--     por correo. Funciona cuando guardas la clave de Resend (ver LEEME,
--     "Avisos por correo"); mientras no exista la clave, no hace nada.
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

-- 2. Avisos por correo (Resend) -----------------------------------------
create extension if not exists pg_net;

create or replace function public._correo_aviso() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_key text; v_from text; v_email text; v_nombre text; v_txt text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null then return new; end if;                       -- aún no configurado
  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'correo_remitente' limit 1;
  select email, nombre into v_email, v_nombre from perfiles where id = new.usuario_id;
  if v_email is null then return new; end if;
  v_txt := replace(replace(replace(new.texto, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from', coalesce(v_from, 'Priority One y Papa''s Store <avisos@prioritynstore.com>'),
      'to', jsonb_build_array(v_email),
      'subject', 'Tienes un aviso en tu cuenta',
      'html', '<div style="font-family:Arial,sans-serif;font-size:15px;color:#151515;max-width:520px">'
           || '<p>Hola ' || coalesce(split_part(v_nombre, ' ', 1), '') || ',</p>'
           || '<p>' || v_txt || '</p>'
           || '<p><a href="https://prioritynstore.com/#cuenta" style="background:#C9A227;color:#111;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Ir a mi cuenta</a></p>'
           || '<p style="color:#777;font-size:12px">Priority One y Papa''s Store · prioritynstore.com</p></div>'));
  return new;
exception when others then
  return new;                                                     -- un correo fallido nunca bloquea la operación
end $$;

drop trigger if exists correo_aviso on public.notificaciones;
create trigger correo_aviso after insert on public.notificaciones for each row execute function public._correo_aviso();
revoke execute on function public._correo_aviso() from public, anon, authenticated;
