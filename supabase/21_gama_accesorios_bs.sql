-- =====================================================================
--  Actualización 21 · Gama, condición por clase, accesorios, precio en Bs
--  y financiamiento visible para Papa's Store
--  1. Cada equipo tiene gama (baja, media o alta) y condición (Nuevo,
--     Clase A, Clase B o Clase C).
--  2. El cliente puede elegir el equipo con accesorios (precio extra que
--     pone la tienda en el panel).
--  3. Pago en bolívares: se calcula con la tasa del día y un ajuste
--     opcional (%) sobre el precio en dólares. El cliente ve los dos montos.
--  4. Inicial mínima general: 30 %.
--  5. Los administradores de Papa's Store pueden VER los créditos de
--     Priority One (solo lectura).
--  Ejecutar DESPUÉS de 20_historial_cierre.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Gama y condición -----------------------------------------------------
alter table public.productos add column if not exists gama text;
alter table public.productos drop constraint if exists productos_gama_check;
alter table public.productos add constraint productos_gama_check check (gama is null or gama in ('baja','media','alta'));
alter table public.productos drop constraint if exists productos_condicion_check;
alter table public.productos add constraint productos_condicion_check check (condicion in ('nuevo','usado','clase_a','clase_b','clase_c'));
-- gama inicial según el precio (luego el admin la ajusta)
update public.productos set gama = case when precio < 200 then 'baja' when precio < 500 then 'media' else 'alta' end where gama is null;

-- 2. Accesorios -------------------------------------------------------------
alter table public.productos add column if not exists accesorios_extra numeric(12,2);
alter table public.productos add column if not exists accesorios_desc text;
alter table public.pedido_items add column if not exists accesorios boolean not null default false;

