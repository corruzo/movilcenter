-- =====================================================================
--  MovilCenter · Base de datos para Supabase (PostgreSQL)
--  Ejecutar completo en: Supabase > SQL Editor > New query > Run
--  Toda la lógica de dinero vive aquí, en funciones del servidor.
--  El navegador solo lee sus propios datos y llama a estas funciones.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Utilidades
-- ---------------------------------------------------------------------
create or replace function public.hoy() returns date
language sql stable as $$ select (now() at time zone 'America/Caracas')::date $$;

-- Limpieza de versiones anteriores (no afecta si es la primera vez)
drop function if exists public.metricas_clientes();
drop function if exists public._metricas();

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.configuracion (
  id                  int primary key default 1 check (id = 1),
  tasa                numeric(14,4) not null default 215.40,   -- Bs por USD
  mora                numeric(8,2)  not null default 4.00,     -- cargo fijo por cuota vencida
  inicial_min         numeric(5,4)  not null default 0.30,
  inicial_max         numeric(5,4)  not null default 0.70,
  min_financiable     numeric(12,2) not null default 100,
  planes              jsonb not null default '{"3":0.06,"6":0.12,"9":0.18}',
  reserva_horas       int not null default 48,
  cupo_base           numeric(12,2) not null default 400,
  cupo_por_liquidado  numeric(12,2) not null default 250,
  cupo_max            numeric(12,2) not null default 1500,
  max_creditos        int not null default 2,
  envio               jsonb not null default '{
     "retiro":   {"nombre":"Retiro en tienda","costo":0,"detalle":"Disponible 24 h después de verificar el pago"},
     "local":    {"nombre":"Delivery en la ciudad","costo":3,"detalle":"Entrega en 24 a 48 h"},
     "nacional": {"nombre":"Envío nacional","costo":8,"detalle":"Por encomienda, 2 a 4 días hábiles"}}',
  envio_gratis_desde  numeric(12,2) not null default 300,
  cupon_codigo        text default 'BIENVENIDO5',
  cupon_pct           numeric(5,4) not null default 0.05,
  datos_pago          jsonb not null default '{
     "pago_movil":"Banco: Banesco (0134) · Teléfono: 0414-000-0000 · RIF J-00000000-0",
     "transferencia":"Banesco · Cuenta corriente 0134-0000-00-0000000000 · RIF J-00000000-0",
     "zelle":"Correo: pagos@ejemplo.com",
     "efectivo":"En la tienda, de lunes a sábado de 9:00 a 18:00"}',
  actualizado_en      timestamptz not null default now()
);
insert into public.configuracion (id) values (1) on conflict do nothing;

create table if not exists public.perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null,
  cedula     text not null unique,
  telefono   text,
  email      text,
  direccion  text default '',
  ciudad     text default '',
  rol        text not null default 'cliente' check (rol in ('cliente','admin')),
  creado_en  timestamptz not null default now()
);

create table if not exists public.productos (
  id           serial primary key,
  marca        text not null,
  nombre       text not null,
  categoria    text not null,
  forma        text not null default 'phone',     -- dibujo usado si no hay foto
  precio       numeric(12,2) not null check (precio >= 0),
  stock        int not null default 0 check (stock >= 0),
  colores      jsonb not null default '[]',        -- [{"n":"Negro","hex":"#222"}]
  capacidades  jsonb,                              -- [{"n":"128 GB","d":0},{"n":"256 GB","d":60}]
  specs        jsonb not null default '{}',
  descripcion  text default '',
  pantalla     jsonb default '["#888","#222"]',
  imagen_url   text,                               -- foto real (opcional)
  activo       boolean not null default true,
  orden        int not null default 100
);

create table if not exists public.pedidos (
  id                 bigint generated always as identity (start with 1001) primary key,
  codigo             text generated always as ('PED-' || id) stored,
  usuario_id         uuid not null references public.perfiles(id),
  modalidad          text not null check (modalidad in ('contado','financiado')),
  metodo_pago        text not null check (metodo_pago in ('pago_movil','transferencia','zelle','efectivo')),
  envio_metodo       text not null check (envio_metodo in ('retiro','local','nacional')),
  direccion          text default '',
  ciudad             text default '',
  subtotal           numeric(12,2) not null,
  descuento          numeric(12,2) not null default 0,
  envio_costo        numeric(12,2) not null default 0,
  total              numeric(12,2) not null,
  estado             text not null default 'pendiente_pago' check (estado in
                     ('pendiente_pago','pago_en_revision','credito_en_evaluacion','pago_rechazado',
                      'preparando','listo_retiro','enviado','entregado','cancelado')),
  reservado_hasta    timestamptz,
  transporte         text,
  guia               text,
  motivo_cancelacion text,
  creado_en          timestamptz not null default now()
);
create index if not exists pedidos_usuario_idx on public.pedidos(usuario_id);

