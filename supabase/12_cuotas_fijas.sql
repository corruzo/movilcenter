-- =====================================================================
--  Actualización 12 · El administrador fija las cuotas de cada equipo
--  Cada equipo se paga en UN número de cuotas que elige el admin de la
--  tienda (el cliente no lo elige). Si un equipo no lo tiene definido,
--  se le asigna el plan intermedio (6 cuotas si existe).
--  También cambia las frases de portada de Priority One por mensajes de
--  confianza, sin mencionar plazos.
--  Ejecutar DESPUÉS de 11_online_y_planes.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- plan que se usa cuando un equipo no tiene uno propio
create or replace function public._plan_defecto() returns int
language sql stable security definer set search_path = public as $$
  select case when c.planes ? '6' then 6 else
         (select k::int from jsonb_object_keys(c.planes) k order by k::int
           offset (select count(*) / 2 from jsonb_object_keys(c.planes)) limit 1) end
    from configuracion c where c.id = 1
$$;

-- cada equipo queda con exactamente un plan válido
create or replace function public._un_plan() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v int;
begin
  select x into v from unnest(coalesce(new.planes, '{}')) x where cfg.planes ? x::text order by x limit 1;
  new.planes := array[coalesce(v, _plan_defecto())];
  return new;
end $$;
drop trigger if exists un_plan on public.productos;
create trigger un_plan before insert or update of planes on public.productos for each row execute function public._un_plan();

-- equipos actuales: se quedan con su primer plan (o el plan intermedio)
update public.productos set planes = planes;

-- al quitar una opción en Configuración, los equipos que la usaban pasan al plan intermedio
create or replace function public._planes_config() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.planes is distinct from old.planes then
    update productos pr set planes = null where not (new.planes ? pr.planes[1]::text);
  end if;
  return new;
end $$;
drop trigger if exists planes_config on public.configuracion;
create trigger planes_config after update of planes on public.configuracion for each row execute function public._planes_config();

-- el admin elige un solo número de cuotas por equipo
create or replace function public.ajustar_financiamiento(pid int, p_inicial numeric, p_planes jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_nom text; v_n int;
begin
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  if p_inicial is not null and (p_inicial < 0 or p_inicial > cfg.inicial_max) then
    raise exception 'La inicial debe estar entre 0 y %.', round(cfg.inicial_max*100) || '%'; end if;
  if p_planes is not null then
    if jsonb_typeof(p_planes) <> 'array' or jsonb_array_length(p_planes) <> 1 then
      raise exception 'Elige un solo número de cuotas para el equipo.'; end if;
    v_n := (p_planes->>0)::int;
    if not (cfg.planes ? v_n::text) then raise exception 'La opción de % cuotas no existe en Configuración.', v_n; end if;
  end if;
  update productos set inicial_min = p_inicial, planes = case when v_n is null then null else array[v_n] end
   where id = pid returning nombre, planes[1] into v_nom, v_n;
  perform _log(format('Financiamiento de %s: inicial %s, %s cuotas', v_nom,
    coalesce(round(p_inicial*100)::text || '%', 'general'), v_n));
end $$;

revoke execute on function public._plan_defecto() from public, anon;
revoke execute on function public._un_plan() from public, anon, authenticated;
revoke execute on function public._planes_config() from public, anon, authenticated;

-- frases de portada de Priority One: confianza, sin plazos
update public.tiendas
   set frases = '[{"k":"Priority One","t":"Compra con<br><em>confianza.</em>","p":"Equipos nuevos y sellados, con garantía y atención directa por WhatsApp."},{"k":"Priority One","t":"Una tienda<br><em>que responde.</em>","p":"Te acompañamos antes y después de la compra, y cada pago queda registrado en tu cuenta."}]'::jsonb
 where id = 1;
