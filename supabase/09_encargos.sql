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