create table if not exists public.pedido_items (
  id               bigint generated always as identity primary key,
  pedido_id        bigint not null references public.pedidos(id) on delete cascade,
  producto_id      int not null references public.productos(id),
  nombre           text not null,
  color            text,
  color_idx        int not null default 0,
  capacidad        text,
  cap_idx          int not null default 0,
  cantidad         int not null check (cantidad > 0),
  precio_unitario  numeric(12,2) not null
);

create table if not exists public.creditos (
  id                bigint generated always as identity (start with 501) primary key,
  codigo            text generated always as ('CR-' || id) stored,
  pedido_id         bigint not null unique references public.pedidos(id),
  usuario_id        uuid not null references public.perfiles(id),
  monto_base        numeric(12,2) not null,
  inicial_pct       numeric(5,4) not null,
  inicial           numeric(12,2) not null,
  recargo_pct       numeric(5,4) not null,
  monto_financiado  numeric(12,2) not null,
  n_cuotas          int not null,
  estado            text not null default 'evaluacion' check (estado in
                    ('evaluacion','activo','en_mora','liquidado','rechazado','cancelado')),
  aprobado_en       timestamptz,
  aprobado_por      uuid references public.perfiles(id),
  creado_en         timestamptz not null default now()
);
create index if not exists creditos_usuario_idx on public.creditos(usuario_id);

create table if not exists public.cuotas (
  id                bigint generated always as identity primary key,
  credito_id        bigint not null references public.creditos(id) on delete cascade,
  numero            int not null,
  vence             date not null,
  monto             numeric(12,2) not null,
  mora              numeric(12,2) not null default 0,
  mora_aplicada_en  date,
  estado            text not null default 'pendiente' check (estado in ('pendiente','en_revision','pagada')),
  pagada_en         date,
  unique (credito_id, numero)
);

create table if not exists public.pagos (
  id                  bigint generated always as identity (start with 9001) primary key,
  codigo              text generated always as ('PAG-' || id) stored,
  usuario_id          uuid not null references public.perfiles(id),
  pedido_id           bigint references public.pedidos(id),
  credito_id          bigint references public.creditos(id),
  tipo                text not null check (tipo in ('contado','inicial','cuota')),
  metodo              text not null check (metodo in ('pago_movil','transferencia','zelle','efectivo')),
  moneda              text not null check (moneda in ('VES','USD')),
  banco               text not null default '',
  referencia          text not null,
  monto_esperado_usd  numeric(12,2) not null,
  monto_reportado     numeric(16,2) not null,
  tasa                numeric(14,4) not null,
  comprobante_path    text,
  estado              text not null default 'pendiente' check (estado in ('pendiente','verificado','aprobado','rechazado')),
  nota                text,
  revisado_por        uuid references public.perfiles(id),
  revisado_en         timestamptz,
  creado_en           timestamptz not null default now()
);
create unique index if not exists pagos_referencia_unica
  on public.pagos (banco, referencia) where estado <> 'rechazado';
create index if not exists pagos_usuario_idx on public.pagos(usuario_id);

create table if not exists public.pago_cuotas (
  pago_id   bigint references public.pagos(id) on delete cascade,
  cuota_id  bigint references public.cuotas(id) on delete cascade,
  primary key (pago_id, cuota_id)
);

create table if not exists public.notificaciones (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  texto       text not null,
  leida       boolean not null default false,
  creado_en   timestamptz not null default now()
);
create index if not exists notificaciones_usuario_idx on public.notificaciones(usuario_id);

