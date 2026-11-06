-- =====================================================================
--  Actualización 17 · El cliente elige semanal o quincenal y contrato
--  1. El admin decide, por equipo, si se puede pagar en cuotas semanales,
--     quincenales o ambas, y cuántas cuotas tiene cada opción (por ejemplo
--     8 semanales o 4 quincenales). Si el equipo permite las dos, el
--     cliente elige al comprar.
--  2. Datos para el contrato: representante de cada tienda y, por crédito,
--     el IMEI y los datos del equipo entregado.
--  3. El cliente acepta los términos y condiciones antes de comprar.
--  Ejecutar DESPUÉS de 16_pagos_usados_frecuencia.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Cuotas por frecuencia ----------------------------------------------
alter table public.productos add column if not exists cuotas_semanal int;
alter table public.productos add column if not exists cuotas_quincenal int;
-- equipos que ya existían: se conserva lo que tenían
update public.productos set cuotas_semanal = coalesce(planes[1], 8) where frecuencia = 'semanal' and cuotas_semanal is null and cuotas_quincenal is null;
update public.productos set cuotas_quincenal = coalesce(planes[1], 4) where frecuencia <> 'semanal' and cuotas_semanal is null and cuotas_quincenal is null;

-- los controles anteriores de "un solo plan" ya no aplican
drop trigger if exists un_plan on public.productos;
drop trigger if exists planes_config on public.configuracion;
drop trigger if exists chk_credito_equipo on public.creditos;
alter table public.creditos add column if not exists terminos_aceptados_en timestamptz;

-- inicial mínima, frecuencia elegida y número de cuotas del equipo
create or replace function public._credito_frecuencia() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_f text := nullif(current_setting('app.frecuencia', true), ''); v_ini numeric; r record;
begin
  select max(coalesce(pr.inicial_min, cfg.inicial_min)) into v_ini
    from pedido_items i join productos pr on pr.id = i.producto_id where i.pedido_id = new.pedido_id;
  if v_ini is not null and new.inicial_pct + 0.00001 < v_ini then
    raise exception 'La inicial mínima para este pedido es del %.', round(v_ini*100) || '%'; end if;
  if v_f is null then   -- sin elección: la primera opción que permita el equipo
    select case when bool_and(pr.cuotas_quincenal is not null) then 'quincenal' else 'semanal' end into v_f
      from pedido_items i join productos pr on pr.id = i.producto_id where i.pedido_id = new.pedido_id;
  end if;
  if v_f not in ('semanal','quincenal') then raise exception 'Elige cuotas semanales o quincenales.'; end if;
  for r in select pr.nombre, case v_f when 'semanal' then pr.cuotas_semanal else pr.cuotas_quincenal end as n
             from pedido_items i join productos pr on pr.id = i.producto_id where i.pedido_id = new.pedido_id loop
    if r.n is null then raise exception '% no se vende en cuotas %.', r.nombre, case v_f when 'semanal' then 'semanales' else 'quincenales' end; end if;
    if r.n <> new.n_cuotas then raise exception '% se paga en % cuotas %.', r.nombre, r.n, case v_f when 'semanal' then 'semanales' else 'quincenales' end; end if;
  end loop;
  new.frecuencia := v_f;
  new.terminos_aceptados_en := case when current_setting('app.terminos', true) = 'si' then now() end;
  return new;
end $$;
drop trigger if exists credito_frecuencia on public.creditos;
create trigger credito_frecuencia before insert on public.creditos for each row execute function public._credito_frecuencia();

-- crear pedido: recibe la frecuencia elegida y exige aceptar los términos
create or replace function public._crear_pedido(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
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
    insert into pedido_items(pedido_id, producto_id, nombre, color, color_idx, capacidad, cap_idx, cantidad, precio_unitario)
    values (v_ped, pr.id, pr.nombre, pr.colores->v_cidx->>'n', v_cidx,
            case when pr.capacidades is not null then pr.capacidades->v_kidx->>'n' end, v_kidx, v_qty, v_unit);
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

create or replace function public.crear_pedido(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if coalesce((p->>'acepta_terminos')::boolean, false) is not true then
    raise exception 'Para comprar debes aceptar los términos y condiciones.'; end if;
  perform set_config('app.frecuencia', coalesce(p->>'frecuencia', ''), true);
  perform set_config('app.terminos', 'si', true);
  return _crear_pedido(p);
end $$;
revoke execute on function public._crear_pedido(jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido(jsonb) to authenticated;

-- el admin define cuotas semanales / quincenales (null = no se permite)
create or replace function public.ajustar_equipo(pid int, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_nom text; v_s int := nullif(p->>'cuotas_semanal', '')::int; v_q int := nullif(p->>'cuotas_quincenal', '')::int;
begin
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  if coalesce(p->>'condicion', 'nuevo') not in ('nuevo','usado') then raise exception 'Elige si el equipo es nuevo o usado.'; end if;
  if nullif(p->>'bateria', '') is not null and (p->>'bateria')::int not between 1 and 100 then raise exception 'La batería debe estar entre 1 y 100%%.'; end if;
  if v_s is not null and not (cfg.planes ? v_s::text) then raise exception 'La opción de % cuotas no existe en Configuración.', v_s; end if;
  if v_q is not null and not (cfg.planes ? v_q::text) then raise exception 'La opción de % cuotas no existe en Configuración.', v_q; end if;
  update productos set condicion = coalesce(p->>'condicion', condicion),
         bateria = nullif(p->>'bateria', '')::int,
         garantia_meses = nullif(p->>'garantia_meses', '')::int,
         cuotas_semanal = case when p ? 'cuotas_semanal' then v_s else cuotas_semanal end,
         cuotas_quincenal = case when p ? 'cuotas_quincenal' then v_q else cuotas_quincenal end
   where id = pid returning nombre into v_nom;
  perform _log(format('Datos de %s: %s%s · semanal %s · quincenal %s', v_nom, coalesce(p->>'condicion', 'nuevo'),
    case when nullif(p->>'bateria', '') is not null then ', batería ' || (p->>'bateria') || '%' else '' end,
    coalesce(v_s::text, 'no'), coalesce(v_q::text, 'no')));
end $$;

-- 2. Contrato -------------------------------------------------------------
alter table public.tiendas add column if not exists representante text not null default '';
alter table public.tiendas add column if not exists rep_cedula text not null default '';
alter table public.creditos add column if not exists contrato jsonb;

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
  perform _log('Datos de la tienda actualizados');
end $$;

-- el admin guarda los datos del equipo entregado (IMEI, batería...) para imprimir el contrato
create or replace function public.guardar_contrato(p_credito bigint, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c creditos;
begin
  select * into c from creditos where id = p_credito;
  if not found then raise exception 'Crédito no encontrado.'; end if;
  perform _requiere_admin_de(c.tienda_id);
  if coalesce(trim(p->>'imei1'), '') !~ '^\d{15}$' then raise exception 'El IMEI 1 debe tener 15 dígitos.'; end if;
  if coalesce(trim(p->>'imei2'), '') <> '' and trim(p->>'imei2') !~ '^\d{15}$' then raise exception 'El IMEI 2 debe tener 15 dígitos.'; end if;
  update creditos set contrato = p || jsonb_build_object('guardado_en', now()) where id = p_credito;
  perform _log(format('Contrato del crédito %s preparado (IMEI %s)', c.codigo, p->>'imei1'));
end $$;
revoke execute on function public.guardar_contrato(bigint, jsonb) from public, anon;
grant execute on function public.guardar_contrato(bigint, jsonb) to authenticated;
