# Priority One y Papa's Store: cómo poner la tienda en línea

Una sola página para las dos tiendas. Los clientes usan una sola cuenta y compran en cualquiera de las dos; cada tienda tiene su propio catálogo, sus pedidos, sus créditos, sus datos de pago y su propio panel de administración.

Tiempo estimado: unos 45 minutos. Costo: solo el dominio (Netlify y Supabase tienen plan gratis).

## Qué hay en esta carpeta

| Carpeta / archivo | Para qué sirve |
|---|---|
| `tienda/` | La página web. Netlify publica esta carpeta (ver `netlify.toml`). |
| `tienda/config.js` | Datos de conexión con Supabase. Lo demás se cambia desde el panel. |
| `netlify.toml` | Le indica a Netlify que publique la carpeta `tienda` sin compilar nada. |
| `supabase/instalar_todo.sql` | **Todo junto** (01, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 y 19) para ejecutarlo de una sola vez. |
| `supabase/01_esquema.sql` | Crea la base de datos, la seguridad y toda la lógica: pedidos, créditos, cuotas, mora y pagos. |
| `supabase/02_catalogo.sql` | Opcional: 11 productos de ejemplo. Si vas a cargar los reales desde el panel, sáltalo. |
| `supabase/03_tarea_diaria.sql` | Programa el cierre diario: mora de $4, reservas vencidas y recordatorios. |
| `supabase/05_actualizacion.sql` | Verificación de identidad, módulo “Trabaja con nosotros”, equipos solo de contado y cédula/teléfono solo con números. |
| `supabase/06_ajustes.sql` | Verificación solo para comprar en cuotas y preguntas de empleo para ventas online. |
| `supabase/08_formas_de_pago.sql` | Priority One vende en cuotas y de contado; Papa's Store solo de contado. Nuevos eslóganes. |
| `supabase/10_cuotas_por_equipo.sql` | Inicial mínima y cuotas permitidas por cada equipo, desde el panel. |
| `supabase/11_online_y_planes.sql` | Tiendas solo online (sin retiro ni efectivo) y planes de cuotas editables. |
| `supabase/19_sexo.sql` | Sexo del cliente (masculino o femenino) en el registro. |
| `supabase/18_garantia.sql` | Política de garantía de cada tienda (se edita en Configuración). |
| `supabase/17_frecuencia_y_contrato.sql` | El cliente elige semanal o quincenal (según lo que permita cada equipo), términos antes de comprar y contrato imprimible. |
| `supabase/16_pagos_usados_frecuencia.sql` | Pago móvil, transferencia, efectivo y USDT; equipos usados (batería, garantía); cuotas semanales o quincenales. |
| `supabase/15_sin_cupo.sql` | Sin límite de monto para financiar. |
| `supabase/14_sin_zelle.sql` | Solo pago móvil y transferencia (sin Zelle). |
| `supabase/13_frases.sql` | Frases de portada según la forma de pago de cada tienda. |
| `supabase/12_cuotas_fijas.sql` | El admin fija en cuántas cuotas se paga cada equipo; frases de confianza en la portada. |
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
2. Abre `supabase/instalar_todo.sql` con el Bloc de notas, copia **todo**, pégalo y pulsa **Run**. Debe decir *Success. No rows returned*.
   (Si prefieres ir por partes, ejecuta en orden 01, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 y 19. Se pueden ejecutar más de una vez sin dañar nada.)
3. Ve a **Database → Extensions**, busca **pg_cron** y actívalo.
4. Vuelve a **SQL Editor → New query** y ejecuta `supabase/03_tarea_diaria.sql`.

No ejecutes `02_catalogo.sql` en la tienda real: son productos de ejemplo.

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

Cada admin **solo ve y gestiona su tienda**: sus pagos, pedidos, créditos, productos, clientes que le compraron, postulaciones dirigidas a su tienda y su historial de cambios. El admin general ve las dos y tiene un selector para filtrar por tienda.

## Paso 8. Configurar cada tienda desde su panel

En **Panel → Configuración**, cada admin completa los **datos de su tienda**:
- Logo (PNG con fondo transparente), nombre, eslogan, WhatsApp, correo, RIF y horario de atención.
- Las **2 frases de la portada** que aparecen junto al teléfono animado.
- Sus **datos para recibir pagos** (pago móvil, transferencia, USDT de Binance y cómo se paga en efectivo). Son los que ve el cliente al pagarle a esa tienda.

Más abajo está la **configuración común**: tasa del día (actualízala cada día), mora, inicial mínima, cupo inicial y las **opciones de cuotas** con su recargo (Papa's Store solo ve la tasa del día).

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
