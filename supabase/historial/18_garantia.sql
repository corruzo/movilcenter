-- =====================================================================
--  Actualización 18 · Política de garantía de cada tienda
--  Tomada de la factura de Priority One. Es la misma para las dos tiendas;
--  se cambia en Panel → Configuración (desde cualquiera de los dos paneles). Aparece en la ficha de cada equipo, en los
--  términos y condiciones y en el contrato.
--  Ejecutar DESPUÉS de 17_frecuencia_y_contrato.sql. Se puede ejecutar más de una vez.
-- =====================================================================
alter table public.tiendas add column if not exists garantia_cubre text not null
  default '60 días por fallas ocultas (bocina, cámaras, pantalla y pin de carga).';
alter table public.tiendas add column if not exists garantia_excluye text not null
  default 'Equipos que ingresen mojados, quemados, partidos, con caídas o manipulados por otro técnico sin nuestra autorización.';

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
                       garantia_excluye = left(trim(coalesce(nullif(trim(p->>'garantia_excluye'), ''), garantia_excluye)), 400);
  end if;
  perform _log('Datos de la tienda actualizados');
end $$;
