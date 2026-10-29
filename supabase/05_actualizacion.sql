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
