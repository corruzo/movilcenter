# Priority One y Papa's Store: cómo poner la tienda en línea

Una sola página con el catálogo de los dos comercios. Los clientes usan una sola cuenta; cada comercio tiene su catálogo, sus pedidos, sus créditos, su tasa, sus datos de pago y su propio panel de administración.

Costo: solo el dominio (Vercel y Supabase tienen plan gratis para empezar).

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `tienda/` | La página web. Vercel publica esta carpeta (Root Directory = `tienda`). |
| `tienda/config.js` | Datos de conexión con Supabase (URL y Publishable key). Lo demás se cambia desde el panel. |
| `tienda/vercel.json` | Cabeceras de seguridad de la página (CSP, HSTS, X-Frame-Options…). |
| `supabase/instalar_todo.sql` | **Instalación completa**: tablas, funciones, seguridad (RLS) y reglas de negocio. Se puede ejecutar más de una vez. |
| `supabase/03_tarea_diaria.sql` | Programa el cierre diario: mora de $4, reservas vencidas y recordatorios. |
| `supabase/04_crear_admin.sql` | Convierte una cuenta registrada en administrador de una tienda. |
| `supabase/historial/` | Las actualizaciones 01 a 25 por separado, en el orden en que se crearon. Solo como referencia: `instalar_todo.sql` ya las incluye. |

Los datos de cada tienda (RIF, cuentas bancarias, cédulas, WhatsApp) **no** están en este repositorio: se cargan en la base de datos con el archivo SQL que se entrega aparte, o desde el panel.

---

## Paso 1. Crear el proyecto en Supabase

1. Entra a **supabase.com** y crea una cuenta gratuita.
2. Pulsa **New project**:
   - **Name:** `priority-papas`
   - **Database Password:** inventa una contraseña fuerte y **guárdala**. No se la des a nadie.
   - **Region:** East US (la más cercana a Venezuela).
3. Espera 1 o 2 minutos a que el proyecto termine de crearse.

## Paso 2. Crear la base de datos

1. En el menú de la izquierda abre **SQL Editor** y pulsa **New query**.
2. Abre `supabase/instalar_todo.sql` con el Bloc de notas, copia **todo**, pégalo y pulsa **Run**. Debe decir *Success. No rows returned*.
   Si te entregaron el archivo con los datos de las tiendas (`supabase_proyecto_nuevo.sql`), ejecuta ese en lugar de este: trae todo junto.
3. Ve a **Database → Extensions**, busca **pg_cron** y actívalo.
4. Vuelve a **SQL Editor → New query** y ejecuta `supabase/03_tarea_diaria.sql`.

La instalación no trae productos, cupones ni tasas de ejemplo: todo lo carga cada tienda desde su panel.

Desde ahora, todas las noches a las 00:05 (hora de Venezuela) el sistema:
- aplica la mora a las cuotas vencidas;
- cancela las reservas que no se pagaron en 48 horas;
- envía recordatorios a los clientes 3 días antes de cada vencimiento.

## Paso 3. Ajustar el registro de usuarios

1. Ve a **Authentication → Sign In / Providers → Email**.
2. Desactiva **Confirm email** y guarda.

Así los clientes entran apenas se registran. El correo gratuito de Supabase solo permite enviar unos pocos mensajes por hora. Si más adelante quieres exigir la confirmación por correo, configura un servicio de correo propio (por ejemplo Resend, que es gratuito) en **Authentication → Emails → SMTP Settings**.

## Paso 4. Conectar la página con Supabase

1. En Supabase, pulsa el botón **Connect** (arriba) o ve a **Project Settings → API Keys**. Copia dos datos:
   - **Project URL**, que se ve así: `https://abcdefghijk.supabase.co`
   - **Publishable key**, que empieza con `sb_publishable_`. En proyectos antiguos se llama **anon public**.
2. Abre `tienda/config.js` con el Bloc de notas y pega cada dato en `supabaseUrl` y `supabaseAnonKey`. Guarda.
3. El nombre, el logo, el WhatsApp, el RIF y los datos de pago de cada tienda **no** van aquí: se cambian desde el panel (Paso 8).

> ⚠️ Nunca pegues en `config.js` la **Secret key**, la **service_role** ni la contraseña de la base de datos. La Publishable key sí puede ser pública: la seguridad la ponen las reglas de la base de datos.

## Paso 5. Publicar la página en Vercel (despliegue automático)

1. Entra a **vercel.com** con tu cuenta de GitHub.
2. Pulsa **Add New → Project** e importa este repositorio.
3. Configura:
   - **Framework Preset:** Other
   - **Root Directory:** `tienda`
   - **Build Command** y **Output Directory:** vacíos
   - No hace falta ninguna variable de entorno.
4. Pulsa **Deploy**. En menos de un minuto tendrás una dirección `https://….vercel.app`.

Desde ese momento, **cada cambio que se suba a la rama `main` se publica solo**.

