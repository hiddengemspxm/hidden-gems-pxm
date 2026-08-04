/* Lógica compartida: catálogo de casas, modal, buscador de fechas, testimonios, links de WhatsApp */
(function () {
  var WHATSAPP_NUMBER = '528661154305';

  // ===== Optimización de imágenes con Netlify Image CDN =====
  function optimizeImageUrl(src, width, height) {
    if (!src) return src;
    // Pasar por Netlify Image CDN para redimensionar, comprimir y convertir a WebP/AVIF
    // Sintaxis: /.netlify/images?url=<image-path>&w=<width>&h=<height>&q=80
    var params = 'url=' + encodeURIComponent(src) + '&w=' + width;
    if (height) params += '&h=' + height;
    params += '&q=75'; // Quality 75 es bueno para web
    return '/.netlify/images?' + params;
  }

  var casasCache = null;
  var ultimaBusqueda = { checkin: null, checkout: null };

  function lang() {
    return (window.getLang && window.getLang()) || 'es';
  }

  function buildWhatsAppLink(mensaje) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(mensaje);
  }

  function formatFecha(iso) {
    if (!iso) return '';
    var partes = iso.split('-');
    var d = new Date(Date.UTC(+partes[0], +partes[1] - 1, +partes[2]));
    var locale = lang() === 'es' ? 'es-MX' : 'en-US';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  function mensajeCasa(casa, checkin, checkout) {
    var l = lang();
    var msg;
    if (casa.tipo === 'complejo') {
      msg = l === 'es'
        ? ('Hola Paty! Me interesa ' + casa.nombre + ' — ¿cuántos huéspedes seríamos? Así me dices si conviene el complejo completo o una unidad, con disponibilidad y tarifa.')
        : ("Hi Paty! I'm interested in " + casa.nombre + ' — how many guests would we be? Let me know if the full complex or a single unit makes more sense, with availability and rates.');
    } else {
      msg = l === 'es'
        ? ('Hola Paty! Me interesa ' + casa.nombre + ' — ¿me compartes disponibilidad y tarifa?')
        : ("Hi Paty! I'm interested in " + casa.nombre + ' — could you share availability and rates?');
    }
    if (checkin && checkout) {
      msg += l === 'es'
        ? (' Fechas: ' + formatFecha(checkin) + ' al ' + formatFecha(checkout) + '.')
        : (' Dates: ' + formatFecha(checkin) + ' to ' + formatFecha(checkout) + '.');
    }
    return msg;
  }

  function cargarCasas() {
    if (casasCache) return Promise.resolve(casasCache);
    return fetch('/data/casas.json').then(function (res) { return res.json(); }).then(function (data) {
      casasCache = data.filter(function (c) { return !c.draft; });
      return casasCache;
    });
  }

  function cargarTestimonios() {
    return fetch('/data/testimonios.json').then(function (res) { return res.json(); });
  }

  function cargarPerks() {
    return fetch('/data/perks.json').then(function (res) { return res.json(); }).then(function (data) {
      return data.filter(function (p) { return !p.draft; });
    });
  }

  function renderPerks(container) {
    cargarPerks().then(function (perks) {
      if (!perks.length) {
        container.innerHTML = '';
        return;
      }
      
      var html = perks.map(function (perk) {
        return (
          '<div class="perk-card' + (perk.draft ? ' draft' : '') + '">' +
            '<span class="perk-emoji">' + (perk.emoji || '✨') + '</span>' +
            '<div class="perk-categoria">' +
              '<span data-es>' + perk.categoria_es + '</span>' +
              '<span data-en>' + perk.categoria_en + '</span>' +
            '</div>' +
            '<div class="perk-nombre">' + perk.nombre + '</div>' +
            '<div class="perk-beneficio">' +
              '<span data-es>' + perk.beneficio_es + '</span>' +
              '<span data-en>' + perk.beneficio_en + '</span>' +
            '</div>' +
            '<div class="perk-canjear">' +
              '<span data-es>' + perk.como_canjear_es + '</span>' +
              '<span data-en>' + perk.como_canjear_en + '</span>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      
      container.innerHTML = html;
      applyLangSafe();
    });
  }


  // ===== Secciones del catálogo =====
  var SECCIONES = [
    { id: 'parejas', es: 'Parejas y amigos', en: 'Couples & friends' },
    { id: 'grupos', es: 'Grupos y celebraciones', en: 'Groups & celebrations' },
    { id: 'lujo', es: 'Lujo frente al mar', en: 'Beachfront luxury' }
  ];

  // ===== Tarjetas de casas =====
  // Fila de specs de la card: 👥 huéspedes y 🛏 habitaciones. Si algún dato no
  // existe todavía (p.ej. huéspedes pendientes de confirmar), esa pieza se omite.
  function casaStatsHTML(casa) {
    var piezas = [];
    if (casa.huespedes != null) {
      piezas.push(
        '<span class="stat"><span aria-hidden="true">👥</span> ' +
          '<span data-es>' + casa.huespedes + ' personas</span>' +
          '<span data-en>' + casa.huespedes + ' guests</span>' +
        '</span>'
      );
    }
    if (casa.habitaciones != null) {
      piezas.push(
        '<span class="stat"><span aria-hidden="true">🛏</span> ' +
          '<span data-es>' + casa.habitaciones + ' habitaciones</span>' +
          '<span data-en>' + casa.habitaciones + ' bedrooms</span>' +
        '</span>'
      );
    }
    return '<div class="casa-card-stats">' + piezas.join('') + '</div>';
  }

  // Mini-carrusel deslizable de la card (3-5 fotos, scroll-snap nativo sin JS).
  // Si la casa tiene zona_es/en, se muestra un tag pequeño sobre la foto para
  // ubicar de un vistazo (La Punta, Zicatela, etc.). Si no hay zona registrada
  // todavía, simplemente no se imprime nada -- no se inventa ubicación.
  function casaCarruselHTML(casa) {
    var fotos = casa.fotos.slice(0, 5);
    var imgs = fotos.map(function (src, i) {
      // Para mini-carrusel: 400px de ancho (thumbnails)
      var optimizedSrc = optimizeImageUrl(src, 400);
      return '<img src="' + optimizedSrc + '" loading="lazy" alt="' + casa.nombre + ' foto ' + (i + 1) + '">';
    }).join('');
    var dots = fotos.length > 1
      ? '<div class="carrusel-dots">' + fotos.map(function () { return '<span></span>'; }).join('') + '</div>'
      : '';
    var zonaTag = casa.zona_es
      ? '<span class="tag-zona"><span data-es>' + casa.zona_es + '</span><span data-en>' + casa.zona_en + '</span></span>'
      : '';
    return (
      '<div class="casa-card-carrusel">' +
        zonaTag +
        '<div class="carrusel-track">' + imgs + '</div>' +
        dots +
      '</div>'
    );
  }

  function casaCardHTML(casa) {
    var tienePagina = !!casa.slug;
    return (
      '<div class="casa-card" data-id="' + casa.id + '">' +
        casaCarruselHTML(casa) +
        '<div class="casa-card-body">' +
          (casa.tipo === 'complejo' ? '<span class="tag">' +
            '<span data-es>' + casa.tag_es + '</span>' +
            '<span data-en>' + casa.tag_en + '</span>' +
          '</span>' : '') +
          casaStatsHTML(casa) +
          '<h3>' + casa.nombre + '</h3>' +
          '<p class="meta">' +
            '<span data-es>' + casa.meta_es + '</span>' +
            '<span data-en>' + casa.meta_en + '</span>' +
          '</p>' +
          // Ahorro ahora se muestra solo en el banner entre secciones
          // (casa.exAirbnb ? '<p class="ahorro">' +
          //   '<span data-es>Reservando directo ahorras hasta 10% vs. Airbnb</span>' +
          //   '<span data-en>Book direct and save up to 10% vs. Airbnb</span>' +
          // '</p>' : '') +
          '' +
          '<div class="row-actions">' +
            '<a class="link-wa" href="' + buildWhatsAppLink(mensajeCasa(casa, ultimaBusqueda.checkin, ultimaBusqueda.checkout)) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' +
              '<span data-es>Reservar por WhatsApp</span><span data-en>Book via WhatsApp</span>' +
            '</a>' +
            (tienePagina ? '<a class="link-vermas" href="/casas/' + casa.slug + '" onclick="event.stopPropagation()">' +
              '<span data-es>Ver más</span><span data-en>See more</span>' +
            '</a>' : '') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Si la casa ya tiene página de detalle (casa.slug), el click en la card
  // navega ahí. Si no, se abre el modal de siempre (comportamiento sin cambios
  // para las casas nuevas hasta que tengan su propia página).
  function wireCasaCards(container) {
    container.querySelectorAll('.casa-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.row-actions')) return;
        var casa = casasCache.find(function (c) { return c.id === card.getAttribute('data-id'); });
        if (!casa) return;
        if (casa.slug) {
          window.location.href = '/casas/' + casa.slug;
        } else {
          abrirModal(casa);
        }
      });
    });
  }

  function renderCasasGrid(container, casas) {
    container.innerHTML = '<div class="casas-grid">' + casas.map(casaCardHTML).join('') + '</div>';
    wireCasaCards(container);
    applyLangSafe();
  }


  function bannerConfianzaHTML() {
    return (
      '<div class="banner-confianza">' +
        '<div class="banner-confianza-titulo">' +
          '<span data-es>Reservando directo ahorras hasta 10% vs. Airbnb</span>' +
          '<span data-en>Book direct and save up to 10% vs. Airbnb</span>' +
        '</div>' +
        '<div class="banner-confianza-subtitulo">' +
          '<span data-es>Sin comisión de plataforma, mismo dueño, misma casa.</span>' +
          '<span data-en>No platform fees, same owner, same home.</span>' +
        '</div>' +
      '</div>'
    );
  }

  // ===== Carrusel Rotativo =====
  var carouselState = {
    allCasas: [],
    currentIndex: 0,
    isPaused: false,
    rotationInterval: null,
    cardsPerPage: 3
  };

  function initCarousel(casas) {
    carouselState.allCasas = casas;
    carouselState.currentIndex = 0;
    renderCarouselCasas();
    carouselState.rotationInterval = setInterval(rotateCarousel, 7000);
  }

  function getNextCarouselCasas() {
    var casas = [];
    for (var i = 0; i < carouselState.cardsPerPage; i++) {
      casas.push(carouselState.allCasas[(carouselState.currentIndex + i) % carouselState.allCasas.length]);
    }
    carouselState.currentIndex = (carouselState.currentIndex + carouselState.cardsPerPage) % carouselState.allCasas.length;
    return casas;
  }

  function renderCarouselCasas() {
    var casas = getNextCarouselCasas();
    var container = document.getElementById('casas-grid-home');
    if (!container) return;

    container.classList.add('carousel-fade-out');
    setTimeout(function() {
      container.innerHTML = '<div class="casas-grid">' + casas.map(casaCardHTML).join('') + '</div>';
      container.classList.remove('carousel-fade-out');
      wireCasaCards(container);
      applyLangSafe();
      attachCarouselInteractions(container);
    }, 300);
  }

  function rotateCarousel() {
    if (!carouselState.isPaused) {
      renderCarouselCasas();
    }
  }

  function pauseCarousel(container) {
    carouselState.isPaused = true;
    clearInterval(carouselState.rotationInterval);
    container.classList.add('carousel-paused');
  }

  function resumeCarousel(container) {
    carouselState.isPaused = false;
    container.classList.remove('carousel-paused');
    carouselState.rotationInterval = setInterval(rotateCarousel, 7000);
  }

  function attachCarouselInteractions(container) {
    container.querySelectorAll('.casa-card').forEach(function(card) {
      card.addEventListener('mouseenter', function() { pauseCarousel(container); });
      card.addEventListener('mouseleave', function() { resumeCarousel(container); });
      card.addEventListener('touchstart', function() { pauseCarousel(container); });
      card.addEventListener('touchend', function() { resumeCarousel(container); });
    });
  }


    // Vista del catálogo completo: agrupa por sección de viaje (parejas/grupos/lujo),
  // en el orden fijo de SECCIONES; una sección sin casas simplemente no se imprime.
  function renderCasasPorSeccion(container, casas) {
    var html = SECCIONES.map(function (sec, secIdx) {
      var casasSeccion = casas.filter(function (c) { return c.seccion === sec.id; });
      if (!casasSeccion.length) return '';
      var htmlSeccion = (
        '<div class="catalogo-seccion">' +
          '<div class="catalogo-seccion-head">' +
            '<h2><span data-es>' + sec.es + '</span><span data-en>' + sec.en + '</span></h2>' +
          '</div>' +
          '<div class="casas-grid">' + casasSeccion.map(casaCardHTML).join('') + '</div>' +
        '</div>'
      );
      // Insertar banner después de la primera sección (parejas)
      if (secIdx === 0) {
        htmlSeccion += bannerConfianzaHTML();
      }
      return htmlSeccion;
    }).join('');
    container.innerHTML = html;
    wireCasaCards(container);
    applyLangSafe();
  }

  // ===== Modal =====
  var modalState = { casa: null, idx: 0 };

  function abrirModal(casa) {
    var overlay = document.getElementById('modal-casa');
    if (!overlay) return;
    modalState.casa = casa;
    modalState.idx = 0;

    overlay.querySelector('.modal-nombre').textContent = casa.nombre;
    overlay.querySelector('.modal-meta-es').textContent = casa.meta_es;
    overlay.querySelector('.modal-meta-en').textContent = casa.meta_en;
    overlay.querySelector('.modal-desc-es').textContent = casa.descripcion_es;
    overlay.querySelector('.modal-desc-en').textContent = casa.descripcion_en;
    overlay.querySelector('.modal-cap-es').textContent = casa.capacidad_es;
    overlay.querySelector('.modal-cap-en').textContent = casa.capacidad_en;

    var unidadesEl = overlay.querySelector('.modal-unidades');
    if (unidadesEl) {
      if (casa.unidades && casa.unidades.length) {
        unidadesEl.innerHTML =
          '<p class="modal-unidades-label"><span data-es>Elige tu unidad, o renta el complejo completo:</span><span data-en>Choose your unit, or rent the full complex:</span></p>' +
          casa.unidades.map(function (u) {
            return (
              '<div class="modal-unidad">' +
                '<h4>' + u.nombre + '</h4>' +
                '<p><span data-es>' + u.capacidad_es + '</span><span data-en>' + u.capacidad_en + '</span></p>' +
              '</div>'
            );
          }).join('');
        unidadesEl.classList.remove('oculto');
      } else {
        unidadesEl.innerHTML = '';
        unidadesEl.classList.add('oculto');
      }
    }

    var slideshow = overlay.querySelector('.modal-slideshow');
    slideshow.querySelectorAll('img').forEach(function (im) { im.remove(); });
    casa.fotos.forEach(function (src, i) {
      var img = document.createElement('img');
      // Para modal: 1000px de ancho (grande pero no enorme)
      img.src = optimizeImageUrl(src, 1000);
      img.loading = 'lazy';
      img.alt = casa.nombre + ' foto ' + (i + 1);
      if (i === 0) img.classList.add('active');
      slideshow.insertBefore(img, slideshow.querySelector('.slideshow-arrow.prev'));
    });

    var waLink = overlay.querySelector('.modal-wa');
    waLink.href = buildWhatsAppLink(mensajeCasa(casa, ultimaBusqueda.checkin, ultimaBusqueda.checkout));

    overlay.classList.add('abierto');
    applyLangSafe();
  }

  function cerrarModal() {
    var overlay = document.getElementById('modal-casa');
    if (overlay) overlay.classList.remove('abierto');
  }

  function moverSlide(delta) {
    var overlay = document.getElementById('modal-casa');
    var imgs = overlay.querySelectorAll('.modal-slideshow img');
    if (!imgs.length) return;
    imgs[modalState.idx].classList.remove('active');
    modalState.idx = (modalState.idx + delta + imgs.length) % imgs.length;
    imgs[modalState.idx].classList.add('active');
  }

  // ===== Página de detalle de casa (/casas/<slug>/) =====
  function setMeta(name, content, isProperty) {
    var attr = isProperty ? 'property' : 'name';
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (el && content) el.setAttribute('content', content);
  }

  // Misma plantilla física para todas las casas: toma el slug del último
  // segmento de la URL, busca esa casa en casas.json y pinta todo desde ahí.
  // Si la casa no existe (o no tiene página todavía) muestra un mensaje y
  // regresa al catálogo, en vez de dejar la página en blanco.
  function renderDetalleCasa(container) {
    var partes = window.location.pathname.split('/').filter(Boolean);
    var slug = partes[partes.length - 1];

    cargarCasas().then(function (casas) {
      var casa = casas.find(function (c) { return c.slug === slug; });

      if (!casa) {
        container.innerHTML =
          '<div class="detalle-cargando">' +
            '<p><span data-es>No encontramos esta casa.</span><span data-en>We couldn\'t find this home.</span></p>' +
            '<p><a href="/casas" style="text-decoration:underline"><span data-es>Ver todas las casas →</span><span data-en>Browse all homes →</span></a></p>' +
          '</div>';
        applyLangSafe();
        return;
      }

      var waLink = buildWhatsAppLink(mensajeCasa(casa, null, null));
      var tituloPagina = casa.nombre + ' — Hidden Gems Puerto Escondido';

      document.title = tituloPagina;
      setMeta('description', lang() === 'es' ? casa.meta_es : casa.meta_en);
      setMeta('og:title', tituloPagina, true);
      setMeta('og:description', lang() === 'es' ? casa.meta_es : casa.meta_en, true);
      setMeta('og:image', window.location.origin + casa.fotos[0], true);

      var specs = [];
      if (casa.huespedes != null) {
        specs.push(
          '<span class="stat"><span aria-hidden="true">👥</span> ' +
            '<span data-es>' + casa.huespedes + ' personas</span>' +
            '<span data-en>' + casa.huespedes + ' guests</span>' +
          '</span>'
        );
      }
      if (casa.habitaciones != null) {
        specs.push(
          '<span class="stat"><span aria-hidden="true">🛏</span> ' +
            '<span data-es>' + casa.habitaciones + ' habitaciones</span>' +
            '<span data-en>' + casa.habitaciones + ' bedrooms</span>' +
          '</span>'
        );
      }
      if (casa.banos != null) {
        specs.push(
          '<span class="stat"><span aria-hidden="true">🚿</span> ' +
            '<span data-es>' + casa.banos + ' baños</span>' +
            '<span data-en>' + casa.banos + ' bathrooms</span>' +
          '</span>'
        );
      }

      var amenidadesHTML = '';
      if (casa.amenidades_es && casa.amenidades_es.length) {
        amenidadesHTML =
          '<div class="detalle-amenidades">' +
            '<h2><span data-es>Amenidades</span><span data-en>Amenities</span></h2>' +
            '<ul>' +
              casa.amenidades_es.map(function (a, i) {
                var en = (casa.amenidades_en && casa.amenidades_en[i]) || a;
                return '<li><span data-es>' + a + '</span><span data-en>' + en + '</span></li>';
              }).join('') +
            '</ul>' +
          '</div>';
      }

      // Bloque discreto "Bueno saber" (reglas de la casa, seguridad, etc.) --
      // opcional, solo se imprime si la casa trae buenoSaber_es/en.
      var buenoSaberHTML = '';
      if (casa.buenoSaber_es && casa.buenoSaber_es.length) {
        buenoSaberHTML =
          '<div class="detalle-bueno-saber">' +
            '<h2><span data-es>Bueno saber</span><span data-en>Good to know</span></h2>' +
            '<ul>' +
              casa.buenoSaber_es.map(function (a, i) {
                var en = (casa.buenoSaber_en && casa.buenoSaber_en[i]) || a;
                return '<li><span data-es>' + a + '</span><span data-en>' + en + '</span></li>';
              }).join('') +
            '</ul>' +
          '</div>';
      }

      // Galería modo portafolio: todas las fotos en columna, optimizadas con Netlify Image CDN
      // Lazy loading en cada foto para carga progresiva.
      var galeriaHTML =
        '<div class="detalle-galeria-titulo"><span data-es>Fotos</span><span data-en>Photos</span></div>' +
        '<div class="detalle-galeria">' +
          casa.fotos.map(function (src, i) {
            // Para galería: 1200px de ancho (pantalla completa)
            var optimizedSrc = optimizeImageUrl(src, 1200);
            return '<img src="' + optimizedSrc + '" loading="lazy" alt="' + casa.nombre + ' foto ' + (i + 1) + '">';
          }).join('') +
        '</div>';

      container.innerHTML =
        '<div class="detalle-header">' +
          (casa.zona_es ? '<p class="detalle-zona"><span data-es>' + casa.zona_es + '</span><span data-en>' + casa.zona_en + '</span></p>' : '') +
          '<h1>' + casa.nombre + '</h1>' +
          '<div class="detalle-specs">' + specs.join('') + '</div>' +
          (casa.notaCapacidad_es ? '<p class="detalle-nota-capacidad"><span data-es>' + casa.notaCapacidad_es + '</span><span data-en>' + casa.notaCapacidad_en + '</span></p>' : '') +
          '<a class="btn btn-primary detalle-wa" href="' + waLink + '" target="_blank" rel="noopener">' +
            '💬 <span data-es>Reservar por WhatsApp</span><span data-en>Book via WhatsApp</span>' +
          '</a>' +
        '</div>' +
        '<div class="detalle-descripcion"><p>' +
          '<span data-es>' + casa.descripcion_es + '</span><span data-en>' + casa.descripcion_en + '</span>' +
        '</p></div>' +
        amenidadesHTML +
        buenoSaberHTML +
        galeriaHTML;

      // Botón fijo de WhatsApp (visible siempre al hacer scroll en móvil, vía CSS)
      var stickyBtn = document.getElementById('wa-sticky');
      if (stickyBtn) {
        stickyBtn.href = waLink;
        stickyBtn.classList.remove('oculto');
      }

      applyLangSafe();
    });
  }

  // ===== Buscador de fechas =====
  function renderMensajeBuscador(el, tipo, texto) {
    el.className = 'buscador-msg' + (tipo ? ' ' + tipo : '');
    el.innerHTML = texto;
  }

  function wireBuscador(formEl, gridEl, msgEl) {
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var checkin = formEl.querySelector('[name="checkin"]').value;
      var checkout = formEl.querySelector('[name="checkout"]').value;
      if (!checkin || !checkout || checkout <= checkin) {
        renderMensajeBuscador(msgEl, 'error', lang() === 'es'
          ? 'Revisa las fechas: el check-out debe ser después del check-in.'
          : 'Check your dates: check-out must be after check-in.');
        return;
      }
      ultimaBusqueda = { checkin: checkin, checkout: checkout };
      renderMensajeBuscador(msgEl, '', lang() === 'es' ? 'Buscando…' : 'Searching…');

      cargarCasas().then(function (casas) {
        return window.Disponibilidad.getCasasDisponibles(casas, checkin, checkout);
      }).then(function (resultado) {
        if (!resultado.ok) {
          renderCasasGrid(gridEl, casasCache);
          renderMensajeBuscador(msgEl, 'error', lang() === 'es'
            ? 'No pudimos cargar la disponibilidad en vivo — aquí tienes el catálogo completo. <a href="' + buildWhatsAppLink(lang() === 'es' ? 'Hola Patty, busco disponibilidad del ' + formatFecha(checkin) + ' al ' + formatFecha(checkout) : 'Hi Patty, I\'m checking availability from ' + formatFecha(checkin) + ' to ' + formatFecha(checkout)) + '" target="_blank" rel="noopener" style="text-decoration:underline">Escríbeme por WhatsApp</a> y te confirmo al instante.'
            : 'We couldn\'t load live availability — here\'s the full catalog. <a href="' + buildWhatsAppLink('Hi Patty, checking availability from ' + formatFecha(checkin) + ' to ' + formatFecha(checkout)) + '" target="_blank" rel="noopener" style="text-decoration:underline">Message me on WhatsApp</a> and I\'ll confirm right away.');
          return;
        }

        renderCasasGrid(gridEl, resultado.disponibles);

        var mensajeSinOpciones = lang() === 'es'
          ? 'Hola Patty, busco disponibilidad del ' + formatFecha(checkin) + ' al ' + formatFecha(checkout)
          : "Hi Patty, I'm checking availability from " + formatFecha(checkin) + ' to ' + formatFecha(checkout);

        if (resultado.disponibles.length === 0) {
          renderMensajeBuscador(msgEl, 'escasez', (lang() === 'es'
            ? 'No hay casas libres para esas fechas. <a href="' + buildWhatsAppLink(mensajeSinOpciones) + '" target="_blank" rel="noopener" style="text-decoration:underline">Escríbeme y te consigo opciones</a>.'
            : 'No homes are free for those dates. <a href="' + buildWhatsAppLink(mensajeSinOpciones) + '" target="_blank" rel="noopener" style="text-decoration:underline">Message me and I\'ll find options</a>.'));
        } else if (resultado.disponibles.length <= 3) {
          renderMensajeBuscador(msgEl, 'escasez', lang() === 'es'
            ? 'Solo quedan ' + resultado.disponibles.length + ' casas para tus fechas.'
            : 'Only ' + resultado.disponibles.length + ' homes left for your dates.');
        } else {
          renderMensajeBuscador(msgEl, '', lang() === 'es'
            ? resultado.disponibles.length + ' casas disponibles para tus fechas.'
            : resultado.disponibles.length + ' homes available for your dates.');
        }
      });
    });
  }

  // ===== Testimonios =====
  function testimonioCardHTML(t) {
    var actividad = t.actividad ? t.actividad.charAt(0).toUpperCase() + t.actividad.slice(1) : '';
    return (
      '<div class=”testimonio-card”>' +
        (t.foto ? '<img class=”testimonio-foto” src=”' + t.foto + '” alt=”' + t.nombre + '” loading=”lazy”>' : '') +
        (t.placeholder ? '<span class=”placeholder-flag” data-es>Ejemplo — reemplazar con testimonio real</span><span class=”placeholder-flag” data-en>Example — replace with a real testimonial</span>' : '') +
        '<p class=”texto” data-es>”' + t.texto_es + '”</p>' +
        '<p class=”texto” data-en>”' + t.texto_en + '”</p>' +
        '<p class=”autor”>' + t.nombre + ' · ' + t.pais + ' · ' + actividad + '</p>' +
      '</div>'
    );
  }

  function renderTestimonios(container, testimonios) {
    container.innerHTML = testimonios.map(testimonioCardHTML).join('');
    applyLangSafe();
  }

  function applyLangSafe() {
    if (window.getLang) {
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: window.getLang() } }));
      var l = window.getLang();
      document.querySelectorAll('[data-es]').forEach(function (el) { el.style.display = l === 'es' ? '' : 'none'; });
      document.querySelectorAll('[data-en]').forEach(function (el) { el.style.display = l === 'en' ? '' : 'none'; });
    }
  }

  // Carrusel de fotos deslizante automático
  var photoCarouselState = {
    allPhotos: [],
    allCasas: [],
    scrollInterval: null,
    isPaused: false,
    carouselElement: null
  };

  function initPhotoCarousel(casas) {
    photoCarouselState.allCasas = casas;

    // Recopilar todas las fotos con información de la casa
    photoCarouselState.allPhotos = [];
    casas.forEach(function(casa) {
      if (casa.fotos && casa.fotos.length > 0) {
        casa.fotos.forEach(function(foto) {
          photoCarouselState.allPhotos.push({
            src: foto,
            casaId: casa.id,
            casaSlug: casa.slug,
            casaNombre: casa.nombre
          });
        });
      }
    });

    renderPhotoCarousel();
  }

  function initHeroCarousel() {
    fetch('/data/hero-puerto-escondido.json')
      .then(function(res) { return res.json(); })
      .then(function(heroFotos) {
        photoCarouselState.allPhotos = heroFotos.map(function(item) {
          return {
            src: item.foto,
            casaId: item.casaId,
            casaSlug: item.casaSlug,
            casaNombre: item.casaNombre
          };
        });
        renderPhotoCarousel();
      })
      .catch(function(err) {
        console.error('Error cargando hero carrusel:', err);
        initPhotoCarousel(photoCarouselState.allCasas);
      });
  }

  function renderPhotoCarousel() {
    var container = document.getElementById('casas-grid-home');
    if (!container) return;

    var html = '<div class="casas-photo-grid" id="photo-carousel">' +
      photoCarouselState.allPhotos.map(function(photo) {
        var clickUrl = photo.casaSlug ? '/casas/' + photo.casaSlug : '#';
        return '<div class="casa-photo-card" onclick="' + (photo.casaSlug ? 'window.location.href=\'' + clickUrl + '\'' : '') + '; return false;" style="cursor:' + (photo.casaSlug ? 'pointer' : 'default') + '">' +
          '<img src="' + photo.src + '" alt="' + photo.casaNombre + '" style="width:100%;height:100%;object-fit:cover;display:block;">' +
        '</div>';
      }).join('') +
    '</div>';

    container.innerHTML = html;
    photoCarouselState.carouselElement = document.getElementById('photo-carousel');
    applyLangSafe();

    // Iniciar scroll automático
    startAutoScroll();

    // Pausar en hover/touch
    if (photoCarouselState.carouselElement) {
      photoCarouselState.carouselElement.addEventListener('mouseenter', pauseAutoScroll);
      photoCarouselState.carouselElement.addEventListener('mouseleave', resumeAutoScroll);
      photoCarouselState.carouselElement.addEventListener('touchstart', pauseAutoScroll);
      photoCarouselState.carouselElement.addEventListener('touchend', resumeAutoScroll);
    }
  }

  function startAutoScroll() {
    if (photoCarouselState.scrollInterval) clearInterval(photoCarouselState.scrollInterval);

    photoCarouselState.scrollInterval = setInterval(function() {
      if (!photoCarouselState.isPaused && photoCarouselState.carouselElement) {
        var carousel = photoCarouselState.carouselElement;
        var cardWidth = carousel.querySelector('.casa-photo-card').offsetWidth;
        var gap = 16; // gap en CSS
        carousel.scrollBy({
          left: cardWidth + gap,
          behavior: 'smooth'
        });
      }
    }, 5000);
  }

  function pauseAutoScroll() {
    photoCarouselState.isPaused = true;
  }

  function resumeAutoScroll() {
    photoCarouselState.isPaused = false;
  }

  window.HGP = {
    cargarCasas: cargarCasas,
    cargarTestimonios: cargarTestimonios,
    renderCasasGrid: renderCasasGrid,
    renderCasasPorSeccion: renderCasasPorSeccion,
    renderDetalleCasa: renderDetalleCasa,
    renderPerks: renderPerks,
    initCarousel: initCarousel,
    initPhotoCarousel: initPhotoCarousel,
    initHeroCarousel: initHeroCarousel,
    renderTestimonios: renderTestimonios,
    wireBuscador: wireBuscador,
    abrirModal: abrirModal,
    cerrarModal: cerrarModal,
    moverSlide: moverSlide,
    buildWhatsAppLink: buildWhatsAppLink,
    mensajeCasa: mensajeCasa,
    WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    photoCarouselState: photoCarouselState
  };
})();

  // ===== Extras / Add-ons =====
  function cotizarExtra(tipo) {
    var mensajes = {
      transporte: {
        es: 'Hola Paty! Me interesa el servicio de transporte con groceries — ¿cómo funciona, con parada en el súper o con lista previa?',
        en: 'Hi Paty! I\'m interested in the transportation + groceries service — how does it work, a stop at the store or a pre-arrival list?'
      },
      scooters: {
        es: 'Hola Paty! Me interesa Renta de scooters para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in Scooter Rental for my stay — could you share info?'
      },
      surf: {
        es: 'Hola Paty! Me interesa Clases de surf (recogida en la casa) para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in Surf Lessons (Pickup from home) for my stay — could you share info?'
      },
      chef: {
        es: 'Hola Paty! Me interesa Chef privado — Chicama Dinner Night para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in Private Chef — Chicama Dinner Night for my stay — could you share info?'
      },
      dj: {
        es: 'Hola Paty! Me interesa Puerto DJ Sunset para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in Puerto DJ Sunset for my stay — could you share info?'
      },
      mazunte: {
        es: 'Hola Paty! Me interesa Guía a Mazunte para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in a Mazunte Tour Guide for my stay — could you share info?'
      },
      wellness: {
        es: 'Hola Paty! Me interesa Wellness en casa (yoga / sound healing) para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in Wellness at Home (yoga / sound healing) for my stay — could you share info?'
      },
      masaje: {
        es: 'Hola Paty! Me interesa Masajes en casa para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in In-Home Massage for my stay — could you share info?'
      },
      descuentos: {
        es: 'Hola Paty! Me interesa Descuentos en restaurantes y cafés aliados para mi estancia — ¿me pasas info?',
        en: 'Hi Paty! I\'m interested in Discounts at Partner Restaurants & Cafés for my stay — could you share info?'
      }
    };
    
    var l = lang();
    var mensaje = mensajes[tipo] ? mensajes[tipo][l] : 'Hola Paty!';
    var waLink = 'https://wa.me/528661154305?text=' + encodeURIComponent(mensaje);
    window.open(waLink, '_blank');
  }

  window.HGP.cotizarExtra = cotizarExtra;

  // ===== Extras Bundle (Selección múltiple) =====
  function cotizarExtrasBundle() {
    var checkboxes = document.querySelectorAll('.extra-checkbox:checked');
    var l = lang();
    var selectedItems = [];

    checkboxes.forEach(function(cb) {
      var label = cb.closest('.extra-card');
      var h3 = label.querySelector('h3');
      var langAttr = l === 'es' ? 'data-es' : 'data-en';
      var span = h3.querySelector('[' + langAttr + ']');
      if (span) {
        selectedItems.push(span.textContent.trim());
      } else {
        selectedItems.push(h3.textContent.trim());
      }
    });

    if (selectedItems.length === 0) return;

    var itemList = selectedItems.join(', ');
    var mensaje = l === 'es'
      ? 'Hola Paty! Me interesa agregar a mi estancia: ' + itemList + ' — ¿me pasas info y presupuesto?'
      : 'Hi Paty! I\'d like to add to my stay: ' + itemList + ' — could you share info and pricing?';

    var waLink = 'https://wa.me/528661154305?text=' + encodeURIComponent(mensaje);
    window.open(waLink, '_blank');
  }

  // Habilitar/deshabilitar botón según selección
  function updateExtrasButton() {
    var checkboxes = document.querySelectorAll('.extra-checkbox:checked');
    var btn = document.getElementById('extras-btn');
    if (btn) {
      btn.disabled = checkboxes.length === 0;
    }
  }

  // Configurar listeners para checkboxes (inmediato, no esperar DOMContentLoaded)
  function setupExtrasListeners() {
    var checkboxes = document.querySelectorAll('.extra-checkbox');
    checkboxes.forEach(function(cb) {
      cb.addEventListener('change', updateExtrasButton);
    });
    // Llamar inicial para establecer estado del botón
    updateExtrasButton();
  }

  // Ejecutar si el DOM ya está listo, o esperar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupExtrasListeners);
  } else {
    setupExtrasListeners();
  }

  window.HGP.cotizarExtrasBundle = cotizarExtrasBundle;
