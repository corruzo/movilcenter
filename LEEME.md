# MovilCenter: cómo poner la tienda en línea

Tiempo estimado: entre 30 y 45 minutos. Costo: $0. El dominio propio es opcional.

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `tienda/` | La página web. Vercel publica esta carpeta (ver `vercel.json`). |
| `tienda/config.js` | **El único archivo que editas**: datos de Supabase y de tu marca. |
| `vercel.json` | Le indica a Vercel que publique la carpeta `tienda` sin compilar nada. |
| `supabase/01_esquema.sql` | Crea la base de datos, la seguridad y toda la lógica: pedidos, créditos, cuotas, mora y pagos. |
| `supabase/02_catalogo.sql` | Carga 11 productos de ejemplo. Luego los cambias por los tuyos. |
| `supabase/03_tarea_diaria.sql` | Programa el cierre diario: mora de $4, reservas vencidas y recordatorios. |
| `supabase/04_crear_admin.sql` | Convierte tu cuenta en administrador. |

---

## Paso 1. Crear el proyecto en Supabase

1. Entra a **supabase.com** y crea una cuenta gratuita.
2. Pulsa **New project**:
   - **Name:** `movilcenter`
   - **Database Password:** inventa una contraseña fuerte y **guárdala**. No se la des a nadie.
   - **Region:** East US (la más cercana a Venezuela).
3. Espera 1 o 2 minutos a que el proyecto termine de crearse.

## Paso 2. Crear la base de datos

1. En el menú de la izquierda abre **SQL Editor** y pulsa **New query**.
2. Abre `supabase/01_esquema.sql` con el Bloc de notas, copia **todo**, pégalo y pulsa **Run**. Debe decir *Success*.
3. Pulsa **New query** otra vez y repite con `supabase/02_catalogo.sql`.
4. Ve a **Database → Extensions**, busca **pg_cron** y actívalo.
5. Vuelve a **SQL Editor → New query** y ejecuta `supabase/03_tarea_diaria.sql`.

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
2. En GitHub abre `tienda/config.js`, pulsa el lápiz (**Edit**) y pega cada dato donde dice `PEGA_AQUI...`.
3. En el mismo archivo cambia los datos de tu marca: nombre, RIF, ciudad, WhatsApp y correo.
4. Pulsa **Commit changes**. Vercel publicará el cambio solo, en menos de un minuto.

> ⚠️ Nunca pegues en `config.js` la **Secret key**, la **service_role** ni la contraseña de la base de datos. La Publishable key sí puede ser pública: la seguridad la ponen las reglas de la base de datos.

## Paso 5. Publicar la página en Vercel

1. Entra a **vercel.com** e inicia sesión con tu cuenta de **GitHub**.
2. Pulsa **Add New… → Project** y elige el repositorio **movilcenter** → **Import**.
3. Deja todo como viene:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - No hace falta poner variables de entorno.
4. Pulsa **Deploy**. En menos de un minuto tendrás una dirección como `https://movilcenter.vercel.app`.

Cada vez que cambies un archivo en GitHub, Vercel vuelve a publicar la tienda automáticamente.

## Paso 6. Decirle a Supabase cuál es tu página

1. En Supabase ve a **Authentication → URL Configuration**.
2. En **Site URL** pega la dirección de Vercel, por ejemplo `https://movilcenter.vercel.app`.
3. En **Redirect URLs** agrega la misma dirección.
4. Guarda.

Esto hace que los enlaces de "recuperar contraseña" lleven a tu tienda.

## Paso 7. Crear tu cuenta de administrador

1. Abre tu tienda y regístrate en **Ingresar → Crear cuenta** con el correo que usarás como administrador.
2. En Supabase abre **SQL Editor → New query** y pega el contenido de `supabase/04_crear_admin.sql`.
3. Cambia `CAMBIA-ESTE-CORREO@ejemplo.com` por tu correo y pulsa **Run**.
4. Cierra sesión en la tienda y vuelve a entrar. Verás el botón **Panel**.

## Paso 8. Configurar la tienda desde el panel

