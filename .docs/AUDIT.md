# Auditoría de Estado — 2026-08-03

## 1. Sección de Testimonios ("What past guests say")
**Estado: 🔴 INCOMPLETO**

### Problemas encontrados:
- ✅ Las 3 fotos existen: `/assets/img/testimonios/testimonio-mazunte.jpg`, `testimonio-surf.jpg`, `testimonio-bioluminiscencia.jpg`
- ✅ El texto de bioluminiscencia SÍ está corregido (dice "lancha privada", no "tour genérico")
- ❌ **Falta el campo `"casa"` en cada testimonio** — El renderer en `principal.js:581` intenta acceder a `t.casa`, pero los datos de `testimonios.json` NO tienen ese campo. Solo tienen `nombre`, `pais`, `actividad`, `foto`, `texto_es/en`, `fecha`.
- ❌ **Los 3 testimonios actuales están marcados como placeholder=true** — deben reemplazarse con testimonios reales o mantener banderas de ejemplo si son solo demos.
- ❌ **Sección "Sobre mí" — no revisada en detalle** pero el texto en `index.html:279` NO menciona que Patty tomó fotos de casas (está bien).

### Para completar:
1. Agregar campo `"casa"` a cada testimonio (ej: `"casa": "Casa Amara"`)
2. Reemplazar los 3 testimonios placeholders con testimonios reales, O mantener flags de placeholder pero con datos completos

---

## 2. Sección "Arma tu estancia a tu manera" ("Build your stay your way")
**Estado: 🟢 COMPLETADO (con detalles)**

### ✅ Verificado como listo:
- ✅ **Sin emojis en nombres** — Los `<h3>` dentro de `.extra-card` contienen solo texto limpio, sin emojis
- ✅ **Fotos en `/assets/img/addons/`** — Los 4 addons específicos existen:
  - `ballenas.jpg` (4.0 KB) + fallback + webp
  - `dolphin-watching.jpg` (4.0 KB) + fallback + webp
  - `bioluminiscencia.jpg` (4.0 KB) + fallback + webp
  - `tortugas.jpg` (4.0 KB) + fallback + webp
- ✅ **Botón "Cotiza por WhatsApp" funcional** — `index.html:212` tiene `onclick="window.HGP.cotizarExtrasBundle()"` wired correctamente en `principal.js:775`
- ✅ **Fotos se cargan correctamente** — Cada `.extra-card` tiene `style="background-image: url('/assets/img/addons/...')"` 

### ⚠️ Nota visual:
- Las 4 fotos nuevas (ballenas, dolphin, bioluminiscencia, tortugas) tienen exactamente 4 KB cada una — son placeholders miniatura, no fotos reales de alta resolución. **Esto es visible en el navegador — aparecen como cuadros de color**. Si hay fotos reales de esos servicios, deben reemplazarse.

---

## 3. Showcase de Casas en Home ("Casas" carrusel)
**Estado: 🟡 PARCIALMENTE COMPLETO**

### ✅ Lo que funciona:
- El carrusel existe y rota automáticamente cada 7 segundos (línea 239 de principal.js)
- Se muestra en fade-out/fade-in (CSS opacidad, no scroll)
- Está wired correctamente

### ❌ Problema con el efecto "filmstrip":
- **NO hay efecto de deslizamiento tipo "tira"** — El código usa `classList.add('carousel-fade-out')` (opacidad) y reemplaza todo el HTML
- Para un efecto filmstrip suave real, necesitaría:
  - CSS `scroll-snap-type`, `scroll-behavior: smooth`
  - Uso de `scrollBy()` suave (como en el photo-carousel, línea 687-690)
  - O un carrusel con transform/translate animado

---

## 4. Tarjetas de Casas en Catálogo
**Estado: 🟢 COMPLETADO**

### ✅ Verificado:
- ✅ **Mini-carrusel carga hasta 5 fotos** — `principal.js:132` tiene `.slice(0, 5)`
- ✅ **CSS scroll-snap funciona** — `.carrusel-track` tiene `scroll-snap-type:x mandatory` y `scroll-snap-align:start`
- ✅ **Scroll nativo del navegador** — `-webkit-overflow-scrolling:touch` y `scrollbar-width:none` para ocultar scrollbar
- ✅ **Las casas en `casas.json` tienen arrays de fotos** — ej: Casa Amara tiene 35 fotos, se mostrarán las primeras 5

---

## 5. Página "Cómo llegar"
**Estado: 🟡 PARCIALMENTE COMPLETO**

### ✅ Lo que está bien:
- La estructura HTML y contenido son correctos

### ❌ Problema tipografía/nav:
- **En `como-llegar.html:15-28`, el header tiene estructura DIFERENTE al resto**:
  - En `index.html` y `casas/index.html`: 
    - `.brand` usa `<em>Hidden Gems</em>` con clase `.brand`
    - Nav usa `<a href>` con `<span data-es>` y `<span data-en>`
  - En `como-llegar.html`:
    - `.brand` NO tiene `<em>`, texto inline
    - Nav usa `<a ... data-es>` (atributo en el `<a>`, NO en span anidado)
    - Esto rompe la consistencia y potencialmente el CSS/JavaScript de idioma

**Solución:** Sincronizar el header de como-llegar.html con index.html

---

## 6. Sistema de Disponibilidad
**Estado: 🔴 NO CONFIGURADO**

### ✅ Infraestructura existe:
- Archivo `disponibilidad.js` existe
- Lógica de parsing CSV y overlap detection implementada
- Funciones wired en buscadores (`index.html:421`, `casas/index.html:114`)

### ❌ No está funcional:
- **`disponibilidad.js:5` — `var CSV_URL = '';`** está vacío
- El comentario dice: `[PENDIENTE: pegar aquí la URL del CSV publicado...]`
- Sin CSV_URL, todas las búsquedas fallan silenciosamente (`catch` en línea 60 retorna `{ ok: false }`)
- **NO EXISTE `data/disponibilidad.json`** — todo depende del CSV de Google Sheets

### Para habilitar:
1. Publicar Google Sheet como CSV (Archivo > Compartir > Publicar en la web > CSV)
2. Copiar URL en `disponibilidad.js:5`

---

## Resumen de Pendientes (en orden de prioridad)

| # | Ítem | Estado | Esfuerzo |
|---|------|--------|----------|
| 1 | Testimonios: agregar campo `"casa"` a cada uno | 🔴 BLOQUEADO | 5 min |
| 2 | Testimonios: reemplazar placeholders con reales | 🔴 BLOQUEADO | ~30 min (depende contenido) |
| 3 | Fotos de addons (ballenas/dolphin/etc): reemplazar placeholders 4KB con reales | 🔴 BLOQUEADO | ~10 min (si tienes las fotos) |
| 4 | Carrusel home: efecto filmstrip suave (vs fade) | 🟡 NICE-TO-HAVE | ~1 hora |
| 5 | Página "Cómo llegar": sincronizar header con index.html | 🟢 READY | ~10 min |
| 6 | Sistema disponibilidad: configurar CSV_URL de Google Sheets | 🔴 BLOQUEADO | ~5 min |

**Bloqueados = requieren datos/decision del usuario**
