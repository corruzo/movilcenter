-- =====================================================================
--  Actualización 13 · Frases de portada según la forma de pago
--  Priority One: cuotas (y confianza). Papa's Store: solo contado.
--  Ejecutar DESPUÉS de 12_cuotas_fijas.sql. Se puede ejecutar más de una vez.
--  (Luego cada admin puede cambiarlas en Panel → Configuración.)
-- =====================================================================
update public.tiendas
   set eslogan = 'Estrénalo hoy y págalo en cuotas.',
       frases = '[{"k":"Priority One · Cuotas","t":"Estrénalo hoy,<br><em>págalo en cuotas.</em>","p":"Das una inicial y el resto lo pagas en cuotas."},{"k":"Priority One","t":"Compra con<br><em>confianza.</em>","p":"Garantía en cada equipo y atención directa por WhatsApp, antes y después de la compra."}]'::jsonb
 where id = 1;
update public.tiendas
   set eslogan = 'Precio claro, pago de contado.',
       frases = '[{"k":"Papa''s Store · Contado","t":"Pagas de contado,<br><em>sin recargos.</em>","p":"El precio que ves es el que pagas: sin intereses, sin cuotas y sin sorpresas."},{"k":"Papa''s Store","t":"Pagas hoy,<br><em>te lo enviamos.</em>","p":"Paga por pago móvil, transferencia o Zelle y recíbelo en tu casa o por envío nacional."}]'::jsonb
 where id = 2;
