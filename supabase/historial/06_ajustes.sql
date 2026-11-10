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
