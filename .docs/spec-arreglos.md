# Spec de arreglos — Hidden Gems Puerto Escondido

Sitio: vanilla HTML/CSS/JS, deploy con GitHub → Netlify.
Datos: `casas.json`, `testimonios.json`.

**Cómo usar este documento:** trabaja una fase por sesión de Claude Code. Al terminar cada fase, haz commit, verifica el deploy en el celular y en incógnito, y hasta entonces pasa a la siguiente. No pegues todo el documento de un jalón.

---

## FASE 1 — Fugas de conversión

Esto es lo que está costando reservas hoy. Empieza aquí.

### 1.1 Links de WhatsApp con mensaje precargado

**Problema:** todos los CTA apuntan a `https://wa.me/528661154305` sin parámetro `text`. Cada conversación empieza en frío y no hay forma de saber de qué página vino.

**Instrucción:**

Crea un helper único en el JS compartido (`assets/js/whatsapp.js` si no existe) y úsalo en todos los CTA del sitio:

```js
const WA_NUMERO = '528661154305';

function waLink(mensaje) {
  return `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
```

Mensajes por contexto:

| Ubicación | Mensaje precargado |
|---|---|
| Header / footer (genérico) | `Hola Patty, vengo de tu sitio y quiero información sobre las casas.` |
| CTA final del home | `Hola Patty, vengo de tu sitio. Quiero información sobre disponibilidad.` |
| Tarjeta de casa (catálogo) | `Hola Patty, me interesa {NOMBRE_CASA}. ¿Está disponible?` |
| Página de detalle de casa | `Hola Patty, me interesa {NOMBRE_CASA} ({CAPACIDAD} personas). ¿Tienes disponibilidad?` |
| Lightbox de galería | `Hola Patty, me interesa {NOMBRE_CASA}. ¿Está disponible?` |
| Add-ons (bundle) | `Hola Patty, me interesan estos extras: {LISTA}. ¿Me cotizas?` |
| Buscador con fechas | `Hola Patty, busco casa del {CHECKIN} al {CHECKOUT} para {PERSONAS} personas.` |

Si el usuario ya llenó fechas en el buscador, agrégalas al mensaje de cualquier CTA de casa que toque después. Guarda las fechas en `sessionStorage` para eso.

Todos los mensajes en español. Si el toggle de idioma está en EN, usa la versión en inglés equivalente.

### 1.2 Botones muertos

Dos `href="#"` que hay que conectar:

- **"Cotiza por WhatsApp"** en la sección de add-ons del home → debe armar el bundle con los checkboxes seleccionados y abrir `waLink()`. Si no hay nada seleccionado, deshabilita el botón visualmente en vez de mandar mensaje vacío.
- **"Reservar por WhatsApp"** dentro del lightbox de galería → debe usar el nombre de la casa que está abierta en ese momento.

Después de arreglarlos, haz un barrido: busca `href="#"` en todo el proyecto y verifica que cada uno sea intencional (anclas de scroll) y no un botón sin conectar.

### 1.3 Catálogo renderizado en el servidor

**Problema:** `/casas` llega sin ninguna tarjeta en el HTML. Todo se pinta con JS desde `casas.json`. Google no lo ve, el preview de WhatsApp no lo ve, y en conexión lenta el usuario ve una página vacía.

**Instrucción:**

Crea un script de build en Node (`build.js`) que lea `casas.json` y genere las tarjetas como HTML estático dentro de `casas.html` (y las destacadas del home) antes del deploy.

- Usa un marcador en el HTML, por ejemplo `<!-- CASAS:START -->` / `<!-- CASAS:END -->`, y reemplaza lo que esté entre los dos.
- El JS del cliente sigue existiendo, pero solo para **filtrar** (fechas, personas) las tarjetas que ya están en el DOM — no para crearlas.
- Configura el build command en Netlify: `node build.js`.
- No agregues frameworks. Node + `fs` es suficiente.

Mismo tratamiento para las 13 páginas de detalle si también se generan en cliente.

### 1.4 Fotos: peso y carga

**Problema reportado:** de las 5 fotos del mini-carrusel solo cargan 3; en las páginas de detalle las primeras 5 cargan y el resto va lentísimo.

**Instrucción:**

1. Script de optimización (`optimizar-fotos.js`) con `sharp`:
   - Ancho máximo 1600px para galería, 800px para tarjetas.
   - Genera `.webp` con calidad 80, conservando el `.jpg` como fallback.
   - Sobrescribe en `assets/img/` manteniendo los nombres, con sufijo de tamaño: `casa-amara-1-800.webp`, `casa-amara-1-1600.webp`.
2. En el HTML usa `<picture>` con `srcset` para servir el tamaño correcto según el viewport.
3. `loading="lazy"` en todas las imágenes **excepto** la primera del hero y la primera de cada galería.
4. Reserva el espacio con `width`/`height` o `aspect-ratio` en CSS para que no salte el layout.
5. Investiga por qué las últimas 2 fotos del mini-carrusel quedan en gris — probablemente son rutas rotas o archivos que no se subieron. Verifica que cada ruta en `casas.json` corresponda a un archivo real y reporta las que falten.

**Meta:** ninguna imagen arriba de 300 KB. Reporta el peso total de `assets/img/` antes y después.

### 1.5 Testimonios vacíos

**Problema:** la sección "Lo que dicen quienes se quedaron" carga sin contenido. Una sección de prueba social en blanco comunica que nadie se ha quedado.

**Instrucción:** si `testimonios.json` tiene menos de 3 entradas completas (nombre + texto + foto), oculta la sección entera. Nada de placeholders visibles.

---

## FASE 2 — Confianza

### 2.1 Dominio propio

Cuando el dominio esté comprado y apuntado en Netlify:

- Actualiza todas las URLs absolutas del proyecto.
- Verifica que Netlify tenga HTTPS y redirección de www a raíz (o al revés, pero consistente).
- Redirige el subdominio `.netlify.app` al dominio nuevo con `_redirects` (301).

### 2.2 Metadatos

- **`og:url` del home apunta a `quedatepuertoescondido.netlify.app`** — marca vieja. Corrígelo en todas las páginas.
- Agrega `<link rel="canonical">` en cada página.
- Agrega `og:image` propio a cada página de detalle de casa (la foto principal de esa casa, no una genérica).
- Verifica que `og:image` sea absoluta y mida al menos 1200×630.

### 2.3 Política de cancelación y anticipo

Agrega al paso 2 de "Cómo funciona", debajo del texto actual:

> Recibes confirmación por escrito con los datos de la propiedad y de la administración que la opera.

Y crea una página `/politicas` (enlazada desde el footer y desde el paso 2) con: monto del anticipo, plazo para liquidar, condiciones de cancelación y reembolso, y horarios de check-in/check-out.

**Necesito el texto de ti** — Claude Code no puede inventar tus políticas. Déjalo con `TODO` si aún no lo tienes.

### 2.4 Nav consistente

"Cómo llegar" aparece en el nav del home y desaparece en `/casas`. Extrae header y footer a un partial que el `build.js` inyecte en todas las páginas, para que dejen de divergir.

### 2.5 Redes sociales

Agrega links a TikTok e Instagram en el footer y en la sección "Sobre mí". Iconos discretos, no botones grandes.

---

## FASE 3 — Bilingüe bien hecho (sesión aparte)

**Problema:** los dos idiomas viven en el mismo DOM y se ocultan con CSS. Google ve cada frase duplicada en dos idiomas — se lee como contenido de baja calidad y ninguna versión posiciona. También duplica el peso de cada página.

**Instrucción:**

1. Extrae todo el texto a `contenido/es.json` y `contenido/en.json`, con las mismas llaves.
2. `build.js` genera dos árboles: `/` (español) y `/en/` (inglés), cada uno con **un solo idioma** en el HTML.
3. Agrega en cada página:
   ```html
   <link rel="alternate" hreflang="es" href="https://TUDOMINIO.com/casas">
   <link rel="alternate" hreflang="en" href="https://TUDOMINIO.com/en/casas">
   <link rel="alternate" hreflang="x-default" href="https://TUDOMINIO.com/casas">
   ```
4. El toggle ES/EN deja de ocultar/mostrar y pasa a ser un link a la misma página en el otro idioma.
5. `lang` correcto en el `<html>` de cada versión.

Esto es refactor real. Hazlo en una rama aparte y verifica página por página antes de mergear.

---

## FASE 4 — Medición

1. Activa **Netlify Analytics** (no requiere código) o instala **GA4**.
2. Evento de clic en cada CTA de WhatsApp, con el contexto como parámetro (qué casa, qué página).
3. Soporte de **UTMs**: si la URL trae `utm_source`, guárdalo en `sessionStorage` y agrégalo al mensaje de WhatsApp como sufijo discreto (ej. `[tiktok]`), para que sepas de qué canal vino cada chat.
4. Genera `sitemap.xml` y `robots.txt` desde `build.js`.

Los dos números que necesitas al final del mes: **visitas por chat de WhatsApp** y **chats por reserva**.

---

## FASE 5 — Modelo

### 5.1 Rangos de precio

Agrega a `casas.json` un campo `precio_desde` por casa y muéstralo en la tarjeta y en la página de detalle como "Desde $X MXN/noche · temporada baja". Deja claro que el precio final se cotiza por WhatsApp.

**Necesito los rangos de ti.**

### 5.2 Captura de correo

Formulario de un solo campo (correo) a cambio de tu guía de Puerto Escondido: dónde comer, dónde surfear, dónde ver el atardecer.

- Usa **Netlify Forms** (`data-netlify="true"`), sin backend ni servicio externo.
- Colócalo al final del home, después de "Sobre mí", y en el footer de las páginas de casas.
- La guía puede ser un PDF servido desde `/assets/`.

---

## Lo que se necesita de Patty (no lo puede resolver Claude Code)

- [ ] Comprar el dominio y apuntarlo en Netlify
- [ ] Texto de la política de cancelación, anticipo y reembolso
- [ ] Rangos de precio "desde" por casa
- [ ] Tres testimonios completos con nombre y foto autorizados
- [ ] La guía de Puerto Escondido en PDF
- [ ] URLs de TikTok e Instagram

---

## Orden recomendado

1. **Fase 1** completa (1.1 → 1.2 → 1.5 → 1.4 → 1.3). Una tarde para las cuatro primeras; 1.3 pide su propia sesión.
2. **Fase 2**, en cuanto tengas el dominio.
3. **Fase 4**, corta y de alto retorno — hazla antes que la 3.
4. **Fase 3**, cuando tengas una sesión larga y tranquila.
5. **Fase 5**, cuando tengas los precios y la guía.