create table if not exists public.bitacora (
  id         bigint generated always as identity primary key,
  usuario_id uuid,
  actor      text not null,
  accion     text not null,
  creado_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Funciones de apoyo (internas)
-- ---------------------------------------------------------------------
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
$$;

create or replace function public._cfg() returns public.configuracion
language sql stable security definer set search_path = public as $$
  select * from configuracion where id = 1
$$;

create or replace function public._usd(n numeric) returns text
language sql immutable as $$ select '$' || to_char(n, 'FM999G999G990D00') $$;

create or replace function public._fecha(d date) returns text
language sql immutable as $$ select to_char(d, 'DD/MM/YYYY') $$;

create or replace function public._log(accion text) returns void
language plpgsql security definer set search_path = public as $$
declare v_actor text;
begin
  select nombre into v_actor from perfiles where id = auth.uid();
  insert into bitacora(usuario_id, actor, accion) values (auth.uid(), coalesce(v_actor, 'Sistema'), accion);
end $$;

create or replace function public._notificar(uid uuid, texto text) returns void
language sql security definer set search_path = public as $$
  insert into notificaciones(usuario_id, texto) values (uid, texto)
$$;

create or replace function public._requiere_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'Solo el administrador puede hacer esta operación.'; end if;
end $$;

-- Estado del crédito según sus cuotas
create or replace function public._estado_credito(cid bigint) returns text
language plpgsql security definer set search_path = public as $$
declare c creditos; nuevo text;
begin
  select * into c from creditos where id = cid;
  if c.estado in ('evaluacion','rechazado','cancelado') then return c.estado; end if;
  if not exists (select 1 from cuotas where credito_id = cid and estado <> 'pagada') then nuevo := 'liquidado';
  elsif exists (select 1 from cuotas where credito_id = cid and estado <> 'pagada' and vence < hoy()) then nuevo := 'en_mora';
  else nuevo := 'activo'; end if;
  if nuevo <> c.estado then update creditos set estado = nuevo where id = cid; end if;
  return nuevo;
end $$;

-- Cancela un pedido y devuelve el stock
create or replace function public._cancelar_pedido(pid bigint, motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare o pedidos; it record;
begin
  select * into o from pedidos where id = pid for update;
  if o.estado = 'cancelado' then return; end if;
  for it in select producto_id, cantidad from pedido_items where pedido_id = pid loop
    update productos set stock = stock + it.cantidad where id = it.producto_id;
  end loop;
  update pedidos set estado = 'cancelado', motivo_cancelacion = motivo where id = pid;
  update creditos set estado = 'cancelado' where pedido_id = pid and estado = 'evaluacion';
  update pagos set estado = 'rechazado', nota = 'Pedido cancelado', revisado_en = now()
   where pedido_id = pid and estado = 'pendiente';
  perform _notificar(o.usuario_id, format('Tu pedido %s fue cancelado: %s.', o.codigo, motivo));
  perform _log(format('Pedido %s cancelado (%s)', o.codigo, motivo));
end $$;

-- Cupo de crédito y requisitos para financiar
create or replace function public._elegibilidad(uid uuid, financiado numeric) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare cfg configuracion := _cfg(); liquidados int; limite numeric; usado numeric; activos int; mora boolean; motivos text[] := '{}';
begin
  select count(*) into liquidados from creditos where usuario_id = uid and estado = 'liquidado';
  limite := least(cfg.cupo_max, cfg.cupo_base + cfg.cupo_por_liquidado * liquidados);
  select coalesce(sum(case when c.estado = 'evaluacion' then c.monto_financiado
                           else (select coalesce(sum(q.monto), 0) from cuotas q where q.credito_id = c.id and q.estado <> 'pagada') end), 0),
         count(*) filter (where c.estado in ('evaluacion','activo','en_mora')),
         bool_or(c.estado = 'en_mora')
    into usado, activos, mora
    from creditos c where c.usuario_id = uid and c.estado in ('evaluacion','activo','en_mora');
  mora := coalesce(mora, false);
  if mora then motivos := array_append(motivos, 'Tienes un crédito con cuotas vencidas. Ponte al día para solicitar uno nuevo.'::text); end if;
  if activos >= cfg.max_creditos then motivos := array_append(motivos, format('Ya tienes %s créditos abiertos (máximo %s).', activos, cfg.max_creditos)); end if;
  if financiado is not null and financiado > limite - usado then
    motivos := array_append(motivos, format('El monto a financiar (%s) supera tu cupo disponible (%s). Sube la inicial o reduce el carrito.',
                                 _usd(financiado), _usd(greatest(0, limite - usado))));
  end if;
  return jsonb_build_object('limite', limite, 'usado', round(usado, 2), 'disponible', greatest(0, round(limite - usado, 2)),
                            'activos', activos, 'en_mora', mora, 'liquidados', liquidados,
                            'ok', cardinality(motivos) = 0, 'motivos', to_jsonb(motivos));
end $$;

-- Registra un comprobante (uso interno)
create or replace function public._registrar_pago(uid uuid, p_tipo text, p_pedido bigint, p_credito bigint,
       p_metodo text, p_banco text, p_ref text, p_monto numeric, p_path text, p_esperado numeric)
returns bigint
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); v_moneda text; v_id bigint; v_banco text;
begin
  p_ref := upper(trim(coalesce(p_ref, '')));
  v_moneda := case when p_metodo in ('pago_movil','transferencia') then 'VES' else 'USD' end;
  v_banco := case when v_moneda = 'VES' then coalesce(trim(p_banco), '') else '' end;
  if p_metodo = 'efectivo' then raise exception 'El efectivo se registra en caja.'; end if;
  if v_moneda = 'VES' and v_banco = '' then raise exception 'Indica el banco de origen.'; end if;
  if v_moneda = 'VES' and p_ref !~ '^\d{6,}$' then raise exception 'La referencia debe tener al menos 6 dígitos.'; end if;
  if v_moneda = 'USD' and p_ref !~ '^[A-Z0-9]{6,}$' then raise exception 'La confirmación de Zelle debe tener al menos 6 caracteres.'; end if;
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

-- Aprueba un pago (uso interno; los clientes no pueden llamarla)
create or replace function public._aprobar_pago(pid bigint) returns text
language plpgsql security definer set search_path = public as $$
declare g pagos; o pedidos; c creditos; cuota_m numeric; n int; k int; v_estado text; msg text;
begin
  select * into g from pagos where id = pid for update;
  if g.estado <> 'pendiente' then raise exception 'Este pago ya fue revisado.'; end if;

  if g.tipo in ('contado','inicial') then
    select * into o from pedidos where id = g.pedido_id for update;
    if o.estado = 'cancelado' then raise exception 'El pedido está cancelado.'; end if;
    v_estado := case when o.envio_metodo = 'retiro' then 'listo_retiro' else 'preparando' end;
    update pedidos set estado = v_estado, reservado_hasta = null where id = o.id;
  end if;

  if g.tipo = 'contado' then
    update pagos set estado = 'verificado', revisado_por = auth.uid(), revisado_en = now() where id = pid;
    perform _notificar(g.usuario_id, format('Verificamos tu pago del pedido %s. %s', o.codigo,
            case when v_estado = 'listo_retiro' then 'Ya puedes retirarlo en tienda.' else 'Estamos preparando tu envío.' end));
    perform _log(format('Pago %s verificado · pedido %s', g.codigo, o.codigo));
    msg := format('Pago verificado. El pedido %s pasó a preparación.', o.codigo);

  elsif g.tipo = 'inicial' then
    select * into c from creditos where id = g.credito_id for update;
    n := c.n_cuotas; cuota_m := round(c.monto_financiado / n, 2);
    delete from cuotas where credito_id = c.id;
    for k in 1..n loop
      insert into cuotas(credito_id, numero, vence, monto)
      values (c.id, k, (hoy() + make_interval(months => k))::date,
              case when k = n then c.monto_financiado - cuota_m * (n - 1) else cuota_m end);
    end loop;
    update creditos set estado = 'activo', aprobado_en = now(), aprobado_por = auth.uid() where id = c.id;
    update pagos set estado = 'aprobado', revisado_por = auth.uid(), revisado_en = now() where id = pid;
    perform _notificar(g.usuario_id, format('Tu crédito %s fue aprobado: %s cuotas de %s. La primera vence el %s.',
            c.codigo, n, _usd(cuota_m), _fecha((hoy() + make_interval(months => 1))::date)));
    perform _log(format('Crédito %s aprobado · %s cuotas generadas', c.codigo, n));
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

-- ---------------------------------------------------------------------
-- 3. Funciones para clientes
-- ---------------------------------------------------------------------
create or replace function public.mi_cupo(financiado numeric default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
  return _elegibilidad(auth.uid(), financiado);
end $$;

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
  if v_met not in ('pago_movil','transferencia','zelle','efectivo') then raise exception 'Elige el método de pago.'; end if;
  if not (cfg.envio ? v_envm) then raise exception 'Elige el método de entrega.'; end if;
  if v_met = 'efectivo' and v_envm <> 'retiro' then raise exception 'El pago en efectivo solo aplica para retiro en tienda.'; end if;
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
                       case when v_met = 'efectivo' then 'Paga en caja al retirarlo.' else 'Sube tu comprobante desde Mi cuenta.' end));
  end if;
  perform _log(format('Pedido %s creado (%s)', v_cod, v_mod));
  return jsonb_build_object('pedido_id', v_ped, 'codigo', v_cod, 'total', v_total);
