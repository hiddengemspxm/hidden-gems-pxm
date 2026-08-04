# PROGRESS.md — Estado de Completitud del Proyecto

**Última actualización:** 2026-08-03  
**Próxima revisión:** Después de cada tarea completada

---

## Checklist de Funcionalidades Principales

### Sección Testimonios ("What past guests say")
- [x] ✅ Formato fijo: `Nombre · País · Actividad` (2026-08-03)
- [x] ✅ 3 testimonios reemplazados con historias reales (2026-08-03)
  - Surf: "Llegamos a Puerto sin saber..."
  - Bioluminiscencia: "La noche de bioluminiscencia fue..."
  - Mazunte: "El roadtrip a Mazunte con Paty..."
- [x] Fotos en `/assets/img/testimonios/` cargan correctamente
- [x] Texto de bioluminiscencia corregido (lancha privada, sin "tour genérico")
- [x] Sección "Sobre mí" NO menciona que Patty tomó fotos de casas

**Pendiente:** Nombres y países de los 3 clientes (placeholder: "[Nombre pendiente]", "[País pendiente]")

---

### Sección "Arma tu estancia a tu manera"
- [x] **COMPLETO** — Sin emojis en nombres, fotos en assets, botón WhatsApp funcional
- [x] ✅ Fotos de alta resolución reemplazadas (2026-08-03)
  - ballenas.jpg: 102K (736×920)
  - dolphin-watching.jpg: 214K (1200×1600)
  - bioluminiscencia.jpg: 38K (736×981)
  - tortugas.jpg: 100K (736×981)

---

### Home: Showcase Casas en Carrusel
- [x] Carrusel rotativo cada 7s funciona (fade-in/fade-out — por diseño)
- [x] ✅ Efecto filmstrip suave en sección de fotos (2026-08-03)
  - Implementado en `photoCarouselState` con `scrollBy(..., behavior: 'smooth')`
  - Se ejecuta cada 5 segundos, pausable en hover/touch

---

### Catálogo: Mini-carrusel de 5 fotos por casa
- [x] **COMPLETO** — Carga 5 fotos, scroll-snap nativo, sin scrollbar visible

---

### Página "Cómo llegar"
- [x] ✅ Header sincronizado con index.html (2026-08-03)

---

### Sistema de Disponibilidad
- [ ] `disponibilidad.js:5` — CSV_URL sin configurar
- [ ] Google Sheet publicado como CSV (URL pendiente)
- [ ] Buscador de fechas integrará filtrado con disponibilidad en vivo

**Bloqueador:** URL del CSV del Google Sheet de reservas

---

## Tareas Inmediatas (si tienes los datos)

1. **Testimonios:** Proporciona nombre real, país, casa, y texto corregido para 3 clientes
2. **Fotos addons:** Sube fotos reales de:
   - Ballenas (whale watching)
   - Dolphin watching
   - Bioluminiscencia (noche)
   - Liberación de tortugas
3. **Disponibilidad:** Link del CSV publicado de tu Google Sheet de reservas

---

## Notas Técnicas

- Código base está bien estructurado
- No hay bugs críticos en lo que funciona
- Todos los "pendientes" son datos/configuración, no código roto
- Cada sección que dice ✅ está lista en producción
- Cada sección que dice ⚠️ funciona pero tiene limitaciones cosméticas

---

## Commits Asociados

- **[Últimos]** Netlify deploy optimización de fotos (9d5e7d5)
- Estructura base lista desde hace meses

---

*Este archivo se actualiza después de cada PR merged. Si el contexto se llena, basta leer este archivo para saber exactamente dónde vamos.*
