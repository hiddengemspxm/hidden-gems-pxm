# Hidden Gems Puerto Escondido — Instrucciones de Proyecto

## Contexto

Sitio web vanilla HTML/CSS/JS para Puerto Escondido. Deploy: GitHub → Netlify.  
Datos: `casas.json`, `testimonios.json`.

**Documentación de arreglos:** [.docs/spec-arreglos.md](.docs/spec-arreglos.md)

## Flujo de trabajo

1. **Una fase por sesión** — trabaja un objetivo en `.docs/spec-arreglos.md`, complétalo, commit y verifica en celular + incógnito antes de pasar a la siguiente.
2. **No pegues todo** — lee la fase que necesitas, no el documento completo.
3. **Verifica en navegador** antes de dar por hecha cualquier tarea visual.

## Estructura

```
.
├── .docs/
│   └── spec-arreglos.md          # Plan de trabajo (5 fases)
├── index.html                     # Home
├── casas.html                     # Catálogo
├── assets/
│   ├── css/
│   ├── img/
│   └── js/
└── data/
    ├── casas.json
    └── testimonios.json
```

## Prioridades actuales

**FASE 1 — Fugas de conversión** (comienza aquí)
- 1.1: Links de WhatsApp con mensaje precargado
- 1.2: Botones muertos (`href="#"` sin conectar)
- 1.3: Catálogo renderizado en servidor (build.js)
- 1.4: Optimización de fotos (weight + srcset)
- 1.5: Ocultar testimonios si están vacíos

## Notas

- No use frameworks — vanilla JS + Node.js (fs) para el build.
- Mensajes de WhatsApp en español; versión inglesa si `lang=en`.
- Almacene fechas en `sessionStorage` para pasar entre páginas.
- Cada imagen debe pesar <300KB.

## Deploy

Branch: `main`  
Netlify build command: `node build.js`  
URL: `quedatepuertoescondido.netlify.app` (cambiar cuando tenga dominio propio)
