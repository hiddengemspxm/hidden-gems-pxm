/* Lógica compartida: catálogo de casas, modal, buscador de fechas, testimonios, links de WhatsApp */
(function () {
  var WHATSAPP_NUMBER = '528661154305';

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
    var msg = l === 'es'
      ? ('Hola Paty! Me interesa ' + casa.nombre + ' — ¿me compartes disponibilidad y tarifa?')
      : ("Hi Paty! I'm interested in " + casa.nombre + ' — could you share availability and rates?');
    if (checkin && checkout) {
      msg += l === 'es'
        ? (' Fechas: ' + formatFecha(checkin) + ' al ' + formatFecha(checkout) + '.')
        : (' Dates: ' + formatFecha(checkin) + ' to ' + formatFecha(checkout) + '.');
    }
    return msg;
  }

  function cargarCasas() {
    if (casasCache) return Promise.resolve(casasCache);
    return fetch('data/casas.json').then(function (res) { return res.json(); }).then(function (data) {
      casasCache = data.filter(function (c) { return !c.draft; });
      return casasCache;
    });
  }

  function cargarTestimonios() {
    return fetch('data/testimonios.json').then(function (res) { return res.json(); });
  }

  // ===== Secciones del catálogo =====
  var SECCIONES = [
    { id: 'parejas', es: 'Parejas y amigos en La Punta', en: 'Couples & friends in La Punta' },
    { id: 'grupos', es: 'Grupos y celebraciones', en: 'Groups & celebrations' },
    { id: 'lujo', es: 'Lujo frente al mar', en: 'Beachfront luxury' }
  ];

  // ===== Tarjetas de casas =====
  function casaCardHTML(casa) {
    return (
      '<div class="casa-card" data-id="' + casa.id + '">' +
        '<img src="' + casa.fotos[0] + '" loading="lazy" alt="' + casa.nombre + '">' +
        '<div class="casa-card-body">' +
          '<span class="tag">' +
            '<span data-es>' + casa.tag_es + '</span>' +
            '<span data-en>' + casa.tag_en + '</span>' +
          '</span>' +
          '<h3>' + casa.nombre + '</h3>' +
          '<p class="meta">' +
            '<span data-es>' + casa.meta_es + '</span>' +
            '<span data-en>' + casa.meta_en + '</span>' +
          '</p>' +
          (casa.exAirbnb ? '<p class="ahorro">' +
            '<span data-es>Reservando directo ahorras hasta 10% vs. Airbnb</span>' +
            '<span data-en>Book direct and save up to 10% vs. Airbnb</span>' +
          '</p>' : '') +
          '<div class="row-actions">' +
            '<a class="link-wa" href="' + buildWhatsAppLink(mensajeCasa(casa, ultimaBusqueda.checkin, ultimaBusqueda.checkout)) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' +
              '<span data-es>Reservar por WhatsApp</span><span data-en>Book via WhatsApp</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function wireCasaCards(container) {
    container.querySelectorAll('.casa-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.row-actions')) return;
        var casa = casasCache.find(function (c) { return c.id === card.getAttribute('data-id'); });
        if (casa) abrirModal(casa);
      });
    });
  }

  function renderCasasGrid(container, casas) {
    container.innerHTML = '<div class="casas-grid">' + casas.map(casaCardHTML).join('') + '</div>';
    wireCasaCards(container);
    applyLangSafe();
  }

  // Vista del catálogo completo: agrupa por sección de viaje (parejas/grupos/lujo),
  // en el orden fijo de SECCIONES; una sección sin casas simplemente no se imprime.
  function renderCasasPorSeccion(container, casas) {
    var html = SECCIONES.map(function (sec) {
      var casasSeccion = casas.filter(function (c) { return c.seccion === sec.id; });
      if (!casasSeccion.length) return '';
      return (
        '<div class="catalogo-seccion">' +
          '<div class="catalogo-seccion-head">' +
            '<h2><span data-es>' + sec.es + '</span><span data-en>' + sec.en + '</span></h2>' +
          '</div>' +
          '<div class="casas-grid">' + casasSeccion.map(casaCardHTML).join('') + '</div>' +
        '</div>'
      );
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

    var slideshow = overlay.querySelector('.modal-slideshow');
    slideshow.querySelectorAll('img').forEach(function (im) { im.remove(); });
    casa.fotos.forEach(function (src, i) {
      var img = document.createElement('img');
      img.src = src;
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
    return (
      '<div class="testimonio-card">' +
        (t.placeholder ? '<span class="placeholder-flag" data-es>Ejemplo — reemplazar con testimonio real</span><span class="placeholder-flag" data-en>Example — replace with a real testimonial</span>' : '') +
        '<p class="texto" data-es>“' + t.texto_es + '”</p>' +
        '<p class="texto" data-en>“' + t.texto_en + '”</p>' +
        '<p class="autor">' + t.nombre + ' · ' + t.pais + ' · ' + t.casa + '</p>' +
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

  window.HGP = {
    cargarCasas: cargarCasas,
    cargarTestimonios: cargarTestimonios,
    renderCasasGrid: renderCasasGrid,
    renderCasasPorSeccion: renderCasasPorSeccion,
    renderTestimonios: renderTestimonios,
    wireBuscador: wireBuscador,
    abrirModal: abrirModal,
    cerrarModal: cerrarModal,
    moverSlide: moverSlide,
    buildWhatsAppLink: buildWhatsAppLink,
    mensajeCasa: mensajeCasa,
    WHATSAPP_NUMBER: WHATSAPP_NUMBER
  };
})();
