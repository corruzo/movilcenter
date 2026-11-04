-- =====================================================================
--  Priority One y Papa's Store · INSTALACIÓN COMPLETA
--  Contiene, en orden: 01, 05, 06, 07, 08, 09, 10, 11 y 12.
--  Pégalo completo en Supabase > SQL Editor > New query y pulsa Run.
--  (El cierre diario va aparte: 03_tarea_diaria.sql)
-- =====================================================================

-- >>>>>>>>>> 01_esquema.sql
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

-- >>>>>>>>>> 05_actualizacion.sql
-- =====================================================================
--  MovilCenter · Actualización 05
--  - Cédula y teléfono solo con números
--  - Verificación de identidad al crear la cuenta (foto de cédula,
--    selfie, ubicación, datos laborales y referencia)
--  - Módulo "Trabaja con nosotros" (postulaciones)
--  - Equipos financiables / solo de contado
--  Ejecutar DESPUÉS de 01, 02, 03 y 04. Se puede ejecutar más de una vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Utilidades de cédula y teléfono
-- ---------------------------------------------------------------------
-- Cédula: guarda "V-12345678" (letra V o E, guion y solo números)
create or replace function public._cedula(v text) returns text
language sql immutable as $$
  select case
    when v is null then null
    when upper(regexp_replace(v, '[^VEve0-9]', '', 'g')) ~ '^[VE][0-9]{6,9}$'
      then left(upper(regexp_replace(v, '[^VEve0-9]', '', 'g')), 1) || '-' || substr(upper(regexp_replace(v, '[^VEve0-9]', '', 'g')), 2)
    when regexp_replace(v, '[^0-9]', '', 'g') ~ '^[0-9]{6,9}$'
      then 'V-' || regexp_replace(v, '[^0-9]', '', 'g')
    else upper(v) end
$$;

-- Teléfono: guarda "04141234567" (11 dígitos)
create or replace function public._telefono(v text) returns text
language sql immutable as $$
  select case
    when regexp_replace(coalesce(v, ''), '[^0-9]', '', 'g') ~ '^58[0-9]{10}$' then '0' || substr(regexp_replace(v, '[^0-9]', '', 'g'), 3)
    when regexp_replace(coalesce(v, ''), '[^0-9]', '', 'g') ~ '^[24][0-9]{9}$' then '0' || regexp_replace(v, '[^0-9]', '', 'g')
    else regexp_replace(coalesce(v, ''), '[^0-9]', '', 'g') end
$$;

-- Normaliza los datos que ya existan
update public.perfiles set cedula = public._cedula(cedula) where cedula is not null and cedula <> public._cedula(cedula)
  and not exists (select 1 from public.perfiles x where x.cedula = public._cedula(perfiles.cedula) and x.id <> perfiles.id);
update public.perfiles set telefono = public._telefono(telefono) where telefono is not null;

-- ---------------------------------------------------------------------
-- 2. Datos de verificación en el perfil
-- ---------------------------------------------------------------------
alter table public.perfiles add column if not exists fecha_nacimiento date;
alter table public.perfiles add column if not exists estado_vzla text default '';
alter table public.perfiles add column if not exists ocupacion text default '';
alter table public.perfiles add column if not exists lugar_trabajo text default '';
alter table public.perfiles add column if not exists ingreso_rango text default '';
alter table public.perfiles add column if not exists ref_nombre text default '';
alter table public.perfiles add column if not exists ref_telefono text default '';
alter table public.perfiles add column if not exists ref_parentesco text default '';
alter table public.perfiles add column if not exists cedula_foto text;
alter table public.perfiles add column if not exists selfie_foto text;
alter table public.perfiles add column if not exists ubic_lat numeric(10,6);
alter table public.perfiles add column if not exists ubic_lng numeric(10,6);
alter table public.perfiles add column if not exists ubic_precision int;
alter table public.perfiles add column if not exists verificacion text not null default 'incompleto';
alter table public.perfiles add column if not exists verificacion_nota text;
alter table public.perfiles add column if not exists verificado_en timestamptz;
alter table public.perfiles add column if not exists verificado_por uuid;
do $$ begin
  alter table public.perfiles add constraint perfiles_verificacion_chk check (verificacion in ('incompleto','pendiente','verificado','rechazado'));
exception when duplicate_object then null; end $$;
-- Los administradores no necesitan verificarse
update public.perfiles set verificacion = 'verificado' where rol = 'admin' and verificacion = 'incompleto';

-- Perfil automático al registrarse (con cédula y teléfono normalizados)
create or replace function public._nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cfg configuracion := _cfg();
begin
  insert into perfiles(id, nombre, cedula, telefono, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
          coalesce(_cedula(new.raw_user_meta_data->>'cedula'), 'SIN-' || left(new.id::text, 8)),
          _telefono(new.raw_user_meta_data->>'telefono'), new.email);
  if v_cfg.cupon_codigo is not null then
    insert into notificaciones(usuario_id, texto)
    values (new.id, format('Bienvenido. Usa el cupón %s en tu primera compra y obtén %s%% de descuento.', v_cfg.cupon_codigo, round(v_cfg.cupon_pct * 100)));
  end if;
  return new;
end $$;

-- El cliente envía sus datos y documentos
create or replace function public.completar_verificacion(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); yo perfiles; v_nac date; v_tel text; v_ref text;
begin
  if uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  select * into yo from perfiles where id = uid;
  if yo.verificacion = 'verificado' then raise exception 'Tu identidad ya está verificada.'; end if;
  v_nac := (p->>'fecha_nacimiento')::date;
  if v_nac is null or v_nac > (hoy() - interval '18 years')::date then raise exception 'Debes ser mayor de edad para crear una cuenta.'; end if;
  if length(trim(coalesce(p->>'estado', ''))) < 3 or length(trim(coalesce(p->>'ciudad', ''))) < 3 or length(trim(coalesce(p->>'direccion', ''))) < 8 then
    raise exception 'Completa tu dirección: estado, ciudad y dirección.'; end if;
  if coalesce(p->>'ocupacion', '') = '' or coalesce(p->>'ingreso_rango', '') = '' then raise exception 'Indica tu ocupación e ingreso aproximado.'; end if;
  v_ref := _telefono(p->>'ref_telefono');
  if length(trim(coalesce(p->>'ref_nombre', ''))) < 5 or v_ref !~ '^0[0-9]{10}$' then raise exception 'Escribe el nombre y teléfono de una referencia personal.'; end if;
  if v_ref = yo.telefono then raise exception 'El teléfono de la referencia debe ser distinto al tuyo.'; end if;
  if coalesce(p->>'cedula_foto', '') !~ ('^' || uid::text || '/') or coalesce(p->>'selfie_foto', '') !~ ('^' || uid::text || '/') then
    raise exception 'Sube la foto de tu cédula y tu selfie con la cédula.'; end if;
  update perfiles set
    fecha_nacimiento = v_nac, estado_vzla = trim(p->>'estado'), ciudad = trim(p->>'ciudad'), direccion = trim(p->>'direccion'),
    ocupacion = p->>'ocupacion', lugar_trabajo = left(trim(coalesce(p->>'lugar_trabajo', '')), 120), ingreso_rango = p->>'ingreso_rango',
    ref_nombre = left(trim(p->>'ref_nombre'), 80), ref_telefono = v_ref, ref_parentesco = left(trim(coalesce(p->>'ref_parentesco', '')), 40),
    cedula_foto = p->>'cedula_foto', selfie_foto = p->>'selfie_foto',
    ubic_lat = nullif(p->>'lat', '')::numeric, ubic_lng = nullif(p->>'lng', '')::numeric, ubic_precision = nullif(p->>'precision', '')::numeric::int,
    verificacion = 'pendiente', verificacion_nota = null
  where id = uid;
  perform _log(format('Verificación enviada por %s', yo.nombre));
