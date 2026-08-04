/* Disponibilidad en vivo — lee el CSV del Google Sheets de reservas.
   Columnas: casa_id, fecha_inicio, fecha_fin, estado, notas
   Solo procesa filas con estado "reservado" o "bloqueado" — ignora "disponible" */
(function () {
  var CSV_URL = 'https://docs.google.com/spreadsheets/d/1e1Ie9WQFKYhZDUc04ZDu9oYzdfSO6Sj2tgtTrsFzeEY/export?format=csv&gid=0';
  var cachePromise = null;

  function parseCSV(texto) {
    var lineas = texto.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; });
    var encabezados = lineas[0].split(',').map(function (h) { return h.trim(); });
    var filas = lineas.slice(1);

    return filas.map(function (linea) {
      var partes = linea.split(',').map(function (p) { return p.trim().replace(/^"|"$/g, ''); });
      var fila = {};
      encabezados.forEach(function (h, i) {
        fila[h] = partes[i] || '';
      });
      return fila;
    }).filter(function (r) {
      return r.casa_id && r.fecha_inicio && r.fecha_fin && (r.estado === 'reservado' || r.estado === 'bloqueado');
    });
  }

  function fetchReservas() {
    if (cachePromise) return cachePromise;
    cachePromise = fetch(CSV_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo descargar el CSV');
        return res.text();
      })
      .then(parseCSV)
      .catch(function (err) {
        cachePromise = null;
        console.error('Error cargando disponibilidad:', err);
        throw err;
      });
    return cachePromise;
  }

  function seTraslapan(d1_inicio, d1_fin, d2_inicio, d2_fin) {
    return d1_inicio <= d2_fin && d1_fin >= d2_inicio;
  }

  function casaEstaLibre(casaId, checkin, checkout, bloqueados) {
    return !bloqueados.some(function (b) {
      return b.casa_id === casaId && seTraslapan(checkin, checkout, b.fecha_inicio, b.fecha_fin);
    });
  }

  function calcularVentanasDisponibles(casaId, bloqueados, hasta) {
    var hoy = new Date();
    var hoyStr = hoy.getFullYear() + '-' +
                 String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
                 String(hoy.getDate()).padStart(2, '0');

    // Filtrar bloqueados de esta casa
    var bloqueosCasa = bloqueados
      .filter(function (b) { return b.casa_id === casaId; })
      .sort(function (a, b) { return a.fecha_inicio.localeCompare(b.fecha_inicio); });

    var ventanas = [];

    if (bloqueosCasa.length === 0) {
      ventanas.push({ inicio: hoyStr, fin: hasta });
      return ventanas;
    }

    var fechaActual = hoyStr;

    bloqueosCasa.forEach(function (bloqueo) {
      if (fechaActual < bloqueo.fecha_inicio) {
        // Crear ventana desde fechaActual hasta el día anterior al bloqueo
        var diaAnterior = new Date(bloqueo.fecha_inicio + 'T00:00:00');
        diaAnterior.setDate(diaAnterior.getDate() - 1);
        var diaAnteriorStr = diaAnterior.getFullYear() + '-' +
                             String(diaAnterior.getMonth() + 1).padStart(2, '0') + '-' +
                             String(diaAnterior.getDate()).padStart(2, '0');
        ventanas.push({ inicio: fechaActual, fin: diaAnteriorStr });
      }
      // Siguiente gap comienza el día después del fin del bloqueo
      var diaSiguiente = new Date(bloqueo.fecha_fin + 'T00:00:00');
      diaSiguiente.setDate(diaSiguiente.getDate() + 1);
      fechaActual = diaSiguiente.getFullYear() + '-' +
                    String(diaSiguiente.getMonth() + 1).padStart(2, '0') + '-' +
                    String(diaSiguiente.getDate()).padStart(2, '0');
    });

    // Última ventana: desde el fin del último bloqueo hasta 'hasta'
    if (fechaActual <= hasta) {
      ventanas.push({ inicio: fechaActual, fin: hasta });
    }

    return ventanas;
  }

  function getCasasDisponibles(casasList, checkin, checkout, minPersonas) {
    return fetchReservas().then(function (bloqueados) {
      var disponibles = [];
      var ocupadas = [];
      var insuficientes = [];
      casasList.forEach(function (casa) {
        // Filtrar por capacidad si se especifica minPersonas
        if (minPersonas && casa.huespedes && casa.huespedes < minPersonas) {
          insuficientes.push(casa);
          return;
        }
        if (casaEstaLibre(casa.id, checkin, checkout, bloqueados)) {
          disponibles.push(casa);
        } else {
          ocupadas.push(casa);
        }
      });
      return {
        ok: true,
        disponibles: disponibles,
        ocupadas: ocupadas,
        insuficientes: insuficientes
      };
    }).catch(function () {
      return { ok: false, disponibles: casasList, ocupadas: [], insuficientes: [] };
    });
  }

  function getVentanasDisponibles(casaId) {
    return fetchReservas().then(function (bloqueados) {
      var hasta = '2027-05-31';
      return calcularVentanasDisponibles(casaId, bloqueados, hasta);
    }).catch(function (err) {
      console.error('Error calculando ventanas:', err);
      return [];
    });
  }

  window.Disponibilidad = {
    getCasasDisponibles: getCasasDisponibles,
    getVentanasDisponibles: getVentanasDisponibles,
    seTraslapan: seTraslapan,
    fetchReservas: fetchReservas
  };
})();