> El plan gratuito de Vercel (Hobby) es para uso no comercial. Para una tienda que vende, usa el plan Pro o publica la carpeta `tienda` en Cloudflare Pages (gratis para uso comercial, mismo despliegue automático desde GitHub).

## Paso 6. Conectar tu dominio y decirle a Supabase cuál es tu página

**Dominio (comprado en Namecheap u otro):**
1. En Vercel: **Project → Settings → Domains → Add**, escribe tu dominio (ej. `prioritynstore.com`) y también `www.prioritynstore.com`.
2. Vercel te muestra los registros que debes crear (un registro **A** para el dominio y un **CNAME** para `www`). En Namecheap ve a **Domain List → Manage → Advanced DNS** y créalos**, pégalos y guarda.
3. En unas horas (máximo 24) la tienda abre en tu dominio, con candado (HTTPS) gratis.

**Supabase:**
1. Ve a **Authentication → URL Configuration**.
2. En **Site URL** pega tu dirección final (tu dominio, o la de Vercel mientras tanto).
3. En **Redirect URLs** agrega la misma dirección y guarda.

Esto hace que los enlaces de "recuperar contraseña" lleven a tu tienda.

## Paso 7. Crear los administradores de cada tienda

1. Cada encargado abre la tienda y se registra en **Crear cuenta** con su correo.
2. En Supabase abre **SQL Editor → New query**, pega esto con los correos reales y pulsa **Run**:

```sql
update public.perfiles set rol = 'admin', tienda_id = 1, verificacion = 'verificado' where email = 'admin@priorityone.com';
update public.perfiles set rol = 'admin', tienda_id = 2, verificacion = 'verificado' where email = 'admin@papasstore.com';
-- Opcional: un administrador general que ve las dos tiendas
update public.perfiles set rol = 'admin', tienda_id = null, verificacion = 'verificado' where email = 'dueno@ejemplo.com';
```

3. Cierran sesión y vuelven a entrar. Verán el botón **Panel**.

Cada admin **solo ve y gestiona su tienda**: sus pagos, pedidos, créditos, productos, clientes que le compraron, postulaciones dirigidas a su tienda y su historial de cambios. El admin general ve las dos y tiene un selector para filtrar por tienda.

## Paso 8. Configurar cada tienda desde su panel

En **Panel → Configuración**, cada admin completa los **datos de su tienda**:
- Logo (PNG con fondo transparente), nombre, eslogan, WhatsApp, correo, RIF y horario de atención.
- Las **2 frases de la portada** que aparecen junto al teléfono animado.
- Sus **datos para recibir pagos** (pago móvil, transferencia, USDT de Binance y cómo se paga en efectivo). Son los que ve el cliente al pagarle a esa tienda.

Debajo está la **tasa para pagos en bolívares** de esa tienda: cada tienda publica la suya cada día, junto con el ajuste (%) para pagos en bolívares. Mientras una tienda no publique su tasa, sus clientes solo pueden pagar en dólares (USDT o efectivo). Cada cambio queda en el historial de tasas.

La tienda que vende en cuotas ve además las **reglas de financiamiento**: mora, inicial mínima y opciones de cuotas.

## Paso 9. Cargar los productos

En **Panel → Inventario → + Nuevo producto**: nombre, marca, categoría, precio, unidades, colores, capacidades (ej. `256 GB, 512 GB +150`), especificaciones, descripción y **foto**. Marca si se puede pagar en cuotas y si está visible. Si se paga en cuotas, fijas la **inicial mínima de ese equipo** (por ejemplo 40%) y **en cuántas cuotas** se paga. El cliente no elige las cuotas. Si dejas la inicial vacía, usa la general de Configuración. El producto queda en la tienda del admin que lo crea.

Para cambiar algo después pulsa **Editar**. Para ocultar un producto sin borrarlo, desmarca **Visible en la tienda**.

---

## Uso diario

- **Compras en las dos tiendas:** el cliente puede tener productos de las dos en el carrito, pero cada tienda se paga por separado (un pedido por tienda), con los datos de pago de esa tienda.
- **Créditos:** no hay límite de monto; el máximo de créditos abiertos es por tienda. Si el cliente tiene una cuota vencida en cualquiera de las dos, no puede pedir un crédito nuevo hasta ponerse al día.
- **Encargos:** si un cliente busca un modelo que no está o está agotado, lo encarga desde **Encargos** (o desde el botón del equipo agotado), eligiendo la tienda. Le llega al panel de esa tienda en **Encargos** y el cliente lo envía también por WhatsApp. El admin le escribe con precio y fecha y va cambiando el estado: nuevo, contactado, en camino, listo, entregado o descartado.
- **Identidad:** el cliente la verifica una sola vez y sirve para las dos tiendas.

