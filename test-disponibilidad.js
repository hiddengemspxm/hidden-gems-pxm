#!/usr/bin/env node
/**
 * Script de prueba para verificar disponibilidad
 * Uso: node test-disponibilidad.js
 */

const https = require('https');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1e1Ie9WQFKYhZDUc04ZDu9oYzdfSO6Sj2tgtTrsFzeEY/export?format=csv&gid=0';

function fetchCSV() {
  return new Promise((resolve, reject) => {
    https.get(CSV_URL, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim().length > 0);
  const encabezados = lineas[0].split(',').map(h => h.trim());
  const filas = lineas.slice(1);

  return filas.map(linea => {
    const partes = linea.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    const fila = {};
    encabezados.forEach((h, i) => {
      fila[h] = partes[i] || '';
    });
    return fila;
  }).filter(r => {
    return r.casa_id && r.fecha_inicio && r.fecha_fin &&
           (r.estado === 'reservado' || r.estado === 'bloqueado');
  });
}

function calcularVentanasDisponibles(casaId, bloqueados, hasta) {
  const hoy = new Date();
  const hoyStr = hoy.getFullYear() + '-' +
                 String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
                 String(hoy.getDate()).padStart(2, '0');

  const bloqueosCasa = bloqueados
    .filter(b => b.casa_id === casaId)
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

  const ventanas = [];

  if (bloqueosCasa.length === 0) {
    ventanas.push({ inicio: hoyStr, fin: hasta });
    return ventanas;
  }

  let fechaActual = hoyStr;

  bloqueosCasa.forEach((bloqueo, idx) => {
    // Si hay gap antes de este bloqueo
    if (fechaActual < bloqueo.fecha_inicio) {
      // El día anterior al inicio del bloqueo
      const diaAnterior = new Date(bloqueo.fecha_inicio + 'T00:00:00');
      diaAnterior.setDate(diaAnterior.getDate() - 1);
      const diaAnteriorStr = diaAnterior.getFullYear() + '-' +
                             String(diaAnterior.getMonth() + 1).padStart(2, '0') + '-' +
                             String(diaAnterior.getDate()).padStart(2, '0');
      ventanas.push({ inicio: fechaActual, fin: diaAnteriorStr });
    }
    // Siguiente gap comienza el día después del fin del bloqueo
    const diaSiguiente = new Date(bloqueo.fecha_fin + 'T00:00:00');
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

async function main() {
  try {
    console.log('🔄 Descargando CSV...\n');
    const csv = await fetchCSV();
    const bloqueados = parseCSV(csv);

    console.log(`✅ Se cargaron ${bloqueados.length} registros de bloqueo (reservado/bloqueado)\n`);

    // Verificar las 3 casas de prueba
    const casasTest = ['palacio', 'amara', 'alegria'];
    const hasta = '2027-05-31';

    casasTest.forEach(casaId => {
      const bloqueadosCasa = bloqueados.filter(b => b.casa_id === casaId);
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📍 ${casaId.toUpperCase()}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Registros bloqueados: ${bloqueadosCasa.length}\n`);

      // Mostrar primeros 3 y últimos 3 bloqueados
      console.log('Primeros 3 bloques:');
      bloqueadosCasa.slice(0, 3).forEach(b => {
        console.log(`  ${b.fecha_inicio} → ${b.fecha_fin} (${b.estado})`);
      });

      if (bloqueadosCasa.length > 6) {
        console.log('  ...');
      }

      console.log('\nÚltimos 3 bloques:');
      bloqueadosCasa.slice(-3).forEach(b => {
        console.log(`  ${b.fecha_inicio} → ${b.fecha_fin} (${b.estado})`);
      });

      const ventanas = calcularVentanasDisponibles(casaId, bloqueados, hasta);
      console.log(`\n✨ Ventanas disponibles (${ventanas.length} períodos):`);
      ventanas.slice(0, 5).forEach(v => {
        console.log(`  ✓ ${v.inicio} → ${v.fin}`);
      });
      if (ventanas.length > 5) {
        console.log(`  ... (${ventanas.length - 5} más)`);
      }
    });

    console.log('\n\n✅ Test completado correctamente\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