end $$;

-- El administrador aprueba o rechaza la identidad
create or replace function public.revisar_cliente(p_usuario uuid, p_estado text, p_nota text default null) returns void
language plpgsql security definer set search_path = public as $$
declare c perfiles;
begin
  perform _requiere_admin();
  if p_estado not in ('verificado','rechazado') then raise exception 'Estado no válido.'; end if;
  update perfiles set verificacion = p_estado, verificacion_nota = nullif(trim(p_nota), ''),
         verificado_en = now(), verificado_por = auth.uid()
   where id = p_usuario and rol = 'cliente' returning * into c;
  if not found then raise exception 'Cliente no encontrado.'; end if;
  perform _notificar(c.id, case when p_estado = 'verificado' then 'Tu identidad fue verificada. Ya puedes solicitar financiamiento.'
    else format('No pudimos verificar tu identidad: %s. Entra a Mi cuenta y vuelve a enviar tus documentos.', coalesce(lower(p_nota), 'revisa tus documentos')) end);
  perform _log(format('Cliente %s %s', c.nombre, case when p_estado = 'verificado' then 'verificado' else 'rechazado' end));
end $$;

-- Para cambiar teléfono/dirección desde "Mis datos"
create or replace function public.actualizar_mis_datos(p_telefono text, p_direccion text, p_ciudad text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if _telefono(p_telefono) !~ '^0[0-9]{10}$' then raise exception 'El teléfono debe tener 11 números, por ejemplo 04141234567.'; end if;
  update perfiles set telefono = _telefono(p_telefono), direccion = left(trim(p_direccion), 200), ciudad = left(trim(p_ciudad), 80)
   where id = auth.uid();
end $$;

-- Regla: para comprar hay que haber enviado la verificación
create or replace function public._chk_pedido() returns trigger
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  select verificacion into v from perfiles where id = new.usuario_id;
  if v = 'incompleto' then raise exception 'Antes de comprar completa la verificación de tu identidad en Mi cuenta.'; end if;
  if v = 'rechazado' then raise exception 'Tu verificación fue rechazada. Vuelve a enviar tus documentos desde Mi cuenta.'; end if;
  return new;
end $$;
drop trigger if exists chk_pedido on public.pedidos;
create trigger chk_pedido before insert on public.pedidos for each row execute function public._chk_pedido();

-- ---------------------------------------------------------------------
-- 3. Equipos financiables / solo de contado
-- ---------------------------------------------------------------------
alter table public.productos add column if not exists financiable boolean not null default true;
-- Accesorios de bajo precio quedan de contado por defecto
update public.productos set financiable = false where categoria = 'Accesorios' and precio < 100 and financiable;

create or replace function public._chk_credito() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  select pr.nombre into v_nom from pedido_items i join productos pr on pr.id = i.producto_id
   where i.pedido_id = new.pedido_id and not pr.financiable limit 1;
  if v_nom is not null then raise exception '% se vende solo de contado. Quítalo del carrito o paga de contado.', v_nom; end if;
  return new;
end $$;
drop trigger if exists chk_credito on public.creditos;
create trigger chk_credito before insert on public.creditos for each row execute function public._chk_credito();

create or replace function public.cambiar_financiable(pid int, valor boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  perform _requiere_admin();
  update productos set financiable = valor where id = pid returning nombre into v_nom;
  perform _log(format('%s marcado como %s', v_nom, case when valor then 'financiable' else 'solo de contado' end));
end $$;

-- ---------------------------------------------------------------------
-- 4. Trabaja con nosotros (postulaciones)
-- ---------------------------------------------------------------------
alter table public.configuracion add column if not exists postulacion jsonb not null default '{
  "activo": true,
  "titulo": "Trabaja con nosotros",
  "texto": "Buscamos personas para promocionar y vender nuestros equipos. Completa el formulario y te contactaremos por WhatsApp.",
  "preguntas": [
    {"id":"edad","texto":"¿Qué edad tienes?","tipo":"numero","requerida":true},
    {"id":"zona","texto":"¿En qué zona o sector vives?","tipo":"texto","requerida":true},
    {"id":"cargo","texto":"¿Qué te gustaría hacer?","tipo":"opcion","requerida":true,
      "opciones":["Vendedor en tienda","Promotor en la calle o eventos","Vendedor por redes sociales (comisión)","Repartidor"]},
    {"id":"experiencia","texto":"¿Tienes experiencia en ventas?","tipo":"opcion","requerida":true,
      "opciones":["No, sería mi primera vez","Menos de 1 año","De 1 a 3 años","Más de 3 años"]},
    {"id":"redes","texto":"¿Qué redes sociales usas más? (Instagram, TikTok, Facebook, WhatsApp…)","tipo":"texto","requerida":false},
    {"id":"seguidores","texto":"¿Cuántos seguidores tienes aproximadamente?","tipo":"opcion","requerida":false,
      "opciones":["Menos de 500","500 a 2.000","2.000 a 10.000","Más de 10.000"]},
    {"id":"disponibilidad","texto":"¿Qué disponibilidad de horario tienes?","tipo":"opcion","requerida":true,
      "opciones":["Tiempo completo","Medio tiempo","Solo fines de semana","Horario flexible"]},
    {"id":"transporte","texto":"¿Tienes moto o carro propio?","tipo":"si_no","requerida":true},
    {"id":"motivo","texto":"Cuéntanos por qué quieres trabajar con nosotros","tipo":"parrafo","requerida":true}
  ]}';

create table if not exists public.postulaciones (
  id          bigint generated always as identity (start with 101) primary key,
  codigo      text generated always as ('POS-' || id) stored,
  nombre      text not null,
  cedula      text not null,
  telefono    text not null,
  ciudad      text not null,
  respuestas  jsonb not null default '{}',
  estado      text not null default 'nueva' check (estado in ('nueva','contactada','entrevista','contratada','descartada')),
  nota        text,
  creado_en   timestamptz not null default now()
);
alter table public.postulaciones enable row level security;
drop policy if exists ver_postulaciones on public.postulaciones;
create policy ver_postulaciones on public.postulaciones for select using (es_admin());

create or replace function public.postular(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); q jsonb; v_resp jsonb := '{}'; v_val text; v_ced text; v_tel text; v_id bigint; v_cod text;
begin
  if not coalesce((cfg.postulacion->>'activo')::boolean, true) then raise exception 'Por ahora no estamos recibiendo postulaciones.'; end if;
  v_ced := _cedula(p->>'cedula'); v_tel := _telefono(p->>'telefono');
  if length(trim(coalesce(p->>'nombre', ''))) < 5 then raise exception 'Escribe tu nombre y apellido.'; end if;
  if v_ced !~ '^[VE]-[0-9]{6,9}$' then raise exception 'Escribe tu cédula solo con números.'; end if;
  if v_tel !~ '^0[0-9]{10}$' then raise exception 'Escribe tu teléfono de 11 números, por ejemplo 04141234567.'; end if;
  if length(trim(coalesce(p->>'ciudad', ''))) < 3 then raise exception 'Escribe tu ciudad.'; end if;
  if exists (select 1 from postulaciones where cedula = v_ced and creado_en > now() - interval '7 days') then
    raise exception 'Ya recibimos una postulación con esta cédula esta semana. Te contactaremos pronto.'; end if;
  for q in select * from jsonb_array_elements(cfg.postulacion->'preguntas') loop
    v_val := left(trim(coalesce(p->'respuestas'->>(q->>'id'), '')), 1000);
    if coalesce((q->>'requerida')::boolean, false) and v_val = '' then raise exception 'Responde: %', q->>'texto'; end if;
    if v_val <> '' then v_resp := v_resp || jsonb_build_object(q->>'texto', v_val); end if;
  end loop;
  insert into postulaciones(nombre, cedula, telefono, ciudad, respuestas)
  values (left(trim(p->>'nombre'), 80), v_ced, v_tel, left(trim(p->>'ciudad'), 80), v_resp) returning id, codigo into v_id, v_cod;
  insert into bitacora(actor, accion) values ('Sistema', format('Nueva postulación %s de %s', v_cod, trim(p->>'nombre')));
  return jsonb_build_object('codigo', v_cod);
end $$;

create or replace function public.actualizar_postulacion(pid bigint, p_estado text, p_nota text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_cod text;
begin
  perform _requiere_admin();
  update postulaciones set estado = p_estado, nota = coalesce(nullif(trim(p_nota), ''), nota) where id = pid returning codigo into v_cod;
  if not found then raise exception 'Postulación no encontrada.'; end if;
  perform _log(format('Postulación %s pasó a %s', v_cod, p_estado));
end $$;

create or replace function public.actualizar_preguntas(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _requiere_admin();
  if jsonb_typeof(p->'preguntas') <> 'array' then raise exception 'Formato de preguntas no válido.'; end if;
  update configuracion set postulacion = p where id = 1;
  perform _log('Preguntas de postulación actualizadas');
end $$;

-- ---------------------------------------------------------------------
-- 5. Almacenamiento privado de documentos de identidad
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists subir_documento on storage.objects;
create policy subir_documento on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists ver_documento on storage.objects;
create policy ver_documento on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));

-- ---------------------------------------------------------------------
-- 6. Permisos
-- ---------------------------------------------------------------------
revoke execute on function public._chk_pedido(), public._chk_credito() from public, anon, authenticated;
revoke execute on function public.completar_verificacion(jsonb), public.revisar_cliente(uuid, text, text),
  public.cambiar_financiable(int, boolean), public.actualizar_postulacion(bigint, text, text), public.actualizar_preguntas(jsonb)
  from public, anon;
grant execute on function public.completar_verificacion(jsonb), public.revisar_cliente(uuid, text, text),
  public.cambiar_financiable(int, boolean), public.actualizar_postulacion(bigint, text, text), public.actualizar_preguntas(jsonb)
  to authenticated;
-- Cualquier visitante puede postularse (sin cuenta)
grant execute on function public.postular(jsonb) to anon, authenticated;

-- >>>>>>>>>> 06_ajustes.sql
-- =====================================================================
--  MovilCenter · Ajustes 06
--  - La verificación de identidad solo se exige para comprar en cuotas
--    (de contado se compra apenas se crea la cuenta).
--  - Sin referencia personal; la segunda foto es una foto de la persona.
--  - Al aprobar un crédito, la identidad del cliente queda verificada.
--  - Preguntas de empleo para ventas online.
--  Ejecutar DESPUÉS de 05_actualizacion.sql. Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Comprar de contado ya no exige verificación
drop trigger if exists chk_pedido on public.pedidos;
drop function if exists public._chk_pedido();

-- 2. Para financiar sí: documentos enviados y no rechazados; equipos financiables
create or replace function public._chk_credito() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nom text; v_ver text;
begin
  select verificacion into v_ver from perfiles where id = new.usuario_id;
  if v_ver = 'incompleto' then raise exception 'Para comprar en cuotas primero verifica tu identidad (Mi cuenta → Verificación).'; end if;
  if v_ver = 'rechazado' then raise exception 'Tu verificación fue rechazada. Vuelve a enviar tus documentos para comprar en cuotas.'; end if;
  select pr.nombre into v_nom from pedido_items i join productos pr on pr.id = i.producto_id
   where i.pedido_id = new.pedido_id and not pr.financiable limit 1;
  if v_nom is not null then raise exception '% se vende solo de contado. Quítalo del carrito o paga de contado.', v_nom; end if;
  return new;
end $$;

-- 3. Verificación sin referencia personal (foto de la cédula + foto de la persona)
create or replace function public.completar_verificacion(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); yo perfiles; v_nac date;
begin
  if uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  select * into yo from perfiles where id = uid;
  if yo.verificacion = 'verificado' then raise exception 'Tu identidad ya está verificada.'; end if;
  v_nac := (p->>'fecha_nacimiento')::date;
  if v_nac is null or v_nac > (hoy() - interval '18 years')::date then raise exception 'Debes ser mayor de edad para comprar en cuotas.'; end if;
  if length(trim(coalesce(p->>'estado', ''))) < 3 or length(trim(coalesce(p->>'ciudad', ''))) < 3 or length(trim(coalesce(p->>'direccion', ''))) < 8 then
    raise exception 'Completa tu dirección: estado, ciudad y dirección.'; end if;
  if coalesce(p->>'ocupacion', '') = '' or coalesce(p->>'ingreso_rango', '') = '' then raise exception 'Indica tu ocupación e ingreso aproximado.'; end if;
  if coalesce(p->>'cedula_foto', '') !~ ('^' || uid::text || '/') or coalesce(p->>'selfie_foto', '') !~ ('^' || uid::text || '/') then
    raise exception 'Sube la foto de tu cédula y una foto tuya.'; end if;
  update perfiles set
    fecha_nacimiento = v_nac, estado_vzla = trim(p->>'estado'), ciudad = trim(p->>'ciudad'), direccion = trim(p->>'direccion'),
    ocupacion = p->>'ocupacion', lugar_trabajo = left(trim(coalesce(p->>'lugar_trabajo', '')), 120), ingreso_rango = p->>'ingreso_rango',
    cedula_foto = p->>'cedula_foto', selfie_foto = p->>'selfie_foto',
    ubic_lat = nullif(p->>'lat', '')::numeric, ubic_lng = nullif(p->>'lng', '')::numeric, ubic_precision = nullif(p->>'precision', '')::numeric::int,
    verificacion = 'pendiente', verificacion_nota = null
  where id = uid;
  perform _log(format('Verificación enviada por %s', yo.nombre));
end $$;

-- 4. Al aprobar un crédito, la identidad queda verificada (una sola revisión)
create or replace function public._verificar_al_aprobar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'activo' and old.estado = 'evaluacion' then
    update perfiles set verificacion = 'verificado', verificado_en = now(), verificado_por = auth.uid()
     where id = new.usuario_id and verificacion = 'pendiente';
  end if;
  return new;
end $$;
drop trigger if exists verificar_al_aprobar on public.creditos;
create trigger verificar_al_aprobar after update of estado on public.creditos for each row execute function public._verificar_al_aprobar();
revoke execute on function public._verificar_al_aprobar() from public, anon, authenticated;

-- 5. Preguntas de empleo (solo ventas online)
update public.configuracion set postulacion = '{
  "activo": true,
  "titulo": "Trabaja con nosotros",
  "texto": "Buscamos personas para vender nuestros equipos por internet, desde sus redes sociales y WhatsApp, y ganar comisión por cada venta. Completa el formulario y te contactaremos.",
  "preguntas": [
    {"id":"edad","texto":"¿Qué edad tienes?","tipo":"numero","requerida":true},
    {"id":"zona","texto":"¿En qué zona o sector vives?","tipo":"texto","requerida":true},
    {"id":"experiencia","texto":"¿Tienes experiencia en ventas?","tipo":"opcion","requerida":true,
      "opciones":["No, sería mi primera vez","Menos de 1 año","De 1 a 3 años","Más de 3 años"]},
    {"id":"online","texto":"¿Has vendido productos por internet o redes sociales?","tipo":"si_no","requerida":true},
    {"id":"redes","texto":"¿Qué redes sociales usas para vender? (Instagram, TikTok, Facebook, WhatsApp…)","tipo":"texto","requerida":false},
    {"id":"disponibilidad","texto":"¿Cuánto tiempo al día podrías dedicarle?","tipo":"opcion","requerida":true,
      "opciones":["Tiempo completo","Medio tiempo","Algunas horas al día","Solo fines de semana"]},
    {"id":"motivo","texto":"Cuéntanos por qué quieres trabajar con nosotros","tipo":"parrafo","requerida":true}
  ]}'::jsonb
