# Publicar la lista de Nahia — guía paso a paso

**Objetivo:** la web en `https://listadenahia.soulbloom.me` y las reservas guardándose
en vivo en una hoja de Google que todos compartís.

Archivos que vas a usar (carpeta del proyecto):

| Archivo | Para qué |
|---|---|
| `lista-nahia.html` | La web entera, en un solo archivo. Es lo único que se sube al hosting. |
| `Lista Nahia - Base de datos.xlsx` | La base de datos. Se sube a Google Drive y se abre como Hoja de cálculo. |
| `apps-script/Codigo.gs` | El puente entre la web y la hoja. Se pega en Apps Script. |
| `web/products.json` | Copia de referencia del catálogo (la web **no** lo necesita, los datos van dentro del HTML). |

---

## Parte A · Base de datos en Google Sheets (reservas en vivo)

### A1. Subir la hoja
1. Entra en [drive.google.com](https://drive.google.com) con tu cuenta.
2. **Nuevo → Subir archivo →** `Lista Nahia - Base de datos.xlsx`.
3. Doble clic en el archivo subido → arriba: **Abrir con → Hojas de cálculo de Google**.
4. **Archivo → Guardar como Hoja de cálculo de Google** (crea la versión editable).
   Ya puedes borrar el `.xlsx` original de Drive si quieres.

Verás 3 pestañas: **Lista** (la base de datos), **Reservas (log)** (registro) e **Instrucciones**.

### A2. Pegar el script
1. En la hoja de Google: **Extensiones → Apps Script**.
2. Borra todo lo que haya en `Código.gs` y pega el contenido de `apps-script/Codigo.gs`.
3. Icono de guardar (💾).

### A3. Publicar el script como aplicación web
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Rueda dentada → **Aplicación web**.
3. Configura:
   - **Descripción:** `lista nahia`
   - **Ejecutar como:** *Yo (tu correo)*
   - **Quién tiene acceso:** **Cualquier persona**  ← importante
4. **Implementar**. Google te pedirá autorizar (elige tu cuenta → *Configuración avanzada* →
   *Ir a (no seguro)* → *Permitir*). Es tu propio script, es normal.
5. Copia la **URL de la aplicación web**: termina en **`/exec`**.

### A4. Conectar la web con la hoja
1. Abre `lista-nahia.html` con un editor de texto.
2. Busca (cerca del principio del `<script>`):
   ```js
   var SHEET_URL = "";
   ```
3. Pega tu URL entre las comillas:
   ```js
   var SHEET_URL = "https://script.google.com/macros/s/AKfy.....X/exec";
   ```
4. Guarda. (Si ya habías subido la web, vuelve a subir este archivo — paso B.)

> **Sin este paso la web también funciona**, pero cada invitado ve solo *sus* reservas
> (se guardan en su navegador). Con la URL puesta, las reservas se comparten entre todos
> y se apuntan solas en la hoja.

### A5. Comprobar
- En el navegador, abre tu URL `…/exec` directamente: debe responder `{"reserved":{...},"contrib":{...}}`.
- Haz una reserva de prueba en la web → mira la pestaña **Reservas (log)**: aparece una fila.
  En **Lista**, esa fila se marca `RESERVADO ✓` con el nombre y el método.
- Borra la fila de prueba del log y limpia las celdas de esa fila en **Lista** cuando acabes.

### Cómo lo usaréis Marta y Rubén
- La columna **Reservado por** y **Método de pago** se rellenan solas con cada reserva.
- Para **regalos «Entre varios»**, la columna **Aportado (€)** va sumando; cuando llega al
  precio, se marca `RESERVADO ✓`.
- Podéis editar la hoja a mano en cualquier momento (p. ej. marcar algo como comprado
  o cambiar **Visible en web** a `No` para esconder un regalo). La web respeta lo que ponga la hoja.

---

## Parte B · Publicar la web en `listadenahia.soulbloom.me` (Hostinger)

Antes de subir, **renombra** `lista-nahia.html` → **`index.html`**
(así la dirección queda limpia: `https://listadenahia.soulbloom.me/`).

### Camino 1 — Tienes plan de hosting en Hostinger (lo más habitual)

1. Entra en **hPanel** (panel de Hostinger).
2. **Dominios → Subdominios** (o *Sitios web → Subdominios*).
3. Crea el subdominio:
   - **Subdominio:** `listadenahia`
   - **Dominio:** `soulbloom.me`
   - Hostinger crea automáticamente una carpeta, normalmente
     `domains/soulbloom.me/public_html/listadenahia` (o `public_html/listadenahia`).
4. Abre **Administrador de archivos**, entra en esa carpeta y **sube `index.html`**.
   Borra cualquier `default.php` / `index2.html` de ejemplo que haya dentro.
5. **SSL:** hPanel → **Seguridad → SSL** → instala el certificado gratuito para
   `listadenahia.soulbloom.me` si no se activa solo (puede tardar de minutos a 1–2 h).
6. Entra en `https://listadenahia.soulbloom.me` — debería verse la lista.

> Cuando cambies algo del archivo, vuelve a subir `index.html` sobrescribiendo.
> Si no se ve el cambio, vacía caché (Ctrl/Cmd+Shift+R).

### Camino 2 — En Hostinger solo tienes el dominio (sin hosting)

Usa un hosting estático gratuito y apunta el subdominio con un registro DNS.

1. Sube `index.html` a **Cloudflare Pages** ([pages.cloudflare.com](https://pages.cloudflare.com),
   opción *Direct Upload* / *Drag and drop*) o **Netlify** ([app.netlify.com/drop](https://app.netlify.com/drop)).
   Te darán una dirección tipo `nahia-xxxx.pages.dev` o `xxxx.netlify.app`.
2. En **hPanel → Dominios → soulbloom.me → DNS / Editar zona DNS**, añade:

   | Tipo | Nombre | Apunta a | TTL |
   |---|---|---|---|
   | `CNAME` | `listadenahia` | `nahia-xxxx.pages.dev` *(tu dirección del paso 1, sin `https://`)* | por defecto |

3. En Cloudflare Pages / Netlify, en *Custom domains*, añade `listadenahia.soulbloom.me`
   y sigue su asistente (verifica el CNAME y emite el SSL solo).
4. Espera a que propague el DNS (de 5 min a ~1 h). Prueba `https://listadenahia.soulbloom.me`.

> **Nota sobre el nombre:** pediste `soulbloom.listadeseosnahia.me`, pero eso sería un
> subdominio de `listadeseosnahia.me` (que no tienes). Con `soulbloom.me` el subdominio
> correcto es `listadenahia.soulbloom.me` (el que se ha configurado). Si prefieres otro
> texto antes del punto (p. ej. `nahia.soulbloom.me`), cámbialo en el paso 3 de arriba.

---

## Pendiente / a revisar (detalle en la columna *Notas* de la hoja «Lista»)

| Regalo | Qué falta |
|---|---|
| **Cubrebebé de porteo (Mamalila)** y **Cardigan (Petit Bateau)** | El enlace es una *categoría*, no un producto. Sin precio ni foto → ocultos en la web hasta elegir el modelo. |
| **Alfombra Rug Editorial** | La web mostró el precio en leis rumanos; hay que confirmar el precio real en €. En la web pone «Ver precio en la web». |
| **H&M (5 conjuntos)** | H&M no deja leer el precio automáticamente. Los importes (`≈ …`) son aproximados: confírmalos a mano. |
| **Pack cambiador Twistshake** | El enlace ahora lleva al *pack de baño + cambiador* (189,99 €), no solo al cambiador. Ya está reservado igualmente. |
| **Sacaleches Momcozy** | El Excel lo llamaba «S12 Pro»; el enlace real es el «Mobile Style M6» (corregido en la web y la hoja). |
| **Cómoda / Gimnasio Lovevery** | Sin foto de producto limpia. En la web se puede arrastrar una foto encima de la tarjeta. |
| **Fila 49 del Excel** | Estaba vacía (sin nombre ni enlace). No se ha incluido en la base de datos. |

### Cambios de precio aplicados respecto a la versión anterior
- Protector colchón Ecus Kids: **15,60 € → 39 €**
- Bodis ballenas / corazones Petit Bateau: **~30 € → 27 €**
- Bañera Twistshake: **89,99 € → 41,99 €**
- Pack cambiador Twistshake: **89,99 € → 189,99 €** (ahora es el pack baño+cambiador)
- Gimnasio Lovevery: **145–150 € → 155 €**
- Lavabiberones Momcozy: **~60 € → 369,99 €**
- Muselinas Minimax / capa de baño / arrullo: tallas corregidas a las de la web.
