# PROMPT PARA CLAUDE CODE — Hidden Gems Puerto Escondido: Catálogo Ampliado v2

> Pega todo este documento como primer mensaje en Claude Code, desde la carpeta del proyecto.

---

## 0. RECONSTRUIR EL PROYECTO DESDE EL SITIO EN VIVO (hacer esto PRIMERO)

No tengo la carpeta local de la última versión. El sitio en producción es estático puro, así que la versión publicada ES el código fuente. Antes de cualquier cambio:

1. Crea una carpeta nueva `hidden-gems` y descarga el sitio completo desde `https://quedatepuertoescondido.netlify.app/` con `wget --mirror` (o equivalente): página principal, `/casas`, `/paquetes`, cualquier otra página enlazada, y toda la carpeta `assets/` (imágenes incluidas).
2. Ajusta lo necesario para que funcione localmente (nombres de archivo de las rutas bonitas tipo `/casas` → `casas.html` o `casas/index.html`, según cómo lo sirva Netlify; rutas relativas correctas).
3. Ábrelo localmente y confirma que se ve idéntico al sitio en vivo (ES y EN, lightbox de fotos, widget de disponibilidad) ANTES de empezar los cambios.
4. Haz `git init` y un commit inicial "versión en producción recuperada" — quiero poder regresar a este punto siempre.

---

Quiero actualizar mi sitio (HTML/CSS/JS vanilla, deploy en Netlify) con estos cambios. Mantén la identidad de marca actual: tipografías **Fraunces + DM Sans**, paleta **musgo, vino, ocre, lino**, y el toggle bilingüe **ES/EN** existente. Sitio mobile-first: la mayoría de mis clientes llegan por WhatsApp desde el celular.

## 1. ELIMINAR TODOS LOS LINKS A AIRBNB

- Busca en todo el proyecto cualquier link, botón o mención que dirija a airbnb.com y elimínalo.
- El único CTA de cada propiedad es **WhatsApp** con mensaje precargado (formato en sección 5).
- No dejes texto tipo "también en Airbnb". La reserva directa es el único camino visible.

## 2. NUEVA ESTRUCTURA DEL CATÁLOGO — POR TIPO DE VIAJE

Reorganiza las property cards en tres secciones con encabezado propio:

### Sección A — "Parejas y amigos en La Punta" / EN: "Couples & friends in La Punta"
- Las 7 casas actuales del portafolio (mantener su orden y contenido actual).
- Agregar aquí: **Casa Yara** (antes "New Luxury Villa 5 min from La Punta" — usar SOLO el nombre Casa Yara).

### Sección B — "Grupos y celebraciones" / EN: "Groups & celebrations"
Orden: de mayor a menor capacidad.
- **Casa Aixha** — 20 huéspedes · 9 habitaciones · 9 baños · vista al mar · a 300 m de la playa
- **Complejo Luwak** — hasta 20 huéspedes (ver sección 3, es UNA card especial)
- **Casa Mochila** — 14 huéspedes · 6 habitaciones · 6 baños · jacuzzi · alberca · pet friendly
- **Casa Cambria** — 12 huéspedes · 6 habitaciones · 6 baños

### Sección C — "Lujo frente al mar" / EN: "Beachfront luxury"
- **Casa Mar** — 9 huéspedes · 4 habitaciones · 5 baños · frente a la playa · staff completo incluido (chef, limpieza)

### Propiedad en borrador (NO publicar todavía)
- **Brutal Verde** — 5 huéspedes · 2 habitaciones · 2 albercas · vista al mar. Crear la card con `display:none` o un flag `draft: true` para activarla después de mi visita y sesión de fotos.
- Si es fácil, agrega el mismo mecanismo de flag a Casa Cambria por si decido pausarla tras revisar sus reviews.

## 3. CARD ESPECIAL: COMPLEJO LUWAK

Una sola card en la sección Grupos, con badge "Complejo completo · hasta 20 huéspedes":
- **Casa Luwak** — 10 huéspedes · 5 hab · 6 baños · 2 albercas · rooftop con vista al mar · servicio de chef
- **Casa Luwak 2** — 6 huéspedes · 3 hab · 3 baños · vista al mar
- **Casa Luwak 1** — 4 huéspedes · 2 hab · 3 baños · vista al mar

Al abrir la card (o en su página de detalle), mostrar las 3 unidades como opciones: se puede rentar el complejo entero o unidades por separado. El CTA de WhatsApp del complejo pregunta por número de huéspedes.