where id = 1;

-- >>>>>>>>>> 07_multitienda.sql
-- =====================================================================
--  Actualización 07 · Dos tiendas en una sola página
--  Priority One y Papa's Store comparten la página, las cuentas de los
--  clientes y la verificación de identidad. Cada tienda tiene su propio
--  catálogo, pedidos, créditos, pagos, datos de cobro y panel.
--
--  Administradores:
--    · Admin de una tienda  → perfiles.rol = 'admin' y perfiles.tienda_id = 1 o 2.
--      Solo ve y gestiona lo de su tienda.
--    · Admin general        → perfiles.rol = 'admin' y tienda_id vacío.
--      Ve las dos tiendas (opcional, por ejemplo para el dueño de la página).
--
--  Ejecutar DESPUÉS de 01 a 06. Se puede ejecutar más de una vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tiendas
-- ---------------------------------------------------------------------
create table if not exists public.tiendas (
  id          int primary key,
  slug        text not null unique,
  nombre      text not null,
  logo_url    text,
  color       text not null default '#D2AE3E',
  eslogan     text not null default '',
  frases      jsonb not null default '[]',      -- [{"k":"Etiqueta","t":"Título","p":"Texto"}]
  whatsapp    text not null default '',
  correo      text not null default '',
  rif         text not null default '',
  direccion   text not null default '',
  horario     text not null default '',
  datos_pago  jsonb not null default '{}',
  orden       int not null default 1,
  activo      boolean not null default true,
  actualizado_en timestamptz not null default now()
);

