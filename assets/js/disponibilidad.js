/* Disponibilidad en vivo — lee el CSV publicado del Google Sheets de reservas.
   Columnas esperadas: casa,inicio,fin (fechas AAAA-MM-DD), una fila por reservación confirmada. */
(function () {
  // [PENDIENTE: pegar aquí la URL del CSV publicado — Archivo > Compartir > Publicar en la web > CSV]
  var CSV_URL = '';

  var cachePromise = null;

  function parseCSV(texto) {
    var lineas = texto.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; });
    var filas = lineas.slice(1); // saltar encabezado
    return filas.map(function (linea) {
      var partes = linea.split(',').map(function (p) { return p.trim().replace(/^"|"$/g, ''); });
      return { casa: partes[0], inicio: partes[1], fin: partes[2] };
    }).filter(function (r) { return r.casa && r.inicio && r.fin; });
  }

  function fetchReservas() {
    if (cachePromise) return cachePromise;
    if (!CSV_URL) {
      cachePromise = Promise.reject(new Error('CSV_URL no configurada'));
      return cachePromise;
    }
    cachePromise = fetch(CSV_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo descargar el CSV');
        return res.text();
      })
      .then(parseCSV)
      .catch(function (err) {
        cachePromise = null; // permitir reintentar en la siguiente búsqueda
        throw err;
      });
    return cachePromise;
  }

  function seTraslapan(inicioBusqueda, finBusqueda, inicioReserva, finReserva) {
    return inicioBusqueda < finReserva && finBusqueda > inicioReserva;
  }

  function casaEstaLibre(nombreCasa, checkin, checkout, reservas) {
    return !reservas.some(function (r) {
      return r.casa === nombreCasa && seTraslapan(checkin, checkout, r.inicio, r.fin);
    });
  }

  // Devuelve { ok:true, disponibles:[...casas], ocupadas:[...casas] } o { ok:false } si el CSV no está disponible
  function getCasasDisponibles(casasList, checkin, checkout) {
    return fetchReservas().then(function (reservas) {
      var disponibles = [];
      var ocupadas = [];
      casasList.forEach(function (casa) {
        if (casaEstaLibre(casa.nombre, checkin, checkout, reservas)) {
          disponibles.push(casa);
        } else {
          ocupadas.push(casa);
        }
      });
      return { ok: true, disponibles: disponibles, ocupadas: ocupadas };
    }).catch(function () {
      return { ok: false, disponibles: casasList, ocupadas: [] };
    });
  }

  window.Disponibilidad = {
    getCasasDisponibles: getCasasDisponibles,
    seTraslapan: seTraslapan
  };
})();