end $$;

create or replace function public.enviar_comprobante(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); o pedidos; c creditos; v_k int; v_esp numeric; v_pago bigint; v_ids bigint[];
begin
  if uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  if p->>'tipo' = 'pedido' then
    select * into o from pedidos where id = (p->>'pedido_id')::bigint and usuario_id = uid for update;
    if not found then raise exception 'Pedido no encontrado.'; end if;
    if o.estado not in ('pendiente_pago','pago_rechazado') then raise exception 'Este pedido ya tiene un pago en revisión o fue procesado.'; end if;
    select * into c from creditos where pedido_id = o.id;
    v_esp := case when c.id is null then o.total else c.inicial + o.envio_costo end;
    perform _registrar_pago(uid, case when c.id is null then 'contado' else 'inicial' end, o.id, c.id,
                            coalesce(p->>'metodo', o.metodo_pago), p->>'banco', p->>'referencia',
                            (p->>'monto_reportado')::numeric, p->>'comprobante_path', v_esp);
    update pedidos set estado = case when c.id is null then 'pago_en_revision' else 'credito_en_evaluacion' end where id = o.id;
    perform _log(format('Comprobante recibido para %s', o.codigo));
    return jsonb_build_object('ok', true);
  end if;

  select * into c from creditos where id = (p->>'credito_id')::bigint and usuario_id = uid for update;
  if not found then raise exception 'Crédito no encontrado.'; end if;
  if c.estado not in ('activo','en_mora') then raise exception 'Este crédito no tiene cuotas por pagar.'; end if;
  v_k := greatest(1, coalesce((p->>'cantidad_cuotas')::int, 1));
  select array_agg(id order by numero), sum(monto + mora) into v_ids, v_esp
    from (select id, numero, monto, mora from cuotas where credito_id = c.id and estado = 'pendiente' order by numero limit v_k) s;
  if v_ids is null then raise exception 'No hay cuotas pendientes por pagar.'; end if;
  v_pago := _registrar_pago(uid, 'cuota', null, c.id, p->>'metodo', p->>'banco', p->>'referencia',
                            (p->>'monto_reportado')::numeric, p->>'comprobante_path', v_esp);
  insert into pago_cuotas(pago_id, cuota_id) select v_pago, unnest(v_ids);
  update cuotas set estado = 'en_revision' where id = any(v_ids);
  perform _log(format('Comprobante de cuotas recibido para %s', c.codigo));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.cancelar_mi_pedido(pid bigint) returns void
