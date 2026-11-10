-- =====================================================================
--  Actualización 11 · Tiendas 100% online y planes de cuotas editables
--  1. Las tiendas no tienen local: se quita "Retiro en tienda" y
--     "Efectivo en tienda". Los pedidos se envían (delivery o nacional).
--  2. El administrador puede crear o quitar planes de cuotas (por ejemplo
--     2, 4 o 12 cuotas) con su recargo, desde Configuración.
--  Ejecutar DESPUÉS de 10_cuotas_por_equipo.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Sin retiro ni efectivo -------------------------------------------
update public.configuracion set envio = envio - 'retiro', datos_pago = datos_pago - 'efectivo' where id = 1;
update public.tiendas set datos_pago = coalesce(datos_pago, '{}'::jsonb) - 'efectivo', direccion = '';

-- la frase de Papa's Store hablaba de retirar en la tienda
update public.tiendas
   set frases = '[{"k":"Papa''s Store","t":"Pagas hoy,<br><em>te lo enviamos.</em>","p":"Compra de contado y recíbelo en tu casa o por envío nacional."},{"k":"Papa''s Store","t":"El precio que ves<br><em>es el que pagas.</em>","p":"Sin intereses ni recargos: pagas el equipo completo y listo."}]'::jsonb
 where id = 2 and frases::text like '%retíralo en la tienda%';

create or replace function public._solo_online() returns trigger
language plpgsql as $$
begin
  if new.envio_metodo = 'retiro' then raise exception 'Las tiendas son solo online: elige delivery o envío nacional.'; end if;
  if new.metodo_pago = 'efectivo' then raise exception 'Las tiendas son solo online: elige pago móvil, transferencia o Zelle.'; end if;
  return new;
end $$;
drop trigger if exists solo_online on public.pedidos;
create trigger solo_online before insert on public.pedidos for each row execute function public._solo_online();

-- el pago en caja ya no aplica
revoke execute on function public.pago_en_caja from authenticated, anon;

-- 2. Planes de cuotas editables ----------------------------------------
create or replace function public.actualizar_config(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare k text; v text; v_planes jsonb := p->'planes';
begin
  perform _requiere_admin();
  if (p->>'tasa')::numeric <= 0 or (p->>'mora')::numeric < 0 or (p->>'inicial_min')::numeric not between 0 and 0.9
     or (p->>'min_financiable')::numeric < 0 or (p->>'cupo_base')::numeric < 0 then
    raise exception 'Revisa los valores de la configuración.';
  end if;
  if v_planes is not null then
    if jsonb_typeof(v_planes) <> 'object' or v_planes = '{}'::jsonb then raise exception 'Deja al menos un plan de cuotas.'; end if;
    for k, v in select * from jsonb_each_text(v_planes) loop
      if k !~ '^\d{1,2}$' or k::int not between 1 and 36 then raise exception 'El número de cuotas debe estar entre 1 y 36.'; end if;
      if v::numeric not between 0 and 1 then raise exception 'El recargo del plan de % cuotas debe estar entre 0%% y 100%%.', k; end if;
    end loop;
  end if;
  perform _usar_tienda(mi_tienda_admin());
  update configuracion set tasa = (p->>'tasa')::numeric, mora = (p->>'mora')::numeric,
         inicial_min = (p->>'inicial_min')::numeric, min_financiable = (p->>'min_financiable')::numeric,
         cupo_base = (p->>'cupo_base')::numeric, planes = coalesce(v_planes, planes), actualizado_en = now()
   where id = 1;
  if v_planes is not null then
    -- los equipos que tenían un plan que ya no existe lo pierden; si se quedan sin ninguno, usan todos
    update productos pr set planes = nullif(array(select x from unnest(pr.planes) x where v_planes ? x::text order by x), '{}')
     where pr.planes is not null and exists (select 1 from unnest(pr.planes) x where not v_planes ? x::text);
  end if;
  perform _log(format('Configuración común actualizada (tasa %s, mora %s%s)', p->>'tasa', p->>'mora',
    case when v_planes is not null then ', planes ' || (select string_agg(key, '/' order by key::int) from jsonb_object_keys(v_planes) key) else '' end));
end $$;
