-- =====================================================================
--  Actualización 24 · Arreglo al guardar los datos de la tienda
--  Supabase no permite un UPDATE sin WHERE cuando la orden llega desde la
--  página ("UPDATE requires a WHERE clause"). Al guardar la garantía, que
--  es común a todas las tiendas, la función actualizaba todas las filas
--  sin WHERE y el guardado fallaba. Ahora lleva su WHERE.
--  Ejecutar DESPUÉS de 23. Se puede ejecutar más de una vez.
-- =====================================================================

create or replace function public.actualizar_tienda(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare t int := coalesce((p->>'id')::int, mi_tienda_admin()); v_frases jsonb := p->'frases';
begin
  perform _requiere_admin_de(t);
  if t is null then raise exception 'Indica la tienda.'; end if;
  if length(trim(coalesce(p->>'nombre', ''))) < 2 then raise exception 'Escribe el nombre de la tienda.'; end if;
  if v_frases is not null and jsonb_typeof(v_frases) <> 'array' then raise exception 'Formato de frases no válido.'; end if;
  update tiendas set nombre = left(trim(p->>'nombre'), 60),
         eslogan = left(trim(coalesce(p->>'eslogan', '')), 120),
         frases = coalesce(v_frases, frases),
         logo_url = nullif(trim(coalesce(p->>'logo_url', logo_url, '')), ''),
         whatsapp = regexp_replace(coalesce(p->>'whatsapp', whatsapp), '[^0-9]', '', 'g'),
         correo = left(trim(coalesce(p->>'correo', correo)), 120),
         rif = left(upper(trim(coalesce(p->>'rif', rif))), 20),
         direccion = left(trim(coalesce(p->>'direccion', direccion)), 200),
         horario = left(trim(coalesce(p->>'horario', horario)), 120),
         representante = left(trim(coalesce(p->>'representante', representante)), 80),
         rep_cedula = left(upper(trim(coalesce(p->>'rep_cedula', rep_cedula))), 20),
         datos_pago = coalesce(p->'datos_pago', datos_pago), actualizado_en = now()
   where id = t;
  -- la garantía es la misma para las dos tiendas
  if nullif(trim(coalesce(p->>'garantia_cubre', '')), '') is not null or nullif(trim(coalesce(p->>'garantia_excluye', '')), '') is not null then
    update tiendas set garantia_cubre = left(trim(coalesce(nullif(trim(p->>'garantia_cubre'), ''), garantia_cubre)), 400),
                       garantia_excluye = left(trim(coalesce(nullif(trim(p->>'garantia_excluye'), ''), garantia_excluye)), 400)
     where id is not null;  -- la garantía es la misma en todas las tiendas
  end if;
  perform _log('Datos de la tienda actualizados');
end $$;
