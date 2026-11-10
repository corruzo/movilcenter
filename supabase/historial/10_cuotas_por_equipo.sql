-- =====================================================================
--  Actualización 10 · Inicial y cuotas por equipo
--  Cada admin puede fijar, para cada teléfono de su tienda, el porcentaje
--  mínimo de inicial y en cuántas cuotas se puede pagar (3, 6 o 9).
--  Si un equipo no tiene valores propios, usa los de la configuración común.
--  Ejecutar DESPUÉS de 09_encargos.sql. Se puede ejecutar más de una vez.
-- =====================================================================
alter table public.productos add column if not exists inicial_min numeric(5,4);
alter table public.productos add column if not exists planes int[];

drop function if exists public.ajustar_financiamiento(int, numeric, int[]);
create or replace function public.ajustar_financiamiento(pid int, p_inicial numeric, p_planes jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_nom text; x int; v_planes int[];
begin
  if p_planes is not null and jsonb_typeof(p_planes) = 'array' then
    select array_agg(value::int) into v_planes from jsonb_array_elements_text(p_planes);
    v_planes := coalesce(v_planes, '{}');
  end if;
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  if p_inicial is not null and (p_inicial < 0 or p_inicial > cfg.inicial_max) then
    raise exception 'La inicial debe estar entre 0 y %.', round(cfg.inicial_max*100) || '%'; end if;
  if v_planes is not null then
    if cardinality(v_planes) = 0 then raise exception 'Elige al menos un plan de cuotas, o marca el equipo como solo de contado.'; end if;
    foreach x in array v_planes loop
      if not (cfg.planes ? x::text) then raise exception 'El plan de % cuotas no existe en la configuración común.', x; end if;
    end loop;
  end if;
  update productos set inicial_min = p_inicial, planes = (select array_agg(distinct v order by v) from unnest(v_planes) v)
   where id = pid returning nombre into v_nom;
  perform _log(format('Financiamiento de %s: inicial %s, cuotas %s', v_nom,
    coalesce(round(p_inicial*100)::text || '%', 'general'), coalesce(array_to_string(v_planes, ', '), 'todas')));
end $$;

-- Al crear un crédito se respetan la inicial y las cuotas de cada equipo del pedido
create or replace function public._chk_credito_equipo() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_ini numeric; v_nom text;
begin
  select max(coalesce(pr.inicial_min, cfg.inicial_min)) into v_ini
    from pedido_items i join productos pr on pr.id = i.producto_id where i.pedido_id = new.pedido_id;
  if v_ini is not null and new.inicial_pct + 0.00001 < v_ini then
    raise exception 'La inicial mínima para este pedido es del %.', round(v_ini*100) || '%'; end if;
  select pr.nombre into v_nom from pedido_items i join productos pr on pr.id = i.producto_id
   where i.pedido_id = new.pedido_id and pr.planes is not null and not (new.n_cuotas = any(pr.planes)) limit 1;
  if v_nom is not null then raise exception '% no se vende en % cuotas.', v_nom, new.n_cuotas; end if;
  return new;
end $$;
drop trigger if exists chk_credito_equipo on public.creditos;
create trigger chk_credito_equipo before insert on public.creditos for each row execute function public._chk_credito_equipo();

revoke execute on function public._chk_credito_equipo() from public, anon, authenticated;
revoke execute on function public.ajustar_financiamiento(int, numeric, jsonb) from public, anon;
grant execute on function public.ajustar_financiamiento(int, numeric, jsonb) to authenticated;
