-- =====================================================================
--  Actualización 25 · Número de cuotas libre por equipo
--  Antes cada equipo solo podía usar los números de cuotas creados en
--  Configuración (por ejemplo 4 u 8). Ahora el administrador escribe en
--  Inventario el número que quiera: de 1 a 52 cuotas semanales y de 1 a 26
--  quincenales. La lista de Configuración pasa a ser solo de recargos
--  opcionales: un número de cuotas que no esté en ella no lleva recargo.
--  Ejecutar DESPUÉS de 24. Se puede ejecutar más de una vez.
-- =====================================================================

-- los equipos ya no se ajustan a la lista de planes
drop trigger if exists planes_config on public.configuracion;
drop trigger if exists un_plan on public.productos;

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
    if v_n is null or v_n not between 1 and 52 then raise exception 'Número de cuotas no válido.'; end if;
    if v_ini < cfg.inicial_min or v_ini > cfg.inicial_max then raise exception 'La inicial debe estar entre % %% y % %%.', round(cfg.inicial_min*100), round(cfg.inicial_max*100); end if;
    v_recargo := coalesce((cfg.planes->>v_n::text)::numeric, 0);  -- recargo opcional
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
  if v_s is not null and v_s not between 1 and 52 then raise exception 'Las cuotas semanales deben ser de 1 a 52.'; end if;
  if v_q is not null and v_q not between 1 and 26 then raise exception 'Las cuotas quincenales deben ser de 1 a 26.'; end if;
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
    if jsonb_typeof(v_planes) <> 'object' then raise exception 'Formato de recargos no válido.'; end if;
    for k, v in select * from jsonb_each_text(v_planes) loop
      if k !~ '^\d{1,2}$' or k::int not between 1 and 52 then raise exception 'El número de cuotas debe estar entre 1 y 52.'; end if;
      if v::numeric not between 0 and 1 then raise exception 'El recargo del plan de % cuotas debe estar entre 0%% y 100%%.', k; end if;
    end loop;
  end if;
  perform _usar_tienda(v_t);
  update configuracion set mora = (p->>'mora')::numeric,
         inicial_min = (p->>'inicial_min')::numeric, min_financiable = (p->>'min_financiable')::numeric,
         cupo_base = coalesce((p->>'cupo_base')::numeric, cupo_base), planes = coalesce(v_planes, planes), actualizado_en = now()
   where id = 1;
  perform _log(format('Reglas de financiamiento actualizadas (mora %s, inicial %s%%%s)', p->>'mora', round((p->>'inicial_min')::numeric*100),
    case when v_planes is not null then ', planes ' || (select string_agg(key, '/' order by key::int) from jsonb_object_keys(v_planes) key) else '' end));
end $$;
