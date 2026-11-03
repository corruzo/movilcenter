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