language plpgsql security definer set search_path = public as $$
declare o pedidos;
begin
  select * into o from pedidos where id = pid and usuario_id = auth.uid();
  if not found then raise exception 'Pedido no encontrado.'; end if;
  if o.estado not in ('pendiente_pago','pago_rechazado') then raise exception 'Este pedido ya no se puede cancelar desde la tienda.'; end if;
  perform _cancelar_pedido(pid, 'cancelado por el cliente');
end $$;

create or replace function public.actualizar_mis_datos(p_telefono text, p_direccion text, p_ciudad text) returns void
language sql security definer set search_path = public as $$
  update perfiles set telefono = left(trim(p_telefono), 20), direccion = left(trim(p_direccion), 200), ciudad = left(trim(p_ciudad), 80)
   where id = auth.uid()
$$;

create or replace function public.marcar_notificaciones_leidas() returns void
language sql security definer set search_path = public as $$
  update notificaciones set leida = true where usuario_id = auth.uid() and not leida
$$;

-- ---------------------------------------------------------------------
-- 4. Funciones del administrador
-- ---------------------------------------------------------------------
create or replace function public.aprobar_pago(pid bigint) returns text
language plpgsql security definer set search_path = public as $$
begin perform _requiere_admin(); return _aprobar_pago(pid); end $$;

create or replace function public.rechazar_pago(pid bigint, nota text) returns text
language plpgsql security definer set search_path = public as $$
declare g pagos; cfg configuracion := _cfg();
begin
  perform _requiere_admin();
  select * into g from pagos where id = pid for update;
  if g.estado <> 'pendiente' then raise exception 'Este pago ya fue revisado.'; end if;
  update pagos set estado = 'rechazado', nota = rechazar_pago.nota, revisado_por = auth.uid(), revisado_en = now() where id = pid;
  if g.tipo = 'cuota' then
    update cuotas set estado = 'pendiente' where id in (select cuota_id from pago_cuotas where pago_id = pid);
    perform _estado_credito(g.credito_id);
  else
    update pedidos set estado = 'pago_rechazado', reservado_hasta = now() + make_interval(hours => cfg.reserva_horas) where id = g.pedido_id;
  end if;
  perform _notificar(g.usuario_id, format('No pudimos verificar tu pago %s: %s. Sube un nuevo comprobante desde Mi cuenta.', g.codigo, lower(nota)));
  perform _log(format('Pago %s rechazado (%s)', g.codigo, nota));
  return 'Pago rechazado. El cliente fue notificado.';
end $$;

