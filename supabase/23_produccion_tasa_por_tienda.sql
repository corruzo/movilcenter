-- =====================================================================
--  Actualización 23 · Acabado de producción y funciones separadas por tienda
--   1. Cada tienda tiene SU tasa para pagos en bolívares y SU ajuste en Bs.
--      Ningún administrador puede cambiar la tasa de la otra tienda.
--      Cada cambio queda en un historial de tasas (para la contabilidad).
--      Cada pago guarda la tasa de la tienda que lo recibe.
--   2. Las reglas de financiamiento (mora, inicial, planes) solo las cambia
--      la tienda que vende en cuotas.
--   3. Se quitan los datos de ejemplo: cupón de prueba, datos bancarios de
--      ejemplo, envío gratis automático y frases que mencionaban Zelle.
--   4. Se guarda cuándo y qué versión de los Términos de uso y la Política
--      de privacidad aceptó cada cliente al crear su cuenta.
--  Ejecutar DESPUÉS de 22_seguridad.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Tasa por tienda ------------------------------------------------------
alter table public.tiendas add column if not exists tasa numeric(14,4);
alter table public.tiendas add column if not exists recargo_bs numeric(5,4) not null default 0;
alter table public.tiendas add column if not exists tasa_actualizada_en timestamptz;
alter table public.tiendas drop constraint if exists tiendas_tasa_check;
alter table public.tiendas add constraint tiendas_tasa_check check ((tasa is null or tasa > 0) and recargo_bs between 0 and 1);

-- si la tienda ya estaba en uso, conserva la tasa que tenía; si es nueva,
-- queda vacía hasta que el administrador publique la suya
update public.tiendas t
   set tasa = c.tasa, recargo_bs = c.recargo_bs, tasa_actualizada_en = c.actualizado_en
  from public.configuracion c
 where c.id = 1 and t.tasa is null and exists (select 1 from public.pagos);

create table if not exists public.tasas_historial (
  id          bigint generated always as identity primary key,
  tienda_id   int not null references public.tiendas(id),
  tasa        numeric(14,4) not null check (tasa > 0),
  recargo_bs  numeric(5,4) not null default 0,
  usuario_id  uuid,
  actor       text not null default 'Sistema',
  creado_en   timestamptz not null default now()
);
create index if not exists tasas_historial_tienda_idx on public.tasas_historial(tienda_id, creado_en desc);
alter table public.tasas_historial enable row level security;
drop policy if exists ver_tasas on public.tasas_historial;
create policy ver_tasas on public.tasas_historial for select using (es_admin_de(tienda_id));
revoke all on public.tasas_historial from anon;
revoke insert, update, delete, truncate on public.tasas_historial from authenticated;
grant select on public.tasas_historial to authenticated;

