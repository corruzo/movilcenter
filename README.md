# Priority One y Papa's Store · Tienda en línea de teléfonos

Tienda en línea de teléfonos con compra de contado o en cuotas, comprobantes de pago, mora automática, verificación de identidad para créditos, contrato imprimible, encargos, empleos y un panel de administración por comercio.

- **Página:** carpeta `tienda/` (HTML, CSS y JavaScript, sin compilar). Se publica en **Vercel** con despliegue automático desde la rama `main`.
- **Base de datos:** Supabase (PostgreSQL con RLS y funciones seguras). Instalación en `supabase/instalar_todo.sql`.
- **Guía paso a paso:** [LEEME.md](LEEME.md).

## Estructura

```
tienda/                 Página web (lo que publica Vercel)
  index.html, app.js, estilos.css, config.js, img/
  vercel.json           Cabeceras de seguridad (CSP, HSTS, etc.)
vercel.json             Para Vercel sin "Root Directory": publica la carpeta tienda/
supabase/
  instalar_todo.sql     Instalación completa (estructura, seguridad y reglas)
  03_tarea_diaria.sql   Cierre diario con pg_cron (mora, reservas, recordatorios)
  04_crear_admin.sql    Convertir una cuenta en administrador de una tienda
  historial/            Actualizaciones 01 a 23, en el orden en que se crearon
```

## Seguridad

- `tienda/config.js` solo lleva la **Project URL** y la **Publishable key** de Supabase, que son públicas. Nunca subas la Secret key, la service_role ni la contraseña de la base de datos.
- Toda escritura pasa por funciones del servidor que validan quién la pide; RLS activo en todas las tablas.
- Los datos de las tiendas (RIF, cuentas bancarias, cédulas) se cargan en la base de datos, **no** en este repositorio.