create or replace function public.rechazar_credito(pid bigint, nota text) returns text
language plpgsql security definer set search_path = public as $$
declare g pagos; c creditos;
begin
  perform _requiere_admin();
  select * into g from pagos where id = pid for update;
  if g.tipo <> 'inicial' or g.estado <> 'pendiente' then raise exception 'Este pago no es una solicitud de crédito pendiente.'; end if;
  select * into c from creditos where id = g.credito_id;
  update pagos set estado = 'rechazado', nota = 'Crédito no aprobado', revisado_por = auth.uid(), revisado_en = now() where id = pid;
  update creditos set estado = 'rechazado' where id = c.id;
  perform _cancelar_pedido(g.pedido_id, 'crédito no aprobado');
  perform _notificar(g.usuario_id, format('Tu solicitud de crédito %s no fue aprobada (%s). Te contactaremos para reintegrar la inicial.', c.codigo, lower(nota)));
  perform _log(format('Crédito %s rechazado (%s) · reintegro pendiente', c.codigo, nota));
  return 'Crédito rechazado. Pedido cancelado y stock liberado.';
end $$;

create or replace function public.condonar_mora(p_cuota bigint) returns void
language plpgsql security definer set search_path = public as $$
declare q cuotas; c creditos;
begin
  perform _requiere_admin();
  select * into q from cuotas where id = p_cuota; select * into c from creditos where id = q.credito_id;
  update cuotas set mora = 0 where id = p_cuota;
  perform _notificar(c.usuario_id, format('Se condonó la mora de tu cuota %s del crédito %s.', q.numero, c.codigo));
  perform _log(format('Mora condonada en %s cuota %s', c.codigo, q.numero));
end $$;

create or replace function public.pago_en_caja(p_pedido bigint default null, p_cuota bigint default null) returns text
language plpgsql security definer set search_path = public as $$
declare o pedidos; c creditos; q cuotas; v_pago bigint; cfg configuracion := _cfg(); v_ref text := 'CAJA' || to_char(clock_timestamp(), 'YYMMDDHH24MISSUS');
begin
  perform _requiere_admin();
  if p_cuota is not null then
    select * into q from cuotas where id = p_cuota and estado = 'pendiente';
    if not found then raise exception 'La cuota no está pendiente.'; end if;
    select * into c from creditos where id = q.credito_id;
    insert into pagos(usuario_id, credito_id, tipo, metodo, moneda, referencia, monto_esperado_usd, monto_reportado, tasa)
    values (c.usuario_id, c.id, 'cuota', 'efectivo', 'USD', v_ref, q.monto + q.mora, q.monto + q.mora, cfg.tasa) returning id into v_pago;
    insert into pago_cuotas values (v_pago, q.id);
  else
    select * into o from pedidos where id = p_pedido and estado in ('pendiente_pago','pago_rechazado');
    if not found then raise exception 'El pedido no está pendiente de pago.'; end if;
    select * into c from creditos where pedido_id = o.id;
    insert into pagos(usuario_id, pedido_id, credito_id, tipo, metodo, moneda, referencia, monto_esperado_usd, monto_reportado, tasa)
    values (o.usuario_id, o.id, c.id, case when c.id is null then 'contado' else 'inicial' end, 'efectivo', 'USD', v_ref,
            case when c.id is null then o.total else c.inicial + o.envio_costo end,
            case when c.id is null then o.total else c.inicial + o.envio_costo end, cfg.tasa) returning id into v_pago;
  end if;
  return _aprobar_pago(v_pago);
end $$;

create or replace function public.despachar_pedido(pid bigint, p_transporte text, p_guia text) returns void
language plpgsql security definer set search_path = public as $$
declare o pedidos;
begin
  perform _requiere_admin();
  if length(trim(coalesce(p_guia, ''))) < 4 then raise exception 'Ingresa el número de guía.'; end if;
  update pedidos set estado = 'enviado', transporte = p_transporte, guia = trim(p_guia) where id = pid and estado = 'preparando' returning * into o;
  if not found then raise exception 'El pedido no está en preparación.'; end if;
  perform _notificar(o.usuario_id, format('Tu pedido %s fue enviado por %s. Guía %s.', o.codigo, p_transporte, o.guia));
  perform _log(format('Pedido %s despachado · guía %s', o.codigo, o.guia));
end $$;

create or replace function public.entregar_pedido(pid bigint) returns void
language plpgsql security definer set search_path = public as $$
declare o pedidos;
begin
  perform _requiere_admin();
  update pedidos set estado = 'entregado' where id = pid and estado in ('enviado','listo_retiro') returning * into o;
  if not found then raise exception 'El pedido no está enviado ni listo para retiro.'; end if;
  perform _notificar(o.usuario_id, format('Tu pedido %s fue entregado. ¡Gracias por tu compra!', o.codigo));
  perform _log(format('Pedido %s entregado', o.codigo));
end $$;

create or replace function public.ajustar_stock(pid int, delta int) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  perform _requiere_admin();
  update productos set stock = greatest(0, stock + delta) where id = pid returning stock into v;
  perform _log(format('Ajuste de inventario producto %s: %s (queda %s)', pid, delta, v));
  return v;