- **Ventas:** cuántas ventas fueron de contado y cuántas financiadas cada mes, con montos, porcentaje financiado y el detalle de cada venta.
- **Clientes:** crear una cuenta es inmediato y permite comprar de contado. Solo quien quiere comprar en cuotas envía foto de su cédula, una foto suya, su ubicación, ocupación e ingreso. Los revisas al aprobar su crédito: al aprobarlo, la identidad queda verificada. También puedes verificar o rechazar desde esta pestaña.
- **Postulaciones:** personas que quieren trabajar promocionando equipos (página **Empleos**). Puedes escribirles por WhatsApp desde el panel y marcar su estado: nueva, contactada, entrevista, contratada o descartada.
- **Inventario:** pulsa la forma de pago de un equipo para cambiarlo entre “contado y cuotas” y “solo contado”.

- **Pagos por verificar:** revisa cada comprobante contra tu banco. Al aprobarlo:
  - en compras de contado, el pedido pasa a preparación;
  - en solicitudes de crédito, se genera el cronograma de cuotas.
- **Pedidos y envíos:** pulsa **Despachar** y escribe la guía. Después marca **Entregado**.
- **Créditos y cuotas:** aquí ves las moras, puedes condonarlas, enviar recordatorios por WhatsApp y **registrar pagos en efectivo**.
- **Pedidos y envíos:** si el cliente eligió efectivo, cuando lo recibas pulsa **Registrar efectivo**.
- **Contrato:** en **Créditos y cuotas**, cada crédito aprobado tiene el botón **Preparar contrato**. Escribes el IMEI (márcalo con *#06#) y los datos del equipo, y la página arma el contrato listo para imprimir y firmar al entregar. El nombre y la cédula del representante se ponen en **Configuración**.
- **Historial de cambios:** registro de lo que hizo cada administrador.
- El cierre diario corre solo cada noche. También puedes ejecutarlo desde **Resumen**.

## Recordatorios de cuotas

- El cliente ve un aviso en **Notificaciones** 3 días antes de cada cuota y cuando se vence (con la mora).
- **Por WhatsApp:** en **Panel → Créditos y cuotas** (y en el Resumen) cada cuota pendiente tiene el botón **Recordar**. Abre WhatsApp con el mensaje ya escrito para ese cliente; el admin solo toca **Enviar**.

## Plan gratuito: lo que debes saber

- Supabase **pausa los proyectos gratuitos que pasan una semana sin actividad**. Con visitas diarias no pasa. Si se pausa, lo reactivas desde el panel de Supabase.
- El plan gratuito tiene límites de espacio para la base de datos y para las imágenes. Para empezar sobra. Cuando la tienda crezca, el plan Pro cuesta unos $25 al mes. Revisa los límites vigentes en supabase.com/pricing.
- Haz respaldos de vez en cuando: **Database → Backups**. O exporta las tablas desde **Table Editor**.

## Problemas comunes

| Mensaje | Solución |
|---|---|
| "Falta conectar la tienda" | Revisa el Paso 4: faltan la URL o la clave en `config.js`, o el cambio no se subió a la rama `main`. |
| "No se pudo conectar con la base de datos" | Revisa el Paso 2: no se ejecutó `instalar_todo.sql`, o la clave está mal copiada. |
| "Esa cédula ya está registrada" | Ya existe una cuenta con esa cédula. El cliente debe usar "¿Olvidaste tu contraseña?". |
| No veo el botón Panel | Revisa el Paso 7 y vuelve a iniciar sesión. |
| "No se encontraron las tiendas" | Falta ejecutar `supabase/instalar_todo.sql`. |
| "Esta operación es de otra tienda" | Ese pago, pedido o producto pertenece a la otra tienda. Solo su admin (o el admin general) puede tocarlo. |
| "Cada tienda se paga por separado" | El cliente intentó pagar productos de las dos tiendas juntos. Debe pagar desde el carrito cada tienda aparte. |
| No llegan correos | Revisa el Paso 3. El correo gratuito de Supabase tiene un límite bajo por hora. |
| “Para comprar en cuotas primero verifica tu identidad” | El cliente debe entrar a **Mi cuenta → Verificación** y enviar sus documentos. |
| No se aplican las moras | Revisa que activaste **pg_cron** y ejecutaste `03_tarea_diaria.sql`. |
| El cliente no ve pago móvil ni transferencia | Esa tienda no ha publicado su tasa o no tiene cargados esos datos de pago (Panel → Configuración). |

## Páginas legales

La página incluye **Términos de uso** (`#terminos`) y **Política de privacidad** (`#privacidad`), enlazadas en el pie. Usan los datos de cada tienda (nombre, RIF, WhatsApp, garantía, mora). Al registrarse, el cliente las acepta y queda guardado con fecha y versión. Si cambias su contenido, sube la versión en `LEGAL_VERSION` (app.js) y a los clientes se les pedirá aceptarla de nuevo. Conviene que un abogado las revise antes del lanzamiento.

## Si cambias de proyecto de Supabase

Cambia la URL y la Publishable key en `tienda/config.js`. La política de seguridad de `tienda/vercel.json` ya permite cualquier proyecto `*.supabase.co`.
