# Lista de regalos de Nahia

Web de la lista de nacimiento de Nahia (27 · 11 · 2026).

- **`index.html`** — la web entera, en un solo archivo. Es lo que sirve GitHub Pages.
- **`apps-script/Codigo.gs`** — puente opcional con una hoja de Google para compartir las reservas en vivo.
- **`DEPLOY.md`** — cómo conectar la hoja de Google y (si se quiere) un dominio propio.

## Publicar

GitHub Pages: *Settings → Pages → Deploy from a branch → `main` / `root`*.
URL: `https://<usuario>.github.io/<repo>/`.

## Editar

Cambia `index.html` y haz commit. Se actualiza solo en ~30 s.
La configuración (número de WhatsApp, URL de la hoja de Google) está al principio del `<script>`, en las constantes `WA_NUMBER` y `SHEET_URL`.
