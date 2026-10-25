-- =====================================================================
--  MovilCenter · Convertir una cuenta en administrador
--  1. Regístrate en la tienda con el correo del administrador.
--  2. Cambia el correo de abajo y ejecuta esta consulta.
-- =====================================================================
update public.perfiles set rol = 'admin' where email = 'CAMBIA-ESTE-CORREO@ejemplo.com';
select id, nombre, email, rol from public.perfiles where rol = 'admin';