## 4. TEXTOS DE LAS CASAS NUEVAS (ES — generar versión EN equivalente)

Tono de marca: cálido, directo, curador local. Nada de "lujo inigualable" genérico. Cada descripción 2-3 líneas máximo en la card.

- **Casa Aixha:** "Nueve habitaciones, vista al mar y espacio para 20. La casa para el cumpleaños grande, el retiro o la boda íntima que no cabe en ningún otro lado de Puerto."
- **Casa Mar:** "Frente a la playa, con chef y staff incluidos. Despiertas, abres la puerta y estás en la arena. Así de literal."
- **Casa Mochila:** "Seis habitaciones, jacuzzi, alberca y sí — tu perro también viene. La favorita para grupos de amigos que quieren todo en un solo lugar."
- **Complejo Luwak:** "Tres casas, dos albercas y un rooftop con atardecer. Réntalo completo para 20 o elige tu unidad. Chef disponible."
- **Casa Yara:** "A 5 minutos de La Punta, nueva y impecable. Cuatro habitaciones para un grupo que quiere la escena cerca pero dormir en silencio."
- **Casa Cambria:** "Seis habitaciones para 12, a buen precio para grupos grandes que priorizan espacio."
- **Brutal Verde (borrador):** "Dos albercas, vista al mar y solo 2 habitaciones: la proporción más exagerada de Puerto, en el buen sentido."

Nota: los datos duros (huéspedes/hab/baños) van como iconos/specs en la card, no repetidos en el texto.

## 5. CTA DE WHATSAPP POR PROPIEDAD

Cada card lleva botón "Reservar por WhatsApp" con `https://wa.me/<MI_NUMERO>?text=` y mensaje precargado:
- ES: `Hola Paty! Me interesa [NOMBRE DE LA CASA] — ¿me compartes disponibilidad y tarifa?`
- EN: `Hi Paty! I'm interested in [HOUSE NAME] — could you share availability and rates?`
- El idioma del mensaje sigue el idioma activo del sitio.
- Deja `<MI_NUMERO>` como constante única en el código para cambiarlo en un solo lugar.

## 6. SECCIÓN DE CONFIANZA (nueva, antes del footer)

Tres bloques:
1. **"Quién está detrás"** — foto mía + texto corto: "Soy Paty. Vivo en La Punta y visité, recorrí y fotografié personalmente cada casa de este catálogo. Me escribes y te respondo yo, no un call center." (versión EN equivalente)
2. **"Cómo se reserva"** — 3 pasos: ① Me escribes por WhatsApp → ② Apartas tus fechas con 30% de anticipo (Stripe, Mercado Pago, SPEI o Zelle) → ③ El resto lo pagas antes de tu llegada. Enfatizar: "No pagas el 100% por adelantado."
3. **"Lo que dicen los huéspedes"** — carrusel/grid de reviews. Por ahora usa 4 placeholders con estructura `[COMENTARIO]` — `[Nombre, País, Mes Año]`. Yo los reemplazo con reviews reales cuando tenga los permisos. NO inventes reviews.

## 7. REGLAS QUE NO SE TOCAN

- Los paquetes (Sunrise Surf & Soul, Puerto Fiesta Weekend, Full Puerto) se muestran SIEMPRE con un solo precio, nunca desglosado por componente.
- No agregar precios por noche de las casas nuevas todavía — la tarifa se da por WhatsApp.
- Mantener el widget de disponibilidad de Google Sheets como está; las casas nuevas se agregan al Sheet después (yo paso los iCal de Hostaway aparte).

## 8. ORDEN DE TRABAJO SUGERIDO

0. Reconstruir el proyecto desde el sitio en vivo (sección 0) + commit inicial.
1. Quitar links de Airbnb (sitio completo — incluye el botón "Ver en Airbnb" del lightbox de fotos). OJO: las menciones comparativas tipo "hasta 10% menos que en Airbnb" SÍ se quedan; solo se eliminan los links/botones que sacan al cliente del sitio.
2. Reestructurar el catálogo en las 3 secciones.
3. Crear cards nuevas con textos ES/EN y CTAs de WhatsApp.
4. Card especial Complejo Luwak.
5. Sección de confianza.
6. Revisión mobile (probar en viewport de 380px).
7. Deploy a Netlify y pasarme el link de preview antes de producción.

Cuando termines cada paso, muéstrame qué cambió antes de seguir al siguiente.
