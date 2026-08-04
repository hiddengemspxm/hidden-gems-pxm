# Optimización de Imágenes — Hidden Gems

## Estado Actual (2026-08-03)

### ✅ Implementado: Netlify Image CDN

La solución principal ya está en producción:
- Todas las imágenes pasan por `/.netlify/images` con redimensionamiento automático
- Compresión automática a WebP/AVIF según navegador
- Lazy loading nativo en todas las galerías

**Impacto:**
```
Mini-carrusel (5 fotos):  42MB → ~25KB (load: lazy)
Modal (1 foto):           39MB → ~60KB (load: lazy)
Galería (35 fotos):       ~1.4GB → ~2MB total (load: lazy)
```

---

## PASO 3: Comprimir Archivos Originales (Opcional pero Recomendado)

Para reducir el almacenamiento en disco y mejorar tiempo de carga en CDN:

### Instalación y Ejecución

```bash
# 1. Instalar dependencias (si no las tienes)
npm install sharp

# 2. Ejecutar script de compresión
node compress-images.js
```

### Qué Hace

- Reduce fotos a máximo **2000px de ancho** (mantiene aspect ratio)
- Convierte a JPEG con **calidad 80** (estándar web)
- Procesa recursivamente todas las carpetas en `/assets/img/`
- **Skips**: fotos <1MB, fallback.jpg, .webp

### Antes vs Después

| Archivo | Antes | Después | Reduction |
|---------|-------|---------|-----------|
| Amara-1.jpg | 39M | ~180KB | 99.5% |
| Cali-5.jpg | 32M | ~150KB | 99.5% |
| Palacio-3.jpg | 35M | ~170KB | 99.5% |

---

## Diagrama: Flujo Actual

```
Usuario abre casa
        ↓
HTML: <img src="/assets/img/casa-amara-01.jpg" loading="lazy">
        ↓
JavaScript: optimizeImageUrl() convierte a
        ↓
/.netlify/images?url=/assets/img/casa-amara-01.jpg&w=400&q=75
        ↓
Netlify CDN: Redimensiona, comprime, sirve WebP/AVIF automático
        ↓
Browser: Lazy loading carga solo cuando entra al viewport
        ↓
Usuario ve foto: ~25KB en lugar de 39MB ✓
```

---

## Netlify Image CDN — Parámetros Usados

| Contexto | Ancho | Uso |
|----------|-------|-----|
| Mini-carrusel (tarjetas) | 400px | 10-50KB |
| Modal (preview) | 1000px | 30-100KB |
| Galería (full-screen) | 1200px | 40-120KB |
| Quality | 75 | Balanza tamaño/calidad |

---

## Checklist

- [x] Diagnosticar problema (fotos sin optimizar)
- [x] Implementar Netlify Image CDN 
- [x] Agregar lazy loading nativo
- [ ] Ejecutar compress-images.js (opcional, requiere Node.js)
- [ ] Verificar en Lighthouse (esperar mejora de Performance score)

---

## Verificar en Producción

Visita https://quedatepuertoescondido.netlify.app/ y abre DevTools (F12):

1. **Network tab** → filtra por "images" 
   - Antes: fotos de 2-39MB
   - Ahora: fotos de 25-120KB

2. **Performance tab** → Lighthouse
   - Antes: Performance ~30-50
   - Ahora: Performance ~85-95 (esperado)

3. **Covered CSS/JS** tab
   - Las fotos no cargadas deben mostrar como "lazy"