insert into public.tiendas (id, slug, nombre, color, eslogan, frases, datos_pago, orden) values
 (1, 'priority-one', 'Priority One', '#D2AE3E',
  'Tu prioridad, nuestra misión.',
  '[{"k":"Priority One","t":"Tu equipo,<br><em>primero.</em>","p":"Atención directa, equipos originales y respuesta el mismo día."},
    {"k":"Priority One","t":"Lo último,<br><em>sin esperar.</em>","p":"Los modelos más buscados, disponibles de contado o en cuotas."}]',
  (select datos_pago from public.configuracion where id = 1), 1),
 (2, 'papas-store', 'Papa''s Store', '#C9A227',
  'Tecnología con confianza de familia.',
  '[{"k":"Papa''s Store","t":"Confianza<br><em>de familia.</em>","p":"Te atendemos como en casa: claro, cercano y sin letras pequeñas."},
    {"k":"Papa''s Store","t":"Estrénalo hoy,<br><em>págalo a tu ritmo.</em>","p":"Planes de 3, 6 o 9 meses con una inicial desde el 30%."}]',
  (select datos_pago from public.configuracion where id = 1), 2)
on conflict (id) do nothing;

alter table public.tiendas enable row level security;
drop policy if exists ver_tiendas on public.tiendas;
create policy ver_tiendas on public.tiendas for select using (true);

-- ---------------------------------------------------------------------
-- 2. Columnas de tienda
-- ---------------------------------------------------------------------
alter table public.perfiles      add column if not exists tienda_id int references public.tiendas(id);
alter table public.productos     add column if not exists tienda_id int references public.tiendas(id);
alter table public.pedidos       add column if not exists tienda_id int references public.tiendas(id);
alter table public.creditos      add column if not exists tienda_id int references public.tiendas(id);
alter table public.pagos         add column if not exists tienda_id int references public.tiendas(id);
alter table public.postulaciones add column if not exists tienda_id int references public.tiendas(id);
alter table public.bitacora      add column if not exists tienda_id int references public.tiendas(id);

-- Datos que ya existían: productos y pedidos van a Priority One salvo que se indique otra cosa
update public.productos set tienda_id = 1 where tienda_id is null;
alter table public.productos alter column tienda_id set default 1;
alter table public.productos alter column tienda_id set not null;
update public.pedidos o set tienda_id = coalesce((select pr.tienda_id from public.pedido_items i join public.productos pr on pr.id = i.producto_id
                                                  where i.pedido_id = o.id limit 1), 1) where tienda_id is null;
update public.creditos c set tienda_id = (select tienda_id from public.pedidos where id = c.pedido_id) where tienda_id is null;
update public.pagos g set tienda_id = coalesce((select tienda_id from public.pedidos where id = g.pedido_id),
                                               (select tienda_id from public.creditos where id = g.credito_id)) where tienda_id is null;
create index if not exists productos_tienda_idx on public.productos(tienda_id);
create index if not exists pedidos_tienda_idx on public.pedidos(tienda_id);
create index if not exists creditos_tienda_idx on public.creditos(tienda_id);
create index if not exists pagos_tienda_idx on public.pagos(tienda_id);

-- ---------------------------------------------------------------------
-- 3. Permisos por tienda
-- ---------------------------------------------------------------------
-- Tienda del administrador conectado (vacío = admin general)
create or replace function public.mi_tienda_admin() returns int
language sql stable security definer set search_path = public as $$
  select tienda_id from perfiles where id = auth.uid() and rol = 'admin'
$$;

create or replace function public.es_admin_general() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin' and tienda_id is null)
$$;