En **Panel → Configuración**:
- Escribe la **tasa del día** (Bs por dólar). Actualízala cada día.
- Escribe tus **datos para recibir pagos**: pago móvil, transferencia, Zelle y efectivo. Son los que verá el cliente al pagar.
- Revisa la mora, la inicial mínima, el recargo de cada plan y el cupo inicial.

## Paso 9. Cargar tus productos reales

En Supabase ve a **Table Editor → productos**. Cada fila es un producto:

| Columna | Qué poner |
|---|---|
| `marca`, `nombre` | Marca y modelo |
| `categoria` | Exactamente una de estas: `Teléfonos`, `Tablets`, `Smartwatch`, `Audio`, `Accesorios` |
| `precio` | Precio de contado en dólares |
| `stock` | Unidades disponibles |
| `colores` | Lista de colores, ej. `[{"n":"Negro","hex":"#222222"},{"n":"Azul","hex":"#2F4F9A"}]` |
| `capacidades` | Opcional. Precio extra por capacidad, ej. `[{"n":"128 GB","d":0},{"n":"256 GB","d":60}]`. Déjalo vacío (NULL) si no aplica. |
| `specs` | Ficha técnica, ej. `{"Pantalla":"6,5\"","Batería":"5000 mAh"}` |
| `descripcion` | Texto corto de venta |
| `imagen_url` | Foto real (ver abajo). Si la dejas vacía, se muestra un dibujo del equipo. |
| `activo` | `false` para ocultar el producto sin borrarlo |
| `orden` | Número para ordenar (los menores salen primero) |

**Para poner fotos:**
1. Ve a **Storage → productos** y sube la imagen. Mejor si es PNG con fondo transparente o blanco.
2. Pulsa la imagen, luego **Get URL**, y copia el enlace.
3. Pégalo en la columna `imagen_url` del producto.

Borra los productos de ejemplo que no vendas, o márcalos con `activo = false`.

## Paso 10 (opcional). Dominio propio

1. Compra el dominio, por ejemplo `movilcenter.com` (unos $10–15 al año).
2. En Vercel: **Project → Settings → Domains → Add** y sigue las instrucciones.
3. Vuelve al **Paso 6** y cambia la Site URL por tu dominio nuevo.

---

## Uso diario

- **Pagos por verificar:** revisa cada comprobante contra tu banco. Al aprobarlo:
  - en compras de contado, el pedido pasa a preparación;
  - en solicitudes de crédito, se genera el cronograma de cuotas.
- **Pedidos y envíos:** pulsa **Despachar** y escribe la guía. Después marca **Entregado**.
- **Créditos y cuotas:** aquí ves las moras. Puedes condonarlas o registrar pagos en efectivo con **Pago en caja**.
- El cierre diario corre solo cada noche. También puedes ejecutarlo desde **Resumen**.

## Plan gratuito: lo que debes saber

- Supabase **pausa los proyectos gratuitos que pasan una semana sin actividad**. Con visitas diarias no pasa. Si se pausa, lo reactivas desde el panel de Supabase.
- El plan gratuito tiene límites de espacio para la base de datos y para las imágenes. Para empezar sobra. Cuando la tienda crezca, el plan Pro cuesta unos $25 al mes. Revisa los límites vigentes en supabase.com/pricing.
- Haz respaldos de vez en cuando: **Database → Backups**. O exporta las tablas desde **Table Editor**.

## Problemas comunes

| Mensaje | Solución |
|---|---|
| "Falta conectar la tienda" | Revisa el Paso 4: faltan la URL o la clave en `config.js`, o el cambio no se guardó con **Commit changes**. |
| "No se pudo conectar con la base de datos" | Revisa el Paso 2: no se ejecutó `01_esquema.sql`, o la clave está mal copiada. |
| "Esa cédula ya está registrada" | Ya existe una cuenta con esa cédula. El cliente debe usar "¿Olvidaste tu contraseña?". |
| No veo el botón Panel | Revisa el Paso 7 y vuelve a iniciar sesión. |
| No llegan correos | Revisa el Paso 3. El correo gratuito de Supabase tiene un límite bajo por hora. |
| No se aplican las moras | Revisa que activaste **pg_cron** y ejecutaste `03_tarea_diaria.sql`. |
