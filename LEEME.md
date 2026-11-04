# Priority One y Papa's Store: cómo poner la tienda en línea

Una sola página para las dos tiendas. Los clientes usan una sola cuenta y compran en cualquiera de las dos; cada tienda tiene su propio catálogo, sus pedidos, sus créditos, sus datos de pago y su propio panel de administración.

Tiempo estimado: unos 45 minutos. Costo: solo el dominio (Netlify y Supabase tienen plan gratis).

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `tienda/` | La página web. Netlify publica esta carpeta (ver `netlify.toml`). |
| `tienda/config.js` | Datos de conexión con Supabase. Lo demás se cambia desde el panel. |
| `netlify.toml` | Le indica a Netlify que publique la carpeta `tienda` sin compilar nada. |
| `supabase/01_esquema.sql` | Crea la base de datos, la seguridad y toda la lógica: pedidos, créditos, cuotas, mora y pagos. |
| `supabase/02_catalogo.sql` | Opcional: 11 productos de ejemplo. Si vas a cargar los reales desde el panel, sáltalo. |
| `supabase/03_tarea_diaria.sql` | Programa el cierre diario: mora de $4, reservas vencidas y recordatorios. |
| `supabase/05_actualizacion.sql` | Verificación de identidad, módulo “Trabaja con nosotros”, equipos solo de contado y cédula/teléfono solo con números. |
| `supabase/06_ajustes.sql` | Verificación solo para comprar en cuotas y preguntas de empleo para ventas online. |
| `supabase/08_formas_de_pago.sql` | Priority One vende en cuotas y de contado; Papa's Store solo de contado. Nuevos eslóganes. |
| `supabase/10_cuotas_por_equipo.sql` | Inicial mínima y cuotas permitidas por cada equipo, desde el panel. |
| `supabase/11_online_y_planes.sql` | Tiendas solo online (sin retiro ni efectivo) y planes de cuotas editables. |
| `supabase/09_encargos.sql` | Encargos: el cliente pide un teléfono que no está en el catálogo o está agotado, a la tienda que elija. |
| `supabase/07_multitienda.sql` | **Las dos tiendas**: crea Priority One y Papa's Store, separa catálogo, pedidos, créditos y pagos por tienda, y crea los paneles por tienda. |

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
2. Abre `supabase/01_esquema.sql` con el Bloc de notas, copia **todo**, pégalo y pulsa **Run**. Debe decir *Success*.
3. Opcional: si quieres ver productos de ejemplo mientras pruebas, repite con `supabase/02_catalogo.sql`.
4. Ve a **Database → Extensions**, busca **pg_cron** y actívalo.
5. Vuelve a **SQL Editor → New query** y ejecuta `supabase/03_tarea_diaria.sql`.
6. Por último ejecuta, en este orden, `supabase/05_actualizacion.sql`, `supabase/06_ajustes.sql`, `supabase/07_multitienda.sql`, `supabase/08_formas_de_pago.sql`, `supabase/09_encargos.sql`, `supabase/10_cuotas_por_equipo.sql` y `supabase/11_online_y_planes.sql`. Si ya habías ejecutado los anteriores, ejecuta solo los que falten.

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

## Paso 5. Publicar la página en Netlify

1. Entra a **netlify.com** y crea una cuenta gratis (puedes entrar con tu correo o con GitHub).
2. Opción fácil, sin GitHub: ve a **Sites → Add new site → Deploy manually** y arrastra la carpeta **`tienda`** completa a la ventana.
   Opción con GitHub: **Add new site → Import an existing project**, elige el repositorio y deja todo como viene (Netlify lee `netlify.toml`).
3. En menos de un minuto tendrás una dirección como `https://priority-papas.netlify.app`.
4. Para cambiar el nombre de esa dirección: **Site configuration → Change site name**.

Si usas la opción de arrastrar, cada vez que cambies un archivo vuelve a arrastrar la carpeta en **Deploys**. Con GitHub se publica solo.

## Paso 6. Conectar tu dominio y decirle a Supabase cuál es tu página

**Dominio (comprado en Namecheap u otro):**
1. En Netlify: **Domain management → Add a domain**, escribe tu dominio (ej. `tutienda.com`) y sigue los pasos.
2. Netlify te mostrará los **nameservers** (4 direcciones tipo `dns1.p01.nsone.net`). En Namecheap ve a **Domain List → Manage → Nameservers → Custom DNS**, pégalos y guarda.
3. En unas horas (máximo 24) la tienda abre en tu dominio, con candado (HTTPS) gratis.

