-- =====================================================================
--  Actualización 16 · Formas de pago, equipos usados y cuotas semanales
--  o quincenales (según el contrato de Priority One)
--  1. Métodos de pago: pago móvil, transferencia, efectivo y USDT (Binance).
--     El efectivo lo registra el admin cuando lo recibe ("Registrar
--     efectivo"); los demás llevan comprobante.
--  2. Cada equipo puede ser nuevo o usado, con % de batería y meses de
--     garantía.
--  3. Cada equipo se paga en cuotas semanales o quincenales (lo elige el
--     admin junto con el número de cuotas).
--  Ejecutar DESPUÉS de 15_sin_cupo.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Métodos de pago -----------------------------------------------------
alter table public.pedidos drop constraint if exists pedidos_metodo_pago_check;
alter table public.pedidos add constraint pedidos_metodo_pago_check
  check (metodo_pago in ('pago_movil','transferencia','zelle','efectivo','usdt'));
alter table public.pagos drop constraint if exists pagos_metodo_check;
alter table public.pagos add constraint pagos_metodo_check
  check (metodo in ('pago_movil','transferencia','zelle','efectivo','usdt'));

create or replace function public._solo_online() returns trigger
language plpgsql as $$
begin
  if new.envio_metodo = 'retiro' then raise exception 'Elige delivery o envío nacional.'; end if;
  if new.metodo_pago = 'zelle' then raise exception 'Elige pago móvil, transferencia, efectivo o USDT.'; end if;
  return new;
end $$;

-- el cliente no reporta pagos en efectivo: los registra el admin al recibirlos
create or replace function public._pago_metodo() returns trigger
language plpgsql as $$
begin
  if new.metodo = 'zelle' then raise exception 'Elige pago móvil, transferencia, efectivo o USDT.'; end if;
  if new.metodo = 'efectivo' and new.referencia not like 'CAJA%' then
    raise exception 'Los pagos en efectivo los registra la tienda cuando los recibe.'; end if;
  return new;
end $$;

-- comprobantes: VES para pago móvil/transferencia, USD para USDT
create or replace function public._registrar_pago(uid uuid, p_tipo text, p_pedido bigint, p_credito bigint,
       p_metodo text, p_banco text, p_ref text, p_monto numeric, p_path text, p_esperado numeric)
returns bigint
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_moneda text; v_id bigint; v_banco text;
begin
  p_ref := upper(trim(coalesce(p_ref, '')));
  if p_metodo = 'efectivo' then raise exception 'Los pagos en efectivo los registra la tienda cuando los recibe.'; end if;
  if p_metodo not in ('pago_movil','transferencia','usdt') then raise exception 'Elige pago móvil, transferencia o USDT.'; end if;
  v_moneda := case when p_metodo in ('pago_movil','transferencia') then 'VES' else 'USD' end;
  v_banco := case when v_moneda = 'VES' then coalesce(trim(p_banco), '') else 'Binance' end;
  if v_moneda = 'VES' and v_banco = '' then raise exception 'Indica el banco de origen.'; end if;
  if v_moneda = 'VES' and p_ref !~ '^\d{6,}$' then raise exception 'La referencia debe tener al menos 6 dígitos.'; end if;
  if v_moneda = 'USD' and p_ref !~ '^[A-Z0-9]{6,}$' then raise exception 'El ID de la orden de Binance debe tener al menos 6 caracteres (letras o números).'; end if;
  if coalesce(p_monto, 0) <= 0 then raise exception 'Escribe el monto que pagaste.'; end if;
  if exists (select 1 from pagos where banco = v_banco and referencia = p_ref and estado <> 'rechazado') then
    raise exception 'Esa referencia ya fue registrada. Revisa el número.';
  end if;
  insert into pagos(usuario_id, pedido_id, credito_id, tipo, metodo, moneda, banco, referencia,
                    monto_esperado_usd, monto_reportado, tasa, comprobante_path)
  values (uid, p_pedido, p_credito, p_tipo, p_metodo, v_moneda, v_banco, p_ref,
          round(p_esperado, 2), round(p_monto, 2), cfg.tasa, p_path)
  returning id into v_id;
  return v_id;
end $$;

-- crear pedido: acepta efectivo (lo registra la tienda) y USDT
create or replace function public.crear_pedido(p jsonb) returns jsonb
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


-- el admin vuelve a poder registrar pagos en efectivo (pedidos y cuotas)
grant execute on function public.pago_en_caja(bigint, bigint) to authenticated;

-- datos de pago: USDT (Binance) y efectivo
update public.tiendas set datos_pago = coalesce(datos_pago, '{}'::jsonb) - 'zelle'
  || jsonb_build_object('efectivo', coalesce(datos_pago->>'efectivo', 'Al recibir el equipo o con el encargado de la tienda.'));

-- 2. Equipos usados -------------------------------------------------------
alter table public.productos add column if not exists condicion text not null default 'nuevo';
alter table public.productos add column if not exists bateria int;
alter table public.productos add column if not exists garantia_meses int;
alter table public.productos drop constraint if exists productos_condicion_check;
alter table public.productos add constraint productos_condicion_check check (condicion in ('nuevo','usado'));
alter table public.productos drop constraint if exists productos_bateria_check;
alter table public.productos add constraint productos_bateria_check check (bateria is null or bateria between 1 and 100);

-- 3. Cuotas semanales o quincenales -------------------------------------
alter table public.productos add column if not exists frecuencia text not null default 'quincenal';
alter table public.productos drop constraint if exists productos_frecuencia_check;
alter table public.productos add constraint productos_frecuencia_check check (frecuencia in ('semanal','quincenal','mensual'));
alter table public.creditos add column if not exists frecuencia text not null default 'mensual';

create or replace function public.ajustar_equipo(pid int, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  if coalesce(p->>'condicion', 'nuevo') not in ('nuevo','usado') then raise exception 'Elige si el equipo es nuevo o usado.'; end if;
  if nullif(p->>'bateria', '') is not null and (p->>'bateria')::int not between 1 and 100 then raise exception 'La batería debe estar entre 1 y 100%%.'; end if;
  if coalesce(p->>'frecuencia', 'quincenal') not in ('semanal','quincenal') then raise exception 'Elige cuotas semanales o quincenales.'; end if;
  update productos set condicion = coalesce(p->>'condicion', condicion),
         bateria = nullif(p->>'bateria', '')::int,
         garantia_meses = nullif(p->>'garantia_meses', '')::int,
         frecuencia = coalesce(p->>'frecuencia', frecuencia)
   where id = pid returning nombre into v_nom;
  perform _log(format('Datos de %s: %s%s, cuotas %ss', v_nom, coalesce(p->>'condicion', 'nuevo'),
    case when nullif(p->>'bateria', '') is not null then ', batería ' || (p->>'bateria') || '%' else '' end, coalesce(p->>'frecuencia', 'quincenal')));
end $$;
revoke execute on function public.ajustar_equipo(int, jsonb) from public, anon;
grant execute on function public.ajustar_equipo(int, jsonb) to authenticated;

-- el crédito toma la frecuencia de su equipo (todos los equipos del pedido deben coincidir)
create or replace function public._credito_frecuencia() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_n int; v_f text;
begin
  select count(distinct p.frecuencia), min(p.frecuencia) into v_n, v_f
    from pedido_items i join productos p on p.id = i.producto_id where i.pedido_id = new.pedido_id;
  if v_n > 1 then raise exception 'Estos equipos se pagan con cuotas de distinta frecuencia: cómpralos por separado.'; end if;
  new.frecuencia := coalesce(v_f, 'quincenal');
  return new;
end $$;
drop trigger if exists credito_frecuencia on public.creditos;
create trigger credito_frecuencia before insert on public.creditos for each row execute function public._credito_frecuencia();

-- fecha de vencimiento de la cuota k según la frecuencia
create or replace function public._vence_cuota(f text, k int) returns date
language sql stable as $$
  select (hoy() + case f when 'semanal' then make_interval(days => 7 * k)
                         when 'quincenal' then make_interval(days => 15 * k)
                         else make_interval(months => k) end)::date
$$;

create or replace function public._aprobar_pago(pid bigint) returns text
language plpgsql security definer set search_path = public as $$
declare g pagos; o pedidos; c creditos; cuota_m numeric; n int; k int; v_estado text; msg text; v_frec text;
begin
  select * into g from pagos where id = pid for update;
  if g.estado <> 'pendiente' then raise exception 'Este pago ya fue revisado.'; end if;

  if g.tipo in ('contado','inicial') then
    select * into o from pedidos where id = g.pedido_id for update;
    if o.estado = 'cancelado' then raise exception 'El pedido está cancelado.'; end if;
    v_estado := 'preparando';
    update pedidos set estado = v_estado, reservado_hasta = null where id = o.id;
  end if;

  if g.tipo = 'contado' then
    update pagos set estado = 'verificado', revisado_por = auth.uid(), revisado_en = now() where id = pid;
    perform _notificar(g.usuario_id, format('Verificamos tu pago del pedido %s. Estamos preparando tu envío.', o.codigo));
    perform _log(format('Pago %s verificado · pedido %s', g.codigo, o.codigo));
    msg := format('Pago verificado. El pedido %s pasó a preparación.', o.codigo);

  elsif g.tipo = 'inicial' then
    select * into c from creditos where id = g.credito_id for update;
    n := c.n_cuotas; cuota_m := round(c.monto_financiado / n, 2);
    v_frec := case c.frecuencia when 'semanal' then 'semanales' when 'quincenal' then 'quincenales' else 'mensuales' end;
    delete from cuotas where credito_id = c.id;
    for k in 1..n loop
      insert into cuotas(credito_id, numero, vence, monto)
      values (c.id, k, _vence_cuota(c.frecuencia, k),
              case when k = n then c.monto_financiado - cuota_m * (n - 1) else cuota_m end);
    end loop;
    update creditos set estado = 'activo', aprobado_en = now(), aprobado_por = auth.uid() where id = c.id;
    update pagos set estado = 'aprobado', revisado_por = auth.uid(), revisado_en = now() where id = pid;
    perform _notificar(g.usuario_id, format('Tu crédito %s fue aprobado: %s cuotas %s de %s. La primera vence el %s.',
            c.codigo, n, v_frec, _usd(cuota_m), _fecha(_vence_cuota(c.frecuencia, 1))));
    perform _log(format('Crédito %s aprobado · %s cuotas %s', c.codigo, n, v_frec));
    msg := format('Crédito %s aprobado y cronograma generado.', c.codigo);

  else
    update cuotas set estado = 'pagada', pagada_en = (g.creado_en at time zone 'America/Caracas')::date
     where id in (select cuota_id from pago_cuotas where pago_id = pid);
    update pagos set estado = 'verificado', revisado_por = auth.uid(), revisado_en = now() where id = pid;
    select * into c from creditos where id = g.credito_id;
    v_estado := _estado_credito(c.id);
    perform _notificar(g.usuario_id, format('Registramos tu pago de cuotas del crédito %s.%s', c.codigo,
            case when v_estado = 'liquidado' then ' ¡Crédito liquidado!' else '' end));
    perform _log(format('Pago %s de cuotas del crédito %s verificado', g.codigo, c.codigo));
    msg := case when v_estado = 'liquidado' then format('Crédito %s liquidado.', c.codigo) else 'Cuotas registradas como pagadas.' end;
  end if;
  return msg;
end $$;
revoke execute on function public._aprobar_pago(bigint), public._vence_cuota(text, int), public._credito_frecuencia() from public, anon, authenticated;

-- 4. Planes como en el contrato: 4 o 8 cuotas, sin recargo, inicial 50 %
--    (solo si todavía tienes los planes de fábrica; luego se cambian en Configuración)
update public.configuracion set planes = '{"4":0,"8":0}'::jsonb, inicial_min = 0.50
 where id = 1 and planes = '{"3":0.06,"6":0.12,"9":0.18}'::jsonb;
