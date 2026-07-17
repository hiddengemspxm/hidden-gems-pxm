#!/usr/bin/env python3
"""
Genera casas/<slug>/index.html para cada casa de data/casas.json que tenga
un campo "slug". Todas las páginas generadas son copias idénticas de
casas/_plantilla-detalle.html -- el contenido real (nombre, specs,
descripción, amenidades, galería) se pinta en el navegador con
HGP.renderDetalleCasa(), que lee /data/casas.json en tiempo real.

Uso: agrega "slug": "casa-nueva" a la casa en data/casas.json y corre:
    python3 scripts/generar-paginas-detalle.py
"""
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANTILLA = os.path.join(RAIZ, 'casas', '_plantilla-detalle.html')
CASAS_JSON = os.path.join(RAIZ, 'data', 'casas.json')


def main():
    with open(PLANTILLA, encoding='utf-8') as f:
        plantilla_html = f.read()

    with open(CASAS_JSON, encoding='utf-8') as f:
        casas = json.load(f)

    generadas = []
    for casa in casas:
        slug = casa.get('slug')
        if not slug:
            continue
        carpeta = os.path.join(RAIZ, 'casas', slug)
        os.makedirs(carpeta, exist_ok=True)
        destino = os.path.join(carpeta, 'index.html')
        with open(destino, 'w', encoding='utf-8') as f:
            f.write(plantilla_html)
        generadas.append('/casas/' + slug)

    print('Páginas generadas (%d):' % len(generadas))
    for ruta in generadas:
        print(' ', ruta)


if __name__ == '__main__':
    main()