**Supabase:**
1. Ve a **Authentication → URL Configuration**.
2. En **Site URL** pega tu dirección final (tu dominio, o la de Netlify mientras tanto).
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

Cada admin **solo ve y gestiona su tienda**: sus pagos, pedidos, créditos, productos, clientes que le compraron, postulaciones dirigidas a su tienda y su bitácora. El admin general ve las dos y tiene un selector para filtrar por tienda.

## Paso 8. Configurar cada tienda desde su panel

En **Panel → Configuración**, cada admin completa los **datos de su tienda**:
- Logo (PNG con fondo transparente), nombre, eslogan, WhatsApp, correo, RIF, horario y dirección de retiro.
- Las **2 frases de la portada** que aparecen junto al teléfono animado.
- Sus **datos para recibir pagos** (pago móvil, transferencia, Zelle, efectivo). Son los que ve el cliente al pagarle a esa tienda.

Más abajo está la **configuración común** a las dos tiendas: tasa del día (actualízala cada día), mora, inicial mínima, recargo de cada plan y cupo inicial.

## Paso 9. Cargar los productos

En **Panel → Inventario → + Nuevo producto**: nombre, marca, categoría, precio, unidades, colores, capacidades (ej. `256 GB, 512 GB +150`), especificaciones, descripción y **foto**. Marca si se puede pagar en cuotas y si está visible. Si se paga en cuotas, puedes fijar la **inicial mínima de ese equipo** (por ejemplo 40%) y **en cuántas cuotas** se puede pagar (3, 6 y/o 9). Si dejas la inicial vacía, usa la general de Configuración. El producto queda en la tienda del admin que lo crea.

Para cambiar algo después pulsa **Editar**. Para ocultar un producto sin borrarlo, desmarca **Visible en la tienda**.

---

## Uso diario

- **Compras en las dos tiendas:** el cliente puede tener productos de las dos en el carrito, pero cada tienda se paga por separado (un pedido por tienda), con los datos de pago de esa tienda.
- **Créditos:** el cupo y el máximo de créditos son por tienda (cada tienda arriesga su dinero). Si el cliente tiene una cuota vencida en cualquiera de las dos, no puede pedir un crédito nuevo hasta ponerse al día.
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
- **Créditos y cuotas:** aquí ves las moras. Puedes condonarlas o registrar pagos en efectivo con **Pago en caja**.
- El cierre diario corre solo cada noche. También puedes ejecutarlo desde **Resumen**.

## Plan gratuito: lo que debes saber

- Supabase **pausa los proyectos gratuitos que pasan una semana sin actividad**. Con visitas diarias no pasa. Si se pausa, lo reactivas desde el panel de Supabase.
- El plan gratuito tiene límites de espacio para la base de datos y para las imágenes. Para empezar sobra. Cuando la tienda crezca, el plan Pro cuesta unos $25 al mes. Revisa los límites vigentes en supabase.com/pricing.
- Haz respaldos de vez en cuando: **Database → Backups**. O exporta las tablas desde **Table Editor**.

## Problemas comunes

| Mensaje | Solución |
|---|---|
| "Falta conectar la tienda" | Revisa el Paso 4: faltan la URL o la clave en `config.js`, o no volviste a subir la carpeta a Netlify. |
| "No se pudo conectar con la base de datos" | Revisa el Paso 2: no se ejecutó `01_esquema.sql`, o la clave está mal copiada. |
| "Esa cédula ya está registrada" | Ya existe una cuenta con esa cédula. El cliente debe usar "¿Olvidaste tu contraseña?". |
| No veo el botón Panel | Revisa el Paso 7 y vuelve a iniciar sesión. |
| "No se encontraron las tiendas" | Falta ejecutar `supabase/07_multitienda.sql`. |
| "Esta operación es de otra tienda" | Ese pago, pedido o producto pertenece a la otra tienda. Solo su admin (o el admin general) puede tocarlo. |
| "Cada tienda se paga por separado" | El cliente intentó pagar productos de las dos tiendas juntos. Debe pagar desde el carrito cada tienda aparte. |
| No llegan correos | Revisa el Paso 3. El correo gratuito de Supabase tiene un límite bajo por hora. |
| “Para comprar en cuotas primero verifica tu identidad” | El cliente debe entrar a **Mi cuenta → Verificación** y enviar sus documentos. |
| No se aplican las moras | Revisa que activaste **pg_cron** y ejecutaste `03_tarea_diaria.sql`. |