end $$;

create or replace function public.actualizar_config(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _requiere_admin();
  if (p->>'tasa')::numeric <= 0 or (p->>'mora')::numeric < 0 or (p->>'inicial_min')::numeric not between 0 and 0.9
     or (p->>'min_financiable')::numeric < 0 or (p->>'cupo_base')::numeric < 0 then
    raise exception 'Revisa los valores de la configuración.';
  end if;
  update configuracion set tasa = (p->>'tasa')::numeric, mora = (p->>'mora')::numeric,
         inicial_min = (p->>'inicial_min')::numeric, min_financiable = (p->>'min_financiable')::numeric,
         cupo_base = (p->>'cupo_base')::numeric, planes = coalesce(p->'planes', planes),
         datos_pago = coalesce(p->'datos_pago', datos_pago), actualizado_en = now()
   where id = 1;
  perform _log(format('Configuración actualizada (tasa %s, mora %s)', p->>'tasa', p->>'mora'));
end $$;

create or replace function public.cupo_cliente(p_usuario uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform _requiere_admin();
  return _elegibilidad(p_usuario, null);
end $$;

-- ---------------------------------------------------------------------
-- 5. Proceso diario (mora, reservas vencidas, recordatorios)
-- ---------------------------------------------------------------------
create or replace function public.cierre_diario() returns jsonb
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); r record; v_moras int := 0; v_cancel int := 0; v_avisos int := 0;
begin
  for r in select id from pedidos where estado = 'pendiente_pago' and reservado_hasta < now() loop
    perform _cancelar_pedido(r.id, 'no se recibió el pago a tiempo'); v_cancel := v_cancel + 1;
  end loop;

  for r in select q.id, q.numero, q.vence, c.id as cid, c.codigo, c.usuario_id
             from cuotas q join creditos c on c.id = q.credito_id
            where c.estado in ('activo','en_mora') and q.estado = 'pendiente'
              and q.vence < hoy() and q.mora_aplicada_en is null
            for update of q loop
    update cuotas set mora = mora + cfg.mora, mora_aplicada_en = hoy() where id = r.id;
    perform _notificar(r.usuario_id, format('Tu cuota %s del crédito %s venció el %s y recibió un cargo por mora de %s.',
                       r.numero, r.codigo, _fecha(r.vence), _usd(cfg.mora)));
    insert into bitacora(actor, accion) values ('Sistema', format('Mora de %s aplicada a %s cuota %s', _usd(cfg.mora), r.codigo, r.numero));
    v_moras := v_moras + 1;
  end loop;

  for r in select id from creditos where estado in ('activo','en_mora') loop perform _estado_credito(r.id); end loop;

  for r in select q.numero, q.vence, q.monto + q.mora as total, c.usuario_id, c.codigo
             from cuotas q join creditos c on c.id = q.credito_id
            where c.estado in ('activo','en_mora') and q.estado = 'pendiente' and q.vence = hoy() + 3 loop
    perform _notificar(r.usuario_id, format('Recordatorio: tu cuota %s de %s del crédito %s vence el %s.', r.numero, _usd(r.total), r.codigo, _fecha(r.vence)));
    v_avisos := v_avisos + 1;
  end loop;

  insert into bitacora(actor, accion) values ('Sistema', format('Cierre diario: %s moras, %s reservas canceladas, %s recordatorios', v_moras, v_cancel, v_avisos));
  return jsonb_build_object('moras', v_moras, 'canceladas', v_cancel, 'recordatorios', v_avisos);
end $$;

create or replace function public.ejecutar_cierre() returns jsonb
language plpgsql security definer set search_path = public as $$
begin perform _requiere_admin(); return cierre_diario(); end $$;

-- ---------------------------------------------------------------------
-- 6. Perfil automático al registrarse
-- ---------------------------------------------------------------------
create or replace function public._nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cfg configuracion := _cfg();
begin
  insert into perfiles(id, nombre, cedula, telefono, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
          upper(coalesce(new.raw_user_meta_data->>'cedula', 'SIN-' || left(new.id::text, 8))),
          new.raw_user_meta_data->>'telefono', new.email);
  if v_cfg.cupon_codigo is not null then
    insert into notificaciones(usuario_id, texto)
    values (new.id, format('Bienvenido. Usa el cupón %s en tu primera compra y obtén %s%% de descuento.', v_cfg.cupon_codigo, round(v_cfg.cupon_pct * 100)));
  end if;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users for each row execute function public._nuevo_usuario();

-- ---------------------------------------------------------------------
-- 7. Seguridad: RLS y permisos
-- ---------------------------------------------------------------------
alter table public.configuracion  enable row level security;
alter table public.perfiles       enable row level security;
alter table public.productos      enable row level security;
alter table public.pedidos        enable row level security;
alter table public.pedido_items   enable row level security;
alter table public.creditos       enable row level security;
alter table public.cuotas         enable row level security;
alter table public.pagos          enable row level security;
alter table public.pago_cuotas    enable row level security;
alter table public.notificaciones enable row level security;
alter table public.bitacora       enable row level security;

drop policy if exists ver_config on public.configuracion;
create policy ver_config on public.configuracion for select using (true);
drop policy if exists ver_productos on public.productos;
create policy ver_productos on public.productos for select using (activo or es_admin());
drop policy if exists ver_perfil on public.perfiles;
create policy ver_perfil on public.perfiles for select using (id = auth.uid() or es_admin());
drop policy if exists ver_pedidos on public.pedidos;
create policy ver_pedidos on public.pedidos for select using (usuario_id = auth.uid() or es_admin());
drop policy if exists ver_items on public.pedido_items;
create policy ver_items on public.pedido_items for select
  using (es_admin() or exists (select 1 from pedidos o where o.id = pedido_id and o.usuario_id = auth.uid()));
drop policy if exists ver_creditos on public.creditos;
create policy ver_creditos on public.creditos for select using (usuario_id = auth.uid() or es_admin());
drop policy if exists ver_cuotas on public.cuotas;
create policy ver_cuotas on public.cuotas for select
  using (es_admin() or exists (select 1 from creditos c where c.id = credito_id and c.usuario_id = auth.uid()));
drop policy if exists ver_pagos on public.pagos;
create policy ver_pagos on public.pagos for select using (usuario_id = auth.uid() or es_admin());
drop policy if exists ver_pago_cuotas on public.pago_cuotas;
create policy ver_pago_cuotas on public.pago_cuotas for select
  using (es_admin() or exists (select 1 from pagos g where g.id = pago_id and g.usuario_id = auth.uid()));
drop policy if exists ver_notificaciones on public.notificaciones;
create policy ver_notificaciones on public.notificaciones for select using (usuario_id = auth.uid());
drop policy if exists ver_bitacora on public.bitacora;
create policy ver_bitacora on public.bitacora for select using (es_admin());
-- No hay políticas de INSERT/UPDATE/DELETE: los cambios solo se hacen con las funciones de arriba.

-- Las funciones internas no se pueden llamar desde el navegador
revoke execute on function public._cfg(), public._log(text), public._notificar(uuid, text), public._estado_credito(bigint),
  public._cancelar_pedido(bigint, text), public._elegibilidad(uuid, numeric),
  public._registrar_pago(uuid, text, bigint, bigint, text, text, text, numeric, text, numeric),
  public._aprobar_pago(bigint), public.cierre_diario(), public._nuevo_usuario()
  from public, anon, authenticated;
-- Las funciones de clientes requieren sesión iniciada
revoke execute on function public.mi_cupo(numeric), public.crear_pedido(jsonb), public.enviar_comprobante(jsonb),
  public.cancelar_mi_pedido(bigint), public.actualizar_mis_datos(text, text, text), public.marcar_notificaciones_leidas(),
  public.aprobar_pago(bigint), public.rechazar_pago(bigint, text), public.rechazar_credito(bigint, text),
  public.condonar_mora(bigint), public.pago_en_caja(bigint, bigint), public.despachar_pedido(bigint, text, text),
  public.entregar_pedido(bigint), public.ajustar_stock(int, int), public.actualizar_config(jsonb),
  public.cupo_cliente(uuid), public.ejecutar_cierre()
  from public, anon;
grant execute on function public.mi_cupo(numeric), public.crear_pedido(jsonb), public.enviar_comprobante(jsonb),
  public.cancelar_mi_pedido(bigint), public.actualizar_mis_datos(text, text, text), public.marcar_notificaciones_leidas(),
  public.aprobar_pago(bigint), public.rechazar_pago(bigint, text), public.rechazar_credito(bigint, text),
  public.condonar_mora(bigint), public.pago_en_caja(bigint, bigint), public.despachar_pedido(bigint, text, text),
  public.entregar_pedido(bigint), public.ajustar_stock(int, int), public.actualizar_config(jsonb),
  public.cupo_cliente(uuid), public.ejecutar_cierre()
  to authenticated;

-- ---------------------------------------------------------------------
-- 8. Almacenamiento privado de comprobantes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- Fotos de productos (públicas). Súbelas en Supabase > Storage > productos
-- y copia la URL pública en la columna imagen_url del producto.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists subir_comprobante on storage.objects;
create policy subir_comprobante on storage.objects for insert to authenticated
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists ver_comprobante on storage.objects;
create policy ver_comprobante on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));