create or replace function public._crear_pedido(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_acc boolean := false; 
  uid uuid := auth.uid(); cfg configuracion := _cfg(); yo perfiles; it jsonb; pr productos;
  v_qty int; v_cidx int; v_kidx int; v_unit numeric; v_sub numeric := 0; v_desc numeric := 0; v_base numeric;
  v_env numeric; v_total numeric; v_mod text := p->>'modalidad'; v_met text := p->>'metodo_pago';
  v_envm text := p->>'envio_metodo'; v_n int; v_ini numeric; v_down numeric; v_fin numeric; v_recargo numeric;
  v_ped bigint; v_cod text; v_cred bigint; v_cup text := upper(trim(coalesce(p->>'cupon', ''))); el jsonb; v_pago jsonb := p->'pago';
begin
  if uid is null then raise exception 'Inicia sesión para comprar.'; end if;
  select * into yo from perfiles where id = uid;
  if yo.rol <> 'cliente' then raise exception 'Usa una cuenta de cliente para comprar.'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then raise exception 'El carrito está vacío.'; end if;
  if v_mod not in ('contado','financiado') then raise exception 'Elige la forma de pago.'; end if;
  if v_met not in ('pago_movil','transferencia','efectivo','usdt') then raise exception 'Elige el método de pago.'; end if;
  if not (cfg.envio ? v_envm) then raise exception 'Elige el método de entrega.'; end if;
  if v_envm <> 'retiro' and (length(trim(coalesce(p->>'direccion', ''))) < 8 or length(trim(coalesce(p->>'ciudad', ''))) < 3) then
    raise exception 'Escribe la dirección de entrega y la ciudad.';
  end if;

  insert into pedidos(usuario_id, modalidad, metodo_pago, envio_metodo, direccion, ciudad, subtotal, total, reservado_hasta)
  values (uid, v_mod, v_met, v_envm, coalesce(p->>'direccion', ''), coalesce(p->>'ciudad', ''), 0, 0,
          now() + make_interval(hours => cfg.reserva_horas))
  returning id, codigo into v_ped, v_cod;

  for it in select * from jsonb_array_elements(p->'items') loop
    v_qty := (it->>'cantidad')::int; v_cidx := coalesce((it->>'color_idx')::int, 0); v_kidx := coalesce((it->>'cap_idx')::int, 0);
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'Cantidad no válida.'; end if;
    select * into pr from productos where id = (it->>'producto_id')::int and activo for update;
    if not found then raise exception 'Un producto del carrito ya no está disponible.'; end if;
    if pr.stock < v_qty then raise exception 'Solo quedan % unidades de %.', pr.stock, pr.nombre; end if;
    if v_cidx < 0 or v_cidx >= jsonb_array_length(pr.colores) then v_cidx := 0; end if;
    v_unit := pr.precio;
    if pr.capacidades is not null and jsonb_array_length(pr.capacidades) > 0 then
      if v_kidx < 0 or v_kidx >= jsonb_array_length(pr.capacidades) then v_kidx := 0; end if;
      v_unit := v_unit + coalesce((pr.capacidades->v_kidx->>'d')::numeric, 0);
    end if;
    -- con accesorios (si el equipo los ofrece)
    v_acc := coalesce((it->>'accesorios')::boolean, false) and pr.accesorios_extra is not null;
    if v_acc then v_unit := v_unit + pr.accesorios_extra; end if;
    insert into pedido_items(pedido_id, producto_id, nombre, color, color_idx, capacidad, cap_idx, cantidad, precio_unitario, accesorios)
    values (v_ped, pr.id, pr.nombre, pr.colores->v_cidx->>'n', v_cidx,
            case when pr.capacidades is not null then pr.capacidades->v_kidx->>'n' end, v_kidx, v_qty, v_unit, v_acc);
    update productos set stock = stock - v_qty where id = pr.id;
    v_sub := v_sub + v_unit * v_qty;
  end loop;

  if v_cup <> '' then
    if v_cup <> upper(coalesce(cfg.cupon_codigo, '#'))
       or exists (select 1 from pedidos where usuario_id = uid and estado <> 'cancelado' and id <> v_ped) then
      raise exception 'El cupón no es válido para esta compra.';
    end if;
    v_desc := round(v_sub * cfg.cupon_pct, 2);
  end if;
  v_base := v_sub - v_desc;
  v_env := (cfg.envio->v_envm->>'costo')::numeric;
  if v_envm = 'nacional' and v_base >= cfg.envio_gratis_desde then v_env := 0; end if;
  v_total := v_base + v_env;
  update pedidos set subtotal = v_sub, descuento = v_desc, envio_costo = v_env, total = v_total where id = v_ped;

  if v_mod = 'financiado' then
    v_n := (p->>'n_cuotas')::int; v_ini := round(coalesce((p->>'inicial_pct')::numeric, cfg.inicial_min), 4);
    if v_base < cfg.min_financiable then raise exception 'El monto mínimo para financiar es %.', _usd(cfg.min_financiable); end if;
    if not (cfg.planes ? v_n::text) then raise exception 'Plan de cuotas no válido.'; end if;
    if v_ini < cfg.inicial_min or v_ini > cfg.inicial_max then raise exception 'La inicial debe estar entre % %% y % %%.', round(cfg.inicial_min*100), round(cfg.inicial_max*100); end if;
    v_recargo := (cfg.planes->>v_n::text)::numeric;
    v_down := round(v_base * v_ini, 2);
    v_fin := round((v_base - v_down) * (1 + v_recargo), 2);
    el := _elegibilidad(uid, v_fin);
    if not (el->>'ok')::boolean then
      raise exception '%', (select string_agg(x, ' ') from jsonb_array_elements_text(el->'motivos') x);
    end if;
    insert into creditos(pedido_id, usuario_id, monto_base, inicial_pct, inicial, recargo_pct, monto_financiado, n_cuotas)
    values (v_ped, uid, v_base, v_ini, v_down, v_recargo, v_fin, v_n) returning id into v_cred;
  end if;

  if v_pago is not null and jsonb_typeof(v_pago) = 'object' and v_met <> 'efectivo' then
    perform _registrar_pago(uid, case when v_cred is null then 'contado' else 'inicial' end, v_ped, v_cred, v_met,
                            v_pago->>'banco', v_pago->>'referencia', (v_pago->>'monto_reportado')::numeric,
                            v_pago->>'comprobante_path', case when v_cred is null then v_total else v_down + v_env end);
    update pedidos set estado = case when v_cred is null then 'pago_en_revision' else 'credito_en_evaluacion' end where id = v_ped;
    perform _notificar(uid, format('Recibimos tu %s %s. Estamos verificando tu pago.',
                       case when v_cred is null then 'pedido' else 'solicitud de crédito del pedido' end, v_cod));
  else
    perform _notificar(uid, format('Tu pedido %s está reservado por %s horas. %s', v_cod, cfg.reserva_horas,
                       case when v_met = 'efectivo' then 'La tienda te escribirá por WhatsApp para coordinar el pago en efectivo.' else 'Sube tu comprobante desde Mi cuenta.' end));
  end if;
  perform _log(format('Pedido %s creado (%s)', v_cod, v_mod));
  return jsonb_build_object('pedido_id', v_ped, 'codigo', v_cod, 'total', v_total);
end $$;

create or replace function public.ajustar_equipo(pid int, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_nom text; v_s int := nullif(p->>'cuotas_semanal', '')::int; v_q int := nullif(p->>'cuotas_quincenal', '')::int;
        v_acc numeric := nullif(p->>'accesorios_extra', '')::numeric;
begin
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  if coalesce(p->>'condicion', 'nuevo') not in ('nuevo','usado','clase_a','clase_b','clase_c') then raise exception 'Elige la condición del equipo.'; end if;
  if nullif(p->>'gama', '') is not null and p->>'gama' not in ('baja','media','alta') then raise exception 'Elige la gama: baja, media o alta.'; end if;
  if nullif(p->>'bateria', '') is not null and (p->>'bateria')::int not between 1 and 100 then raise exception 'La batería debe estar entre 1 y 100%%.'; end if;
  if v_acc is not null and v_acc < 0 then raise exception 'El precio de los accesorios no puede ser negativo.'; end if;
  if v_s is not null and not (cfg.planes ? v_s::text) then raise exception 'La opción de % cuotas no existe en Configuración.', v_s; end if;
  if v_q is not null and not (cfg.planes ? v_q::text) then raise exception 'La opción de % cuotas no existe en Configuración.', v_q; end if;
  update productos set condicion = coalesce(p->>'condicion', condicion),
         gama = case when p ? 'gama' then nullif(p->>'gama', '') else gama end,
         bateria = nullif(p->>'bateria', '')::int,
         garantia_meses = nullif(p->>'garantia_meses', '')::int,
         accesorios_extra = case when p ? 'accesorios_extra' then v_acc else accesorios_extra end,
         accesorios_desc = case when p ? 'accesorios_desc' then nullif(left(trim(p->>'accesorios_desc'), 160), '') else accesorios_desc end,
         cuotas_semanal = case when p ? 'cuotas_semanal' then v_s else cuotas_semanal end,
         cuotas_quincenal = case when p ? 'cuotas_quincenal' then v_q else cuotas_quincenal end
   where id = pid returning nombre into v_nom;
  perform _log(format('Datos de %s: %s · gama %s%s', v_nom, coalesce(p->>'condicion', 'nuevo'), coalesce(nullif(p->>'gama', ''), '—'),
    case when v_acc is not null then ' · accesorios +' || _usd(v_acc) else '' end));
end $$;

-- 3. Pago en bolívares ------------------------------------------------------
alter table public.configuracion add column if not exists recargo_bs numeric(5,4) not null default 0;
alter table public.pagos add column if not exists recargo_bs numeric(5,4) not null default 0;
create or replace function public._pago_recargo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.recargo_bs := case when new.moneda = 'VES' then (select recargo_bs from configuracion where id = 1) else 0 end;
  return new;
end $$;
drop trigger if exists pago_recargo on public.pagos;
create trigger pago_recargo before insert on public.pagos for each row execute function public._pago_recargo();

create or replace function public.actualizar_config(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare k text; v text; v_planes jsonb := p->'planes';
begin
  perform _requiere_admin();
  if (p->>'tasa')::numeric <= 0 or (p->>'mora')::numeric < 0 or (p->>'inicial_min')::numeric not between 0 and 0.9
     or (p->>'min_financiable')::numeric < 0 or (p->>'cupo_base')::numeric < 0 then
    raise exception 'Revisa los valores de la configuración.';
  end if;
  if coalesce(nullif(p->>'recargo_bs', '')::numeric, 0) not between 0 and 1 then raise exception 'El ajuste para pagos en bolívares debe estar entre 0%% y 100%%.'; end if;
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
         cupo_base = (p->>'cupo_base')::numeric, planes = coalesce(v_planes, planes),
         recargo_bs = coalesce(nullif(p->>'recargo_bs', '')::numeric, recargo_bs), actualizado_en = now()
   where id = 1;
  if v_planes is not null then
    -- los equipos que tenían un plan que ya no existe lo pierden; si se quedan sin ninguno, usan todos
    update productos pr set planes = nullif(array(select x from unnest(pr.planes) x where v_planes ? x::text order by x), '{}')
     where pr.planes is not null and exists (select 1 from unnest(pr.planes) x where not v_planes ? x::text);
  end if;
  perform _log(format('Configuración común actualizada (tasa %s, mora %s%s)', p->>'tasa', p->>'mora',
    case when v_planes is not null then ', planes ' || (select string_agg(key, '/' order by key::int) from jsonb_object_keys(v_planes) key) else '' end));
end $$;

-- 4. Inicial mínima general 30 % ------------------------------------------
update public.configuracion set inicial_min = 0.30 where id = 1;

-- 5. Papa's Store ve el financiamiento de Priority One (solo lectura) -------
create or replace function public._ve_financiamiento(t int) returns boolean
language sql stable security definer set search_path = public as $$
  select es_admin() and exists (select 1 from tiendas where id = t and acepta_cuotas)
$$;
drop policy if exists ver_creditos on public.creditos;
create policy ver_creditos on public.creditos for select using (usuario_id = auth.uid() or es_admin_de(tienda_id) or _ve_financiamiento(tienda_id));
drop policy if exists ver_cuotas on public.cuotas;
create policy ver_cuotas on public.cuotas for select
  using (exists (select 1 from creditos c where c.id = credito_id and (c.usuario_id = auth.uid() or es_admin_de(c.tienda_id) or _ve_financiamiento(c.tienda_id))));
drop policy if exists ver_pedidos on public.pedidos;
create policy ver_pedidos on public.pedidos for select
  using (usuario_id = auth.uid() or es_admin_de(tienda_id) or (modalidad = 'financiado' and _ve_financiamiento(tienda_id)));
drop policy if exists ver_items on public.pedido_items;
create policy ver_items on public.pedido_items for select
  using (exists (select 1 from pedidos o where o.id = pedido_id and (o.usuario_id = auth.uid() or es_admin_de(o.tienda_id) or (o.modalidad = 'financiado' and _ve_financiamiento(o.tienda_id)))));
drop policy if exists ver_perfil on public.perfiles;
create policy ver_perfil on public.perfiles for select
  using (id = auth.uid() or (es_admin() and (rol = 'admin' or _cliente_de_mi_tienda(id)
         or exists (select 1 from creditos c where c.usuario_id = perfiles.id and _ve_financiamiento(c.tienda_id)))));
