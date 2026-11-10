-- =====================================================================
--  Convertir una cuenta en administrador de una tienda
--  1. Regístrate en la página con el correo del administrador.
--  2. Cambia el correo y el número de tienda, y ejecuta esta consulta en
--     Supabase > SQL Editor.  tienda_id 1 = Priority One · 2 = Papa's Store
-- =====================================================================
update public.perfiles set rol = 'admin', tienda_id = 1, verificacion = 'verificado'
 where email = 'CAMBIA-ESTE-CORREO@ejemplo.com';

select nombre, email, rol, tienda_id from public.perfiles where rol = 'admin';
