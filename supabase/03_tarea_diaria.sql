-- =====================================================================
--  MovilCenter · Tarea programada del cierre diario
--  Aplica la mora de las cuotas vencidas, cancela reservas sin pago
--  y envía recordatorios. Corre todos los días a las 00:05 de Venezuela
--  (04:05 UTC).
--  Antes de ejecutar: Supabase > Database > Extensions > activa "pg_cron".
-- =====================================================================
create extension if not exists pg_cron;

select cron.unschedule('cierre-diario') where exists (select 1 from cron.job where jobname = 'cierre-diario');
select cron.schedule('cierre-diario', '5 4 * * *', $$ select public.cierre_diario(); $$);