-- el administrador publica la tasa de SU tienda
create or replace function public.actualizar_tasa(p_tasa numeric, p_recargo numeric default null, p_tienda int default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_t int := coalesce(mi_tienda_admin(), p_tienda); v_rec numeric; v_nom text; v_actor text;
begin
  if v_t is null then raise exception 'Elige la tienda.'; end if;
  perform _requiere_admin_de(v_t);
  if p_tasa is null or p_tasa <= 0 or p_tasa > 100000000 then raise exception 'Escribe una tasa válida (Bs por cada dólar).'; end if;
  select coalesce(p_recargo, recargo_bs), nombre into v_rec, v_nom from tiendas where id = v_t;
  if v_rec < 0 or v_rec > 1 then raise exception 'El ajuste para pagos en bolívares debe estar entre 0%% y 100%%.'; end if;
  update tiendas set tasa = round(p_tasa, 4), recargo_bs = round(v_rec, 4), tasa_actualizada_en = now(), actualizado_en = now() where id = v_t;
  select nombre into v_actor from perfiles where id = auth.uid();
  insert into tasas_historial(tienda_id, tasa, recargo_bs, usuario_id, actor) values (v_t, round(p_tasa, 4), round(v_rec, 4), auth.uid(), coalesce(v_actor, 'Administrador'));
  perform _usar_tienda(v_t);
  perform _log(format('Tasa de %s: Bs %s por dólar, ajuste en Bs %s%%', v_nom, round(p_tasa, 2), round(v_rec*100, 2)));
end $$;
revoke execute on function public.actualizar_tasa(numeric, numeric, int) from public, anon;
grant execute on function public.actualizar_tasa(numeric, numeric, int) to authenticated;

-- cada pago guarda la tasa y el ajuste de la tienda que lo recibe
create or replace function public._pago_tasa() returns trigger
language plpgsql security definer set search_path = public as $$
declare t tiendas;
begin
  select * into t from tiendas where id = new.tienda_id;
  if new.moneda = 'VES' then
    if t.tasa is null then raise exception '% todavía no publicó su tasa para pagos en bolívares. Paga en dólares o escríbele por WhatsApp.', coalesce(t.nombre, 'La tienda'); end if;
    new.tasa := t.tasa; new.recargo_bs := t.recargo_bs;
  else
    new.tasa := coalesce(t.tasa, new.tasa, 1); new.recargo_bs := 0;
  end if;
  return new;
end $$;
drop trigger if exists pago_recargo on public.pagos;
drop trigger if exists pago_zz_tasa on public.pagos;
-- se llama "pago_zz_..." para correr después de "pago_tienda", que asigna la tienda
create trigger pago_zz_tasa before insert on public.pagos for each row execute function public._pago_tasa();
revoke execute on function public._pago_tasa() from public, anon, authenticated;

-- 2. Reglas de financiamiento: solo la tienda que vende en cuotas ----------
create or replace function public.actualizar_config(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare k text; v text; v_planes jsonb := p->'planes'; v_t int := mi_tienda_admin();
begin
  perform _requiere_admin();
  if not (es_admin_general() or exists (select 1 from tiendas where id = v_t and acepta_cuotas)) then
    raise exception 'Las reglas de financiamiento las administra la tienda que vende en cuotas.';
  end if;
  if (p->>'mora')::numeric < 0 or (p->>'inicial_min')::numeric not between 0 and 0.9
     or (p->>'min_financiable')::numeric < 0 or coalesce((p->>'cupo_base')::numeric, 0) < 0 then
    raise exception 'Revisa los valores de la configuración.';
  end if;
  if v_planes is not null then
    if jsonb_typeof(v_planes) <> 'object' or v_planes = '{}'::jsonb then raise exception 'Deja al menos un plan de cuotas.'; end if;
    for k, v in select * from jsonb_each_text(v_planes) loop
      if k !~ '^\d{1,2}$' or k::int not between 1 and 36 then raise exception 'El número de cuotas debe estar entre 1 y 36.'; end if;
      if v::numeric not between 0 and 1 then raise exception 'El recargo del plan de % cuotas debe estar entre 0%% y 100%%.', k; end if;
    end loop;
  end if;
  perform _usar_tienda(v_t);
  update configuracion set mora = (p->>'mora')::numeric,
         inicial_min = (p->>'inicial_min')::numeric, min_financiable = (p->>'min_financiable')::numeric,
         cupo_base = coalesce((p->>'cupo_base')::numeric, cupo_base), planes = coalesce(v_planes, planes), actualizado_en = now()
   where id = 1;
  if v_planes is not null then
    update productos pr set planes = nullif(array(select x from unnest(pr.planes) x where v_planes ? x::text order by x), '{}')
     where pr.planes is not null and exists (select 1 from unnest(pr.planes) x where not v_planes ? x::text);
  end if;
  perform _log(format('Reglas de financiamiento actualizadas (mora %s, inicial %s%%%s)', p->>'mora', round((p->>'inicial_min')::numeric*100),
    case when v_planes is not null then ', planes ' || (select string_agg(key, '/' order by key::int) from jsonb_object_keys(v_planes) key) else '' end));
end $$;
revoke execute on function public.actualizar_config(jsonb) from public, anon;
grant execute on function public.actualizar_config(jsonb) to authenticated;

-- 3. Sin datos de ejemplo -------------------------------------------------
update public.configuracion set cupon_codigo = null where cupon_codigo = 'BIENVENIDO5';
alter table public.configuracion alter column cupon_codigo set default null;
update public.configuracion set datos_pago = '{}'::jsonb where datos_pago::text like '%0000%';
alter table public.configuracion alter column datos_pago set default '{}'::jsonb;
-- el envío nacional gratis desde $300 era un valor de ejemplo: queda desactivado
update public.configuracion set envio_gratis_desde = 999999 where envio_gratis_desde = 300;
alter table public.configuracion alter column envio_gratis_desde set default 999999;
-- frase de Papa's Store que mencionaba Zelle
update public.tiendas
   set frases = jsonb_set(frases, '{1,p}', '"Paga por pago móvil, transferencia, USDT o efectivo y recíbelo en tu casa o por envío nacional."')
 where id = 2 and frases::text like '%Zelle%';

-- 4. Aceptación de Términos de uso y Política de privacidad ----------------
alter table public.perfiles add column if not exists legal_aceptado_en timestamptz;
alter table public.perfiles add column if not exists legal_version text;

create or replace function public._legal_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'acepta_legal', '') = 'true' then
    update perfiles set legal_aceptado_en = now(), legal_version = left(coalesce(new.raw_user_meta_data->>'legal_version', ''), 20)
     where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists zz_legal_usuario on auth.users;
create trigger zz_legal_usuario after insert on auth.users for each row execute function public._legal_usuario();
revoke execute on function public._legal_usuario() from public, anon, authenticated;

-- los clientes que ya tenían cuenta aceptan la versión nueva al volver a entrar
create or replace function public.aceptar_legal(p_version text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
  update perfiles set legal_aceptado_en = now(), legal_version = left(coalesce(p_version, ''), 20) where id = auth.uid();
end $$;
revoke execute on function public.aceptar_legal(text) from public, anon;
grant execute on function public.aceptar_legal(text) to authenticated;
