-- =====================================================================
--  Actualización 20 · El cierre diario aparece en el "Historial de cambios"
--  Los registros automáticos del sistema (cierre diario, moras aplicadas)
--  no pertenecen a una tienda; ahora los ven los administradores de ambas.
--  Ejecutar DESPUÉS de 19_sexo.sql. Se puede ejecutar más de una vez.
-- =====================================================================
drop policy if exists ver_bitacora on public.bitacora;
create policy ver_bitacora on public.bitacora for select using (
  es_admin_general()
  or (es_admin() and (tienda_id = mi_tienda_admin() or (tienda_id is null and actor = 'Sistema'))));
