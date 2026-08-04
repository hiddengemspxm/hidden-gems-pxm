#!/usr/bin/env node
/**
 * Script de compresión de imágenes con Sharp
 * Reduce cualquier foto a máximo 2000px de ancho, mantiene aspect ratio
 * Convierte a JPEG con calidad 80 para optimizar tamaño
 *
 * Uso: node compress-images.js
 * Procesa: /assets/img/
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, 'assets', 'img');
const MAX_WIDTH = 2000;
const QUALITY = 80;

async function compressImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    // Solo procesar JPEG/PNG originales (no fallback, no webp)
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;
    if (filePath.includes('-fallback') || filePath.includes('.webp')) return;

    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const originalSize = stat.size;

    // Si la foto ya es pequeña (<1MB), skip
    if (originalSize < 1000000) return;

    console.log(`Comprimiendo: ${fileName} (${(originalSize / 1024 / 1024).toFixed(1)}MB)...`);

    const metadata = await sharp(filePath).metadata();
    let pipeline = sharp(filePath);

    // Redimensionar si es más ancho que MAX_WIDTH
    if (metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, undefined, { withoutEnlargement: true });
    }

    // Convertir a JPEG con calidad 80 (buen balance tamaño/calidad)
    pipeline = pipeline.jpeg({ quality: QUALITY, progressive: true });

    await pipeline.toFile(filePath);

    const newStat = fs.statSync(filePath);
    const newSize = newStat.size;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(0);

    console.log(`  ✓ ${(newSize / 1024 / 1024).toFixed(1)}MB (reducido ${reduction}%)`);
  } catch (error) {
    console.error(`  ✗ Error comprimiendo ${filePath}:`, error.message);
  }
}

async function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursivamente procesar subdirectorios
      await walkDir(fullPath);
    } else if (stat.isFile()) {
      await compressImage(fullPath);
    }
  }
}

(async () => {
  console.log('🖼️  Iniciando compresión de imágenes...\n');
  console.log(`Parámetros: máx ${MAX_WIDTH}px de ancho, calidad ${QUALITY}\n`);

  try {
    await walkDir(IMG_DIR);
    console.log('\n✅ Compresión completada!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
