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