create or replace function public.es_admin_de(t int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin' and (tienda_id is null or tienda_id = t))
$$;

-- Tienda con la que se está trabajando en esta operación (para la bitácora y el cupo)
create or replace function public._tienda_actual() returns int
language sql stable as $$ select nullif(current_setting('app.tienda', true), '')::int $$;

create or replace function public._usar_tienda(t int) returns void
language sql as $$ select set_config('app.tienda', coalesce(t::text, ''), true) $$;

create or replace function public._requiere_admin_de(t int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin_de(t) then raise exception 'Esta operación es de otra tienda o requiere un administrador.'; end if;
  perform _usar_tienda(t);
end $$;

-- El cliente tiene relación con la tienda del admin (para ver su perfil y documentos)
create or replace function public._cliente_de_mi_tienda(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_admin_general() or (mi_tienda_admin() is not null and exists (
    select 1 from pedidos where usuario_id = uid and tienda_id = mi_tienda_admin()))
$$;

create or replace function public._cliente_de_mi_tienda_txt(folder text) returns boolean
language sql stable security definer set search_path = public as $$
  select es_admin_general() or (mi_tienda_admin() is not null and exists (
    select 1 from pedidos where usuario_id::text = folder and tienda_id = mi_tienda_admin()))
$$;

-- Bitácora con la tienda de la operación
create or replace function public._log(accion text) returns void
language plpgsql security definer set search_path = public as $$
declare v_actor text;
begin
  select nombre into v_actor from perfiles where id = auth.uid();
  insert into bitacora(usuario_id, actor, accion, tienda_id) values (auth.uid(), coalesce(v_actor, 'Sistema'), accion, _tienda_actual());
end $$;

-- ---------------------------------------------------------------------
-- 4. Cada pedido pertenece a una sola tienda
-- ---------------------------------------------------------------------
create or replace function public._item_tienda() returns trigger
language plpgsql security definer set search_path = public as $$
declare t int; actual int; nom text;
begin
  select tienda_id into t from productos where id = new.producto_id;
  select tienda_id into actual from pedidos where id = new.pedido_id;
  if actual is null then
    update pedidos set tienda_id = t where id = new.pedido_id;
    perform _usar_tienda(t);
  elsif actual <> t then
    select nombre into nom from tiendas where id = actual;
    raise exception 'Cada tienda se paga por separado. Este pedido es de %; compra los productos de la otra tienda en otro pedido.', nom;
  end if;
  return new;
end $$;
drop trigger if exists item_tienda on public.pedido_items;
create trigger item_tienda before insert on public.pedido_items for each row execute function public._item_tienda();

create or replace function public._credito_tienda() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.tienda_id := (select tienda_id from pedidos where id = new.pedido_id);
  return new;
end $$;
drop trigger if exists credito_tienda on public.creditos;
create trigger credito_tienda before insert on public.creditos for each row execute function public._credito_tienda();

create or replace function public._pago_tienda() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.tienda_id := coalesce((select tienda_id from pedidos where id = new.pedido_id),
                            (select tienda_id from creditos where id = new.credito_id));
  return new;
end $$;
drop trigger if exists pago_tienda on public.pagos;
create trigger pago_tienda before insert on public.pagos for each row execute function public._pago_tienda();

-- ---------------------------------------------------------------------
-- 5. Cupo de crédito por tienda (cada tienda arriesga su propio dinero).
--    Una cuota vencida en cualquiera de las dos tiendas bloquea pedir
--    un crédito nuevo.
-- ---------------------------------------------------------------------
create or replace function public._elegibilidad(uid uuid, financiado numeric) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare cfg configuracion := _cfg(); t int := _tienda_actual(); liquidados int; limite numeric; usado numeric; activos int; mora boolean; motivos text[] := '{}';
begin
  select count(*) into liquidados from creditos where usuario_id = uid and estado = 'liquidado' and (t is null or tienda_id = t);
  limite := least(cfg.cupo_max, cfg.cupo_base + cfg.cupo_por_liquidado * liquidados);
  select coalesce(sum(case when c.estado = 'evaluacion' then c.monto_financiado
                           else (select coalesce(sum(q.monto), 0) from cuotas q where q.credito_id = c.id and q.estado <> 'pagada') end), 0),
         count(*) filter (where c.estado in ('evaluacion','activo','en_mora'))
    into usado, activos
    from creditos c where c.usuario_id = uid and c.estado in ('evaluacion','activo','en_mora') and (t is null or c.tienda_id = t);
  select coalesce(bool_or(estado = 'en_mora'), false) into mora from creditos where usuario_id = uid;
  if mora then motivos := array_append(motivos, 'Tienes un crédito con cuotas vencidas. Ponte al día para solicitar uno nuevo.'::text); end if;
  if activos >= cfg.max_creditos then motivos := array_append(motivos, format('Ya tienes %s créditos abiertos en esta tienda (máximo %s).', activos, cfg.max_creditos)); end if;
  if financiado is not null and financiado > limite - usado then
    motivos := array_append(motivos, format('El monto a financiar (%s) supera tu cupo disponible en esta tienda (%s). Sube la inicial o reduce el carrito.',
                                 _usd(financiado), _usd(greatest(0, limite - usado))));
  end if;
  return jsonb_build_object('limite', limite, 'usado', round(usado, 2), 'disponible', greatest(0, round(limite - usado, 2)),
                            'activos', activos, 'en_mora', mora, 'liquidados', liquidados,
                            'ok', cardinality(motivos) = 0, 'motivos', to_jsonb(motivos));
end $$;

drop function if exists public.mi_cupo(numeric);
create or replace function public.mi_cupo(financiado numeric default null, p_tienda int default null) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión para continuar.'; end if;
  perform _usar_tienda(p_tienda);
  return _elegibilidad(auth.uid(), financiado);
end $$;

drop function if exists public.cupo_cliente(uuid);
create or replace function public.cupo_cliente(p_usuario uuid, p_tienda int default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t int := coalesce(p_tienda, mi_tienda_admin());
begin
  if t is null then perform _requiere_admin(); else perform _requiere_admin_de(t); end if;
  perform _usar_tienda(t);
  return _elegibilidad(p_usuario, null);
end $$;

-- ---------------------------------------------------------------------
-- 6. Funciones del administrador, limitadas a su tienda
-- ---------------------------------------------------------------------
create or replace function public.aprobar_pago(pid bigint) returns text
language plpgsql security definer set search_path = public as $$
begin perform _requiere_admin_de((select tienda_id from pagos where id = pid)); return _aprobar_pago(pid); end $$;

create or replace function public.rechazar_pago(pid bigint, nota text) returns text
language plpgsql security definer set search_path = public as $$
declare g pagos; cfg configuracion := _cfg();
begin
  select * into g from pagos where id = pid for update;
  perform _requiere_admin_de(g.tienda_id);
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
  select * into g from pagos where id = pid for update;
  perform _requiere_admin_de(g.tienda_id);
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
  select * into q from cuotas where id = p_cuota; select * into c from creditos where id = q.credito_id;
  perform _requiere_admin_de(c.tienda_id);
  update cuotas set mora = 0 where id = p_cuota;
  perform _notificar(c.usuario_id, format('Se condonó la mora de tu cuota %s del crédito %s.', q.numero, c.codigo));
  perform _log(format('Mora condonada en %s cuota %s', c.codigo, q.numero));
end $$;

create or replace function public.pago_en_caja(p_pedido bigint default null, p_cuota bigint default null) returns text
language plpgsql security definer set search_path = public as $$
declare o pedidos; c creditos; q cuotas; v_pago bigint; cfg configuracion := _cfg(); v_ref text := 'CAJA' || to_char(clock_timestamp(), 'YYMMDDHH24MISSUS');
begin
  if p_cuota is not null then
    select * into q from cuotas where id = p_cuota and estado = 'pendiente';
    if not found then raise exception 'La cuota no está pendiente.'; end if;
    select * into c from creditos where id = q.credito_id;
    perform _requiere_admin_de(c.tienda_id);
    insert into pagos(usuario_id, credito_id, tipo, metodo, moneda, referencia, monto_esperado_usd, monto_reportado, tasa)
    values (c.usuario_id, c.id, 'cuota', 'efectivo', 'USD', v_ref, q.monto + q.mora, q.monto + q.mora, cfg.tasa) returning id into v_pago;
    insert into pago_cuotas values (v_pago, q.id);
  else
    select * into o from pedidos where id = p_pedido and estado in ('pendiente_pago','pago_rechazado');
    if not found then raise exception 'El pedido no está pendiente de pago.'; end if;
    perform _requiere_admin_de(o.tienda_id);
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
  perform _requiere_admin_de((select tienda_id from pedidos where id = pid));
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
  perform _requiere_admin_de((select tienda_id from pedidos where id = pid));
  update pedidos set estado = 'entregado' where id = pid and estado in ('enviado','listo_retiro') returning * into o;
  if not found then raise exception 'El pedido no está enviado ni listo para retiro.'; end if;
  perform _notificar(o.usuario_id, format('Tu pedido %s fue entregado. ¡Gracias por tu compra!', o.codigo));
  perform _log(format('Pedido %s entregado', o.codigo));
end $$;

create or replace function public.ajustar_stock(pid int, delta int) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  update productos set stock = greatest(0, stock + delta) where id = pid returning stock into v;
  perform _log(format('Ajuste de inventario producto %s: %s (queda %s)', pid, delta, v));
  return v;
end $$;

create or replace function public.cambiar_financiable(pid int, valor boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_nom text;
begin
  perform _requiere_admin_de((select tienda_id from productos where id = pid));
  update productos set financiable = valor where id = pid returning nombre into v_nom;
  perform _log(format('%s marcado como %s', v_nom, case when valor then 'financiable' else 'solo de contado' end));
end $$;

-- Verificar o rechazar la identidad de un cliente que compra en mi tienda
create or replace function public.revisar_cliente(p_usuario uuid, p_estado text, p_nota text default null) returns void
language plpgsql security definer set search_path = public as $$
declare c perfiles;
begin
  perform _requiere_admin();
  if not _cliente_de_mi_tienda(p_usuario) then raise exception 'Este cliente no tiene pedidos en tu tienda.'; end if;
  perform _usar_tienda(mi_tienda_admin());
  if p_estado not in ('verificado','rechazado') then raise exception 'Estado no válido.'; end if;
  update perfiles set verificacion = p_estado, verificacion_nota = nullif(trim(p_nota), ''),
         verificado_en = now(), verificado_por = auth.uid()
   where id = p_usuario and rol = 'cliente' returning * into c;
  if not found then raise exception 'Cliente no encontrado.'; end if;
  perform _notificar(c.id, case when p_estado = 'verificado' then 'Tu identidad fue verificada. Ya puedes solicitar financiamiento.'
    else format('No pudimos verificar tu identidad: %s. Entra a Mi cuenta y vuelve a enviar tus documentos.', coalesce(lower(p_nota), 'revisa tus documentos')) end);
  perform _log(format('Cliente %s %s', c.nombre, case when p_estado = 'verificado' then 'verificado' else 'rechazado' end));
end $$;

-- Configuración común (tasa del día, mora, planes, cupo). Cualquier admin puede cambiarla;
-- queda registrado en la bitácora quién lo hizo.
create or replace function public.actualizar_config(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _requiere_admin();
  if (p->>'tasa')::numeric <= 0 or (p->>'mora')::numeric < 0 or (p->>'inicial_min')::numeric not between 0 and 0.9
     or (p->>'min_financiable')::numeric < 0 or (p->>'cupo_base')::numeric < 0 then
    raise exception 'Revisa los valores de la configuración.';
  end if;
  perform _usar_tienda(mi_tienda_admin());
  update configuracion set tasa = (p->>'tasa')::numeric, mora = (p->>'mora')::numeric,
         inicial_min = (p->>'inicial_min')::numeric, min_financiable = (p->>'min_financiable')::numeric,
         cupo_base = (p->>'cupo_base')::numeric, planes = coalesce(p->'planes', planes), actualizado_en = now()
   where id = 1;
  perform _log(format('Configuración común actualizada (tasa %s, mora %s)', p->>'tasa', p->>'mora'));
end $$;

-- Datos propios de cada tienda: logo, eslogan, frases, contacto y datos de pago
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
         datos_pago = coalesce(p->'datos_pago', datos_pago), actualizado_en = now()
   where id = t;
  perform _log('Datos de la tienda actualizados');
end $$;

-- Crear o editar productos desde el panel
create or replace function public.guardar_producto(p jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare v_id int := nullif(p->>'id', '')::int; t int; v_cat text := p->>'categoria';
begin
  if v_id is not null then select tienda_id into t from productos where id = v_id;
  else t := coalesce(mi_tienda_admin(), nullif(p->>'tienda_id', '')::int); end if;
  if t is null then raise exception 'Elige la tienda del producto.'; end if;
  perform _requiere_admin_de(t);
  if length(trim(coalesce(p->>'nombre', ''))) < 2 then raise exception 'Escribe el nombre del producto.'; end if;
  if v_cat not in ('Teléfonos','Tablets','Smartwatch','Audio','Accesorios') then raise exception 'Elige la categoría.'; end if;
  if coalesce((p->>'precio')::numeric, -1) < 0 then raise exception 'Escribe un precio válido.'; end if;
  if v_id is null then
    insert into productos(tienda_id, marca, nombre, categoria, forma, precio, stock, colores, capacidades, specs, descripcion, imagen_url, financiable, activo, orden)
    values (t, left(trim(coalesce(p->>'marca', '')), 40), left(trim(p->>'nombre'), 80), v_cat,
            case v_cat when 'Tablets' then 'tablet' when 'Smartwatch' then 'watch' when 'Audio' then 'buds' when 'Accesorios' then 'charger' else 'phone' end,
            (p->>'precio')::numeric, greatest(0, coalesce((p->>'stock')::int, 0)),
            coalesce(p->'colores', '[{"n":"Único","hex":"#777777"}]'), nullif(p->'capacidades', '[]'::jsonb), coalesce(p->'specs', '{}'),
            left(coalesce(p->>'descripcion', ''), 600), nullif(trim(coalesce(p->>'imagen_url', '')), ''),
            coalesce((p->>'financiable')::boolean, true), coalesce((p->>'activo')::boolean, true), coalesce((p->>'orden')::int, 100))
    returning id into v_id;
    perform _log(format('Producto creado: %s', trim(p->>'nombre')));
  else
    update productos set marca = left(trim(coalesce(p->>'marca', marca)), 40), nombre = left(trim(p->>'nombre'), 80), categoria = v_cat,
           precio = (p->>'precio')::numeric, colores = coalesce(p->'colores', colores), capacidades = case when p ? 'capacidades' then nullif(p->'capacidades', '[]'::jsonb) else capacidades end,
           specs = coalesce(p->'specs', specs), descripcion = left(coalesce(p->>'descripcion', descripcion), 600),
           imagen_url = case when p ? 'imagen_url' then nullif(trim(p->>'imagen_url'), '') else imagen_url end,
           financiable = coalesce((p->>'financiable')::boolean, financiable), activo = coalesce((p->>'activo')::boolean, activo),
           orden = coalesce((p->>'orden')::int, orden)
     where id = v_id;
    perform _log(format('Producto editado: %s', trim(p->>'nombre')));
  end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 7. Postulaciones: el aspirante elige la tienda (o ambas)
-- ---------------------------------------------------------------------
create or replace function public.postular(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cfg configuracion := _cfg(); q jsonb; v_resp jsonb := '{}'; v_val text; v_ced text; v_tel text; v_id bigint; v_cod text;
        v_t int := nullif(p->>'tienda_id', '')::int;
begin
  if not coalesce((cfg.postulacion->>'activo')::boolean, true) then raise exception 'Por ahora no estamos recibiendo postulaciones.'; end if;
  if v_t is not null and not exists (select 1 from tiendas where id = v_t and activo) then raise exception 'Tienda no válida.'; end if;
  v_ced := _cedula(p->>'cedula'); v_tel := _telefono(p->>'telefono');
  if length(trim(coalesce(p->>'nombre', ''))) < 5 then raise exception 'Escribe tu nombre y apellido.'; end if;
  if v_ced !~ '^[VE]-[0-9]{6,9}$' then raise exception 'Escribe tu cédula solo con números.'; end if;
  if v_tel !~ '^0[0-9]{10}$' then raise exception 'Escribe tu teléfono de 11 números, por ejemplo 04141234567.'; end if;
  if length(trim(coalesce(p->>'ciudad', ''))) < 3 then raise exception 'Escribe tu ciudad.'; end if;
  if exists (select 1 from postulaciones where cedula = v_ced and creado_en > now() - interval '7 days') then
    raise exception 'Ya recibimos una postulación con esta cédula esta semana. Te contactaremos pronto.'; end if;
  for q in select * from jsonb_array_elements(cfg.postulacion->'preguntas') loop
    v_val := left(trim(coalesce(p->'respuestas'->>(q->>'id'), '')), 1000);
    if coalesce((q->>'requerida')::boolean, false) and v_val = '' then raise exception 'Responde: %', q->>'texto'; end if;
    if v_val <> '' then v_resp := v_resp || jsonb_build_object(q->>'texto', v_val); end if;
  end loop;
  insert into postulaciones(nombre, cedula, telefono, ciudad, respuestas, tienda_id)
  values (left(trim(p->>'nombre'), 80), v_ced, v_tel, left(trim(p->>'ciudad'), 80), v_resp, v_t) returning id, codigo into v_id, v_cod;
  insert into bitacora(actor, accion, tienda_id) values ('Sistema', format('Nueva postulación %s de %s', v_cod, trim(p->>'nombre')), v_t);
  return jsonb_build_object('codigo', v_cod);
end $$;

create or replace function public.actualizar_postulacion(pid bigint, p_estado text, p_nota text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_cod text; v_t int;
begin
  select tienda_id into v_t from postulaciones where id = pid;
  if v_t is null then perform _requiere_admin(); else perform _requiere_admin_de(v_t); end if;
  perform _usar_tienda(coalesce(v_t, mi_tienda_admin()));
  update postulaciones set estado = p_estado, nota = coalesce(nullif(trim(p_nota), ''), nota) where id = pid returning codigo into v_cod;
  if not found then raise exception 'Postulación no encontrada.'; end if;
  perform _log(format('Postulación %s pasó a %s', v_cod, p_estado));
end $$;

-- ---------------------------------------------------------------------
-- 8. Qué ve cada quién (RLS)
-- ---------------------------------------------------------------------
drop policy if exists ver_productos on public.productos;
create policy ver_productos on public.productos for select using (activo or es_admin_de(tienda_id));
drop policy if exists ver_perfil on public.perfiles;
create policy ver_perfil on public.perfiles for select using (id = auth.uid() or (es_admin() and (rol = 'admin' or _cliente_de_mi_tienda(id))));
drop policy if exists ver_pedidos on public.pedidos;
create policy ver_pedidos on public.pedidos for select using (usuario_id = auth.uid() or es_admin_de(tienda_id));
drop policy if exists ver_items on public.pedido_items;
create policy ver_items on public.pedido_items for select
  using (exists (select 1 from pedidos o where o.id = pedido_id and (o.usuario_id = auth.uid() or es_admin_de(o.tienda_id))));
drop policy if exists ver_creditos on public.creditos;
create policy ver_creditos on public.creditos for select using (usuario_id = auth.uid() or es_admin_de(tienda_id));
drop policy if exists ver_cuotas on public.cuotas;
create policy ver_cuotas on public.cuotas for select
  using (exists (select 1 from creditos c where c.id = credito_id and (c.usuario_id = auth.uid() or es_admin_de(c.tienda_id))));
drop policy if exists ver_pagos on public.pagos;
create policy ver_pagos on public.pagos for select using (usuario_id = auth.uid() or es_admin_de(tienda_id));
drop policy if exists ver_pago_cuotas on public.pago_cuotas;
create policy ver_pago_cuotas on public.pago_cuotas for select
  using (exists (select 1 from pagos g where g.id = pago_id and (g.usuario_id = auth.uid() or es_admin_de(g.tienda_id))));
drop policy if exists ver_bitacora on public.bitacora;
create policy ver_bitacora on public.bitacora for select using (es_admin_general() or (es_admin() and tienda_id = mi_tienda_admin()));
drop policy if exists ver_postulaciones on public.postulaciones;
create policy ver_postulaciones on public.postulaciones for select using (es_admin() and (tienda_id is null or es_admin_de(tienda_id)));

-- Archivos privados: comprobantes y documentos solo los ve el cliente y la tienda donde compra
drop policy if exists ver_comprobante on storage.objects;
create policy ver_comprobante on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and ((storage.foldername(name))[1] = auth.uid()::text
         or exists (select 1 from public.pagos g where g.comprobante_path = name and public.es_admin_de(g.tienda_id))));
drop policy if exists ver_documento on storage.objects;
create policy ver_documento on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and ((storage.foldername(name))[1] = auth.uid()::text
         or (public.es_admin() and public._cliente_de_mi_tienda_txt((storage.foldername(name))[1]))));

-- Fotos de productos y logos: los administradores las suben desde el panel
drop policy if exists subir_foto_producto on storage.objects;
create policy subir_foto_producto on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.es_admin());

-- ---------------------------------------------------------------------
-- 9. Permisos de ejecución
-- ---------------------------------------------------------------------
revoke execute on function public._usar_tienda(int), public._requiere_admin_de(int),
  public._item_tienda(), public._credito_tienda(), public._pago_tienda()
  from public, anon, authenticated;
-- Estas solo responden sí/no sobre el usuario conectado; las políticas de seguridad las necesitan
grant execute on function public._cliente_de_mi_tienda(uuid), public._cliente_de_mi_tienda_txt(text), public._tienda_actual() to authenticated;
revoke execute on function public.mi_cupo(numeric, int), public.cupo_cliente(uuid, int), public.actualizar_tienda(jsonb),
  public.guardar_producto(jsonb) from public, anon;
grant execute on function public.mi_cupo(numeric, int), public.cupo_cliente(uuid, int), public.actualizar_tienda(jsonb),
  public.guardar_producto(jsonb), public.mi_tienda_admin(), public.es_admin_general(), public.es_admin_de(int) to authenticated;
grant execute on function public.postular(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 10. Crear los administradores (cámbialos y ejecuta esta parte aparte)
--   1. Cada encargado se registra en la página con su correo.
--   2. Luego ejecuta, con sus correos reales:
--      update public.perfiles set rol = 'admin', tienda_id = 1, verificacion = 'verificado' where email = 'admin@priorityone.com';
--      update public.perfiles set rol = 'admin', tienda_id = 2, verificacion = 'verificado' where email = 'admin@papasstore.com';
--      -- Opcional, admin general que ve ambas tiendas:
--      update public.perfiles set rol = 'admin', tienda_id = null, verificacion = 'verificado' where email = 'dueno@ejemplo.com';
-- ---------------------------------------------------------------------

-- >>>>>>>>>> 08_formas_de_pago.sql
-- =====================================================================
--  Actualización 08 · Forma de pago de cada tienda y nuevos eslóganes
--  · Priority One: vende de contado y, sobre todo, en cuotas.
--  · Papa's Store: vende solo de contado.
--  Ejecutar DESPUÉS de 07_multitienda.sql. Se puede ejecutar más de una vez.
-- =====================================================================

alter table public.tiendas add column if not exists acepta_cuotas boolean not null default true;
update public.tiendas set acepta_cuotas = true  where id = 1;
update public.tiendas set acepta_cuotas = false where id = 2;

-- Eslóganes y frases de la portada (cada admin puede cambiarlos desde su panel)
update public.tiendas set
  eslogan = 'Estrénalo hoy y págalo en cuotas.',
  frases  = '[{"k":"Priority One","t":"Tu teléfono,<br><em>en cuotas.</em>","p":"Paga una inicial desde el 30% y el resto en 3, 6 o 9 meses, sin pasar por un banco."},
              {"k":"Priority One","t":"Sin bancos,<br><em>sin papeleo.</em>","p":"Creas tu cuenta, verificas tu identidad una vez y te respondemos tu crédito en 24 horas."}]'
 where id = 1;
update public.tiendas set
  eslogan = 'Precio claro, pago de contado.',
  frases  = '[{"k":"Papa''s Store","t":"Pagas hoy,<br><em>te lo llevas hoy.</em>","p":"Compra de contado y retíralo en la tienda o recíbelo en tu casa."},
              {"k":"Papa''s Store","t":"El precio que ves<br><em>es el que pagas.</em>","p":"Sin intereses ni recargos: pagas el equipo completo y listo."}]'
 where id = 2;

-- Los productos de una tienda que no vende en cuotas quedan siempre "solo de contado"
update public.productos p set financiable = false
  from public.tiendas t where t.id = p.tienda_id and not t.acepta_cuotas and p.financiable;

create or replace function public._producto_forma_pago() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select acepta_cuotas from tiendas where id = new.tienda_id), true) then new.financiable := false; end if;
  return new;
end $$;
drop trigger if exists producto_forma_pago on public.productos;
create trigger producto_forma_pago before insert or update on public.productos
  for each row execute function public._producto_forma_pago();
revoke execute on function public._producto_forma_pago() from public, anon, authenticated;

-- Seguridad extra: no se puede crear un crédito en una tienda que no vende en cuotas
create or replace function public._chk_credito() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nom text; v_ver text; v_t tiendas;
begin
  select t.* into v_t from tiendas t join pedidos o on o.tienda_id = t.id where o.id = new.pedido_id;
  if v_t.id is not null and not v_t.acepta_cuotas then raise exception '% vende solo de contado.', v_t.nombre; end if;
  select verificacion into v_ver from perfiles where id = new.usuario_id;
  if v_ver = 'incompleto' then raise exception 'Para comprar en cuotas primero verifica tu identidad (Mi cuenta → Verificación).'; end if;
  if v_ver = 'rechazado' then raise exception 'Tu verificación fue rechazada. Vuelve a enviar tus documentos para comprar en cuotas.'; end if;
  select pr.nombre into v_nom from pedido_items i join productos pr on pr.id = i.producto_id
   where i.pedido_id = new.pedido_id and not pr.financiable limit 1;
  if v_nom is not null then raise exception '% se vende solo de contado. Quítalo del carrito o paga de contado.', v_nom; end if;
  return new;
end $$;

create or replace function public.cambiar_financiable(pid int, valor boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_nom text; v_t tiendas;
begin
  select t.* into v_t from tiendas t join productos p on p.tienda_id = t.id where p.id = pid;
  perform _requiere_admin_de(v_t.id);
  if valor and not v_t.acepta_cuotas then raise exception '% vende solo de contado.', v_t.nombre; end if;
  update productos set financiable = valor where id = pid returning nombre into v_nom;
  perform _log(format('%s marcado como %s', v_nom, case when valor then 'financiable' else 'solo de contado' end));
end $$;

-- >>>>>>>>>> 09_encargos.sql
-- =====================================================================
--  Actualización 09 · Encargos de teléfonos
--  El cliente pide un equipo que no está en el catálogo (o está agotado)
--  a una de las dos tiendas. La solicitud llega al panel de esa tienda y
--  el cliente la envía también por WhatsApp; el resto se acuerda por chat.
--  Ejecutar DESPUÉS de 08_formas_de_pago.sql. Se puede ejecutar más de una vez.
-- =====================================================================
create table if not exists public.encargos (
  id          bigint generated always as identity (start with 201) primary key,
  codigo      text generated always as ('ENC-' || id) stored,
  tienda_id   int not null references public.tiendas(id),
  usuario_id  uuid references public.perfiles(id) on delete set null,
  nombre      text not null,
  telefono    text not null,
  ciudad      text not null default '',
  marca       text not null default '',
  modelo      text not null,
  capacidad   text not null default '',
  color       text not null default '',
  pago        text not null default 'contado' check (pago in ('contado','cuotas')),
  presupuesto numeric(12,2),
  notas       text not null default '',
  estado      text not null default 'nuevo' check (estado in ('nuevo','contactado','en_camino','listo','entregado','descartado')),
  nota_interna text,
  creado_en   timestamptz not null default now()
);
create index if not exists encargos_tienda_idx on public.encargos(tienda_id);
alter table public.encargos enable row level security;
drop policy if exists ver_encargos on public.encargos;
create policy ver_encargos on public.encargos for select
  using ((usuario_id is not null and usuario_id = auth.uid()) or es_admin_de(tienda_id));

-- Cualquier visitante puede encargar (si tiene sesión, queda en su cuenta)
create or replace function public.encargar(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_t tiendas; v_tel text := _telefono(p->>'telefono'); v_pago text := coalesce(p->>'pago','contado'); v_id bigint; v_cod text;
begin
  select * into v_t from tiendas where id = nullif(p->>'tienda_id','')::int and activo;
  if not found then raise exception 'Elige la tienda a la que quieres encargar.'; end if;
  if length(trim(coalesce(p->>'modelo',''))) < 2 then raise exception 'Escribe el modelo que quieres encargar.'; end if;
  if length(trim(coalesce(p->>'nombre',''))) < 5 then raise exception 'Escribe tu nombre y apellido.'; end if;
  if v_tel !~ '^0[0-9]{10}$' then raise exception 'Escribe tu WhatsApp de 11 números, por ejemplo 04141234567.'; end if;
  if v_pago not in ('contado','cuotas') then v_pago := 'contado'; end if;
  if v_pago = 'cuotas' and not v_t.acepta_cuotas then raise exception '% vende solo de contado.', v_t.nombre; end if;
  if (select count(*) from encargos where telefono = v_tel and creado_en > now() - interval '1 day') >= 5 then
    raise exception 'Ya recibimos varios encargos tuyos hoy. Te escribiremos pronto.'; end if;
  insert into encargos(tienda_id, usuario_id, nombre, telefono, ciudad, marca, modelo, capacidad, color, pago, presupuesto, notas)
  values (v_t.id, auth.uid(), left(trim(p->>'nombre'),80), v_tel, left(trim(coalesce(p->>'ciudad','')),80), left(trim(coalesce(p->>'marca','')),40),
          left(trim(p->>'modelo'),80), left(trim(coalesce(p->>'capacidad','')),30), left(trim(coalesce(p->>'color','')),30), v_pago,
          nullif(p->>'presupuesto','')::numeric, left(trim(coalesce(p->>'notas','')),500))
  returning id, codigo into v_id, v_cod;
  insert into bitacora(actor, accion, tienda_id) values ('Sistema', format('Nuevo encargo %s: %s %s', v_cod, coalesce(p->>'marca',''), p->>'modelo'), v_t.id);
  return jsonb_build_object('codigo', v_cod);
end $$;

create or replace function public.actualizar_encargo(pid bigint, p_estado text, p_nota text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_cod text;
begin
  perform _requiere_admin_de((select tienda_id from encargos where id = pid));
  if p_estado not in ('nuevo','contactado','en_camino','listo','entregado','descartado') then raise exception 'Estado no válido.'; end if;
  update encargos set estado = p_estado, nota_interna = coalesce(nullif(trim(p_nota),''), nota_interna) where id = pid returning codigo into v_cod;
  if not found then raise exception 'Encargo no encontrado.'; end if;
  perform _log(format('Encargo %s pasó a %s', v_cod, p_estado));
end $$;

grant select on public.encargos to authenticated;
grant execute on function public.encargar(jsonb) to anon, authenticated;
revoke execute on function public.actualizar_encargo(bigint, text, text) from public, anon;
grant execute on function public.actualizar_encargo(bigint, text, text) to authenticated;

-- >>>>>>>>>> 10_cuotas_por_equipo.sql
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

-- >>>>>>>>>> 11_online_y_planes.sql
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

-- >>>>>>>>>> 12_cuotas_fijas.sql
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
   set frases = '[{"k":"Priority One","t":"Compra con<br><em>confianza.</em>","p":"Garantía en cada equipo y atención directa por WhatsApp, antes y después de la compra."},{"k":"Priority One","t":"Una tienda<br><em>que responde.</em>","p":"Cada pago queda registrado en tu cuenta y siempre sabes cuánto te falta."}]'::jsonb
 where id = 1;
