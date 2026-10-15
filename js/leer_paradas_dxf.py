#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
leer_paradas_dxf.py
===================
Lee los PERFILES de las paradas (abanicos de tiros, zona "DETALLE PARADAS") de un plano DXF y rellena
la pestaña JEJ (la segunda) de la planilla "HOJA DE TERRENO SEGUIMIENTO AL CARGUIO":

    PARADA  |  TIRO  |  LONG. DISEÑO [M] (longitud del tiro)  |  Taco (longitud del taco)

un tiro por fila, para todas las paradas de los perfiles del plano y en el orden del dibujo (P1, P2, ...).
La tabla queda SÓLO con esos cuatro datos: las demás columnas de la tabla quedan vacías (con sus fórmulas y
formato) para llenarlas en terreno. Escribe en la MISMA planilla (antes deja una copia de respaldo
"<planilla> - respaldo.xlsx" en la misma carpeta). No agrega pestañas.

Detalles:
  * El nombre de la parada va en la primera fila de cada parada (P1, P AuxHW, P CuñaHw, PE-30...).
  * Las cuñas no tienen taco dibujado en el perfil (no se cargan): llevan Taco 0.
  * Si la tabla tiene menos filas que tiros, inserta las que faltan con el mismo formato y fórmulas.
  El encabezado de la pestaña, las observaciones y la Hoja1 no se tocan.

Cómo usarlo:
  1. Doble clic al archivo (o "Run" en el editor): pide el plano DXF y la planilla en ventanas de Windows.
     También se pueden dejar escritas las rutas en RUTA_DXF y RUTA_PLANILLA, aquí abajo.
  2. Desde la consola:
       python leer_paradas_dxf.py "plano.dxf" "planilla.xlsx"
  La planilla debe estar CERRADA en Excel mientras se rellena.

Opciones de consola:
    -o "otra.xlsx"                 escribe en otro archivo y deja la planilla como estaba
    --paradas "10, AuxHW, 11"      sólo esas paradas, en ese orden
    --orden fase                   agrupadas por fase (cuadro del plano), la fase de la planilla primero
    --conservar-terreno            no borrar lo ya llenado en terreno: cada fila viaja con su tiro
    --taco-no-cargados vacio|largo taco de las paradas que no se cargan (por omisión 0)
    --hoja-perfiles                agrega además la pestaña "Perfiles DXF" con la verificación del cuadro
    --txt                          escribe además un TXT con todos los datos de los perfiles
    -v                             diagnóstico tramo a tramo

Sólo usa la biblioteca estándar de Python (3.7 o superior).

Cómo reconoce los tiros (plano IM9-103587-0 Z49 C59-61 y planos ProMine del mismo estilo):
  * Cada perfil tiene un título "PARADA # n (b°)" y, unos 2,5-3 m por encima, uno o más PIVOTES
    (círculos diminutos: LWPOLYLINE cerrada de 2 vértices, Ø 0,06) en el punto de perforación.
  * Cada tiro es una sucesión de tramos colineales desde el pivote: interior de la galería verde
    (color 3), TACO negro (7) discontinuo, CARGA continua roja (1) o azul (5).
  * Longitud = taco + carga (del collar en el contorno al fondo) = rótulo "L m. A°" del tiro.
  * El número suelto junto al cambio de tramo es el taco; el número en el círculo del fondo es el tiro.
"""
import sys
import os
import re
import math
import argparse
import datetime
import zipfile
import shutil
from xml.sax.saxutils import escape as xml_escape

# ---------------------------------------------------------------- rutas (opcional)
# Si se dejan escritas, al hacer doble clic al script no pregunta por los archivos. Ejemplo:
# RUTA_DXF = r'C:\Users\Usuario CC650\Documents\DET\Z49_C59_C61\MEDICIÓN DE TIROS\Planos\IM9-103587-0 Z49 C59-61 Esm 1.dxf'
# RUTA_PLANILLA = r'C:\Users\Usuario CC650\Documents\DET\Z49_C59_C61\NT\F1\Z49 C59-61 1era fase - AnFo 25-09-26.xlsx'
RUTA_DXF = r''
RUTA_PLANILLA = r''

# ---------------------------------------------------------------- parámetros
TOL_PIVOTE = 0.05        # distancia máxima entre el eje del tramo y el pivote (m)
TOL_LADO = 0.10          # un tramo que cruza el pivote (va de piso a techo) no es tiro
TOL_UNION = 0.06         # hueco máximo entre tramos consecutivos de un tiro (m)
ANG_GRUPO = 0.6          # tramos con direcciones que difieren menos que esto son el mismo tiro (°)
RADIO_CIRCULO = (0.15, 0.45)   # círculos con el n.º de tiro
DIST_NUM_TIRO = 1.5      # del fondo al círculo del n.º (m)
DIST_NUM_TACO = 0.7      # del fin del taco al número del taco (m)
DIST_ROTULO = 1.6        # del rótulo "L m. A°" al eje del tiro (m)
ANG_ROTULO = 5.0         # diferencia máxima entre giro del rótulo y dirección del tiro (°)
TOL_CUADRO = 0.15        # tolerancia al comparar longitudes con el cuadro del plano (m)
COLORES_TIRO = {1, 2, 3, 5, 6, 7}
CAPAS_EXCLUIDAS = ('ACOTADO OCULTO', '3D_COTA_AUXILIAR')
CONTINUOS = ('CONTINUOUS', 'CONTINUA', 'CONTINUO', 'BYLAYER', 'BYBLOCK', '')

# clave canónica de la parada -> texto en la columna PARADA de la planilla
NOMBRES_PLANILLA = {
    'AUXHW': 'P AuxHW', 'AUXFW': 'P AuxFW', 'AUX': 'P Aux',
    'CUNAHW': 'P CuñaHw', 'CUNAFW': 'P CuñaFw', 'CUNA': 'P Cuña',
}
HOJA_PLANILLA = 'JEJ'          # hoja de la planilla con la tabla (si no existe se busca el encabezado PARADA)
HOJA_PERFILES = 'Perfiles DXF'
NOTA_NO_CARGA = 'No se carga'

RE_TITULO = re.compile(r'^\s*PARADAS?\b', re.I)
RE_LARGO = re.compile(r'(\d+(?:[.,]\d+)?)\s*(?:m|mt|mts)\b', re.I)
RE_ANGULO = re.compile(r'(\d+(?:[.,]\d+)?)\s*°')
RE_NUMERO = re.compile(r'^\s*(\d+(?:[.,]\d+)?)\s*$')
RE_ENTERO = re.compile(r'^\s*(\d+)\s*$')
RE_BASC = re.compile(r'\(\s*(\d+(?:[.,]\d+)?)\s*°\s*([^)]*)\)')
RE_NO_CARGA = re.compile(r'NO\s+SE\s+CARGA|S[OÓ]LO\s+SE\s+BARRENA|NO\s+CARGAR\b')
RE_NOTA_NUM = re.compile(r'^\s*(\d+)\s*\.?\s*-')
RE_FASE_CAB = re.compile(r'^\s*(\d+)\s*°\s*FASE\s*$', re.I)
ETIQUETAS_CUADRO = (('tiros', re.compile(r'^\s*N[UÚ]MERO\s+DE\s+TIROS', re.I)),
                    ('barrenada', re.compile(r'^\s*LONGITUD\s+BARRENADA', re.I)),
                    ('sin_cargar', re.compile(r'^\s*LONGITUD\s+SIN\s+CARGAR', re.I)),
                    ('carguio', re.compile(r'^\s*LONGITUD\s+DE\s+CARGU[IÍ]O', re.I)))
LADOS = {'NTE': 'Nte.', 'NORTE': 'Nte.', 'N': 'Nte.', 'SUR': 'Sur', 'S': 'Sur',
         'HW': 'HW', 'FW': 'FW', 'ESTE': 'Este', 'OESTE': 'Oeste', 'E': 'Este', 'W': 'Oeste', 'O': 'Oeste'}


def num(s):
    return float(str(s).strip().replace(',', '.'))


def decir(s=''):
    """print que no se cae si la consola no admite algún carácter."""
    try:
        print(s)
    except UnicodeEncodeError:
        enc = getattr(sys.stdout, 'encoding', None) or 'ascii'
        print(s.encode(enc, 'replace').decode(enc, 'replace'))


def limpiar(t):
    """Quita códigos de formato de AutoCAD (%%U, %%D, \\A1; ...)."""
    t = t.replace('%%U', '').replace('%%u', '')
    t = re.sub(r'%%[dD]', '°', t)
    t = re.sub(r'%%[cC]', 'Ø', t)
    t = re.sub(r'%%[pP]', '±', t)
    t = re.sub(r'\\U\+00B0', '°', t)
    t = re.sub(r'\\[A-Za-z][^;\\{}]*;', '', t)
    t = t.replace('\\P', ' ').replace('{', '').replace('}', '')
    return t.strip()


def es_continuo(lt):
    return lt.upper() in CONTINUOS


# ================================================================ 1. LECTURA DEL DXF
class DXF(object):
    def __init__(self, ruta):
        self.capas = {}        # nombre -> (color, tipo de línea)
        self.segmentos = []    # dict(x1,y1,x2,y2,color,lt,capa,tipo)
        self.pivotes = []      # (x, y, diámetro)
        self.circulos = []     # dict(x,y,r,numero)
        self.textos = []       # espacio modelo: dict(texto,x,y,ax,ay,rot,h,tipo)
        self.textos_papel = []  # espacio papel (notas y cuadros de la lámina)
        self.n_entidades = 0
        self.n_en_bloques = 0
        self._poly = None
        self._bloque = None
        self._leer(ruta)

    @staticmethod
    def _decodificar(ruta):
        with open(ruta, 'rb') as f:
            datos = f.read()
        for enc in ('utf-8', 'cp1252'):
            try:
                return datos.decode(enc)
            except UnicodeDecodeError:
                pass
        return datos.decode('latin-1', errors='replace')

    def _leer(self, ruta):
        lineas = self._decodificar(ruta).splitlines()
        it = iter(lineas)
        seccion = None
        esperando_nombre = False
        tipo = None
        rec = []
        tabla = None
        for codigo in it:
            try:
                valor = next(it)
            except StopIteration:
                break
            try:
                c = int(codigo.strip())
            except ValueError:
                continue
            if c == 0:
                v = valor.strip()
                if tipo is not None:
                    self._cerrar(seccion, tabla, tipo, rec)
                    tipo, rec = None, []
                if v == 'SECTION':
                    esperando_nombre = True
                elif v == 'ENDSEC':
                    seccion = None
                elif v == 'EOF':
                    break
                elif seccion == 'TABLES' and v == 'TABLE':
                    tabla = None
                    tipo, rec = 'TABLE', []
                elif seccion in ('TABLES', 'ENTITIES', 'BLOCKS'):
                    tipo, rec = v, []
                continue
            if esperando_nombre and c == 2:
                seccion = valor.strip()
                esperando_nombre = False
                continue
            if tipo == 'TABLE' and c == 2:
                tabla = valor.strip()
                continue
            if tipo is not None:
                rec.append((c, valor))
        if tipo is not None:
            self._cerrar(seccion, tabla, tipo, rec)

    @staticmethod
    def _primeros(rec):
        d = {}
        for c, v in rec:
            if c not in d:
                d[c] = v
        return d

    def _estilo(self, d):
        capa = d.get(8, '0').strip()
        ccapa, ltcapa = self.capas.get(capa, (7, 'CONTINUOUS'))
        col = d.get(62)
        if col is None or int(col) == 256:
            color = ccapa
        elif int(col) == 0:
            color = 7
        else:
            color = abs(int(col))
        lt = d.get(6, 'BYLAYER').strip().upper()
        if lt in ('BYLAYER', ''):
            lt = ltcapa
        elif lt == 'BYBLOCK':
            lt = 'CONTINUOUS'
        return color, lt, capa

    def _cerrar(self, seccion, tabla, tipo, rec):
        if seccion == 'TABLES':
            if tipo == 'LAYER' and tabla == 'LAYER':
                d = self._primeros(rec)
                nombre = d.get(2, '').strip()
                try:
                    color = abs(int(d.get(62, '7')))
                except ValueError:
                    color = 7
                self.capas[nombre] = (color, d.get(6, 'CONTINUOUS').strip().upper())
            return
        if seccion == 'BLOCKS':
            if tipo == 'BLOCK':
                self._bloque = self._primeros(rec).get(2, '').strip()
            elif tipo == 'ENDBLK':
                self._bloque = None
            else:
                self.n_en_bloques += 1
                if tipo in ('TEXT', 'MTEXT') and (self._bloque or '').upper().startswith('*PAPER_SPACE'):
                    self._texto(tipo, rec, self._primeros(rec), self.textos_papel, self._bloque)
            return
        if seccion != 'ENTITIES':
            return
        self.n_entidades += 1
        if tipo == 'POLYLINE':                   # polilínea antigua: POLYLINE + VERTEX... + SEQEND
            self._poly = {'rec': rec, 'pts': []}
            return
        if tipo == 'VERTEX':
            if self._poly is not None:
                d = self._primeros(rec)
                if int(d.get(70, '0')) & 16:      # punto de control de spline
                    return
                try:
                    self._poly['pts'].append((num(d[10]), num(d[20])))
                except (KeyError, ValueError):
                    pass
            return
        if tipo == 'SEQEND':
            if self._poly is not None:
                self._emitir_polyline()
                self._poly = None
            return
        d = self._primeros(rec)
        if d.get(67, '0').strip() == '1':        # espacio papel de la presentación activa
            if tipo in ('TEXT', 'MTEXT'):
                self._texto(tipo, rec, d, self.textos_papel, '*Paper_Space')
            return
        if tipo == 'LINE':
            color, lt, capa = self._estilo(d)
            try:
                self._agregar_segmento(num(d[10]), num(d[20]), num(d[11]), num(d[21]), color, lt, capa, 'LINE')
            except (KeyError, ValueError):
                pass
        elif tipo == 'LWPOLYLINE':
            self._lwpolyline(rec, d)
        elif tipo == 'CIRCLE':
            try:
                self.circulos.append({'x': num(d[10]), 'y': num(d[20]), 'r': num(d[40]), 'numero': None})
            except (KeyError, ValueError):
                pass
        elif tipo in ('TEXT', 'MTEXT'):
            self._texto(tipo, rec, d, self.textos)

    def _agregar_segmento(self, x1, y1, x2, y2, color, lt, capa, tipo):
        if math.hypot(x2 - x1, y2 - y1) < 0.005:
            return
        self.segmentos.append({'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                               'color': color, 'lt': lt, 'capa': capa, 'tipo': tipo})

    def _emitir_polyline(self):
        d = self._primeros(self._poly['rec'])
        if d.get(67, '0').strip() == '1':
            return
        flags = int(d.get(70, '0'))
        if flags & (16 | 64):                    # malla / polycara
            return
        pts = self._poly['pts']
        color, lt, capa = self._estilo(d)
        n = len(pts)
        if n == 2 and (flags & 1) and math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) <= 0.2:
            self._pivote(pts)
            return
        for i in range(n - 1):
            self._agregar_segmento(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, lt, capa, 'POLYLINE')
        if flags & 1 and n > 2:
            self._agregar_segmento(pts[-1][0], pts[-1][1], pts[0][0], pts[0][1], color, lt, capa, 'POLYLINE')

    def _pivote(self, pts):
        (x1, y1), (x2, y2) = pts
        self.pivotes.append(((x1 + x2) / 2.0, (y1 + y2) / 2.0, math.hypot(x2 - x1, y2 - y1)))

    def _lwpolyline(self, rec, d):
        pts, bulges = [], []
        for c, v in rec:
            if c == 10:
                pts.append([num(v), None])
                bulges.append(0.0)
            elif c == 20 and pts:
                pts[-1][1] = num(v)
            elif c == 42 and bulges:
                bulges[-1] = num(v)
        pts = [(p[0], p[1]) for p in pts if p[1] is not None]
        n = len(pts)
        if n < 2:
            return
        flags = int(d.get(70, '0'))
        cerrada = bool(flags & 1)
        if cerrada and n == 2 and math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) <= 0.2:
            self._pivote(pts)               # "círculo" diminuto: punto de perforación
            return
        color, lt, capa = self._estilo(d)
        aristas = n if cerrada else n - 1
        for i in range(aristas):
            if abs(bulges[i]) > 1e-9:       # arco: no es un tiro
                continue
            a, b = pts[i], pts[(i + 1) % n]
            self._agregar_segmento(a[0], a[1], b[0], b[1], color, lt, capa, 'LWPOLYLINE')

    def _texto(self, tipo, rec, d, destino, grupo='modelo'):
        if tipo == 'MTEXT':
            partes = [v for c, v in rec if c == 3]
            partes.append(d.get(1, ''))
            texto = ''.join(partes)
        else:
            texto = d.get(1, '')
        texto = limpiar(texto)
        if not texto:
            return
        try:
            x, y = num(d[10]), num(d[20])
        except (KeyError, ValueError):
            return
        ax = num(d[11]) if 11 in d else None
        ay = num(d[21]) if 21 in d else None
        if 50 in d:
            rot = num(d[50])
        elif tipo == 'MTEXT' and ax is not None and ay is not None:
            rot = math.degrees(math.atan2(ay, ax))   # en MTEXT 11/21 es el vector dirección
            ax = ay = None
        else:
            rot = 0.0
        destino.append({'texto': texto, 'x': x, 'y': y, 'ax': ax, 'ay': ay,
                        'rot': rot % 360.0, 'h': num(d.get(40, '0')), 'tipo': tipo, 'grupo': grupo})


# ================================================================ 2. ANÁLISIS DE LOS PERFILES
def nombre_parada(titulo):
    t = re.sub(r'^\s*PARADAS?\s*#?\s*', '', titulo, flags=re.I)
    t = RE_BASC.sub('', t)
    return t.strip() or titulo


def basculacion(titulo):
    m = RE_BASC.search(titulo)
    if not m:
        return ''
    lado = m.group(2).strip()
    return (m.group(1) + '°' + (' ' + lado if lado else ''))


def clasificar(color, lt):
    if color == 3:
        return 'interior'
    cont = es_continuo(lt)
    if not cont and color == 7:
        return 'taco'
    if not cont:
        return 'interior'            # tramo a rayas de otro color: dentro de la galería
    if color in (1, 2, 5, 6):
        return 'carga'
    return 'otro'


def union_intervalos(ints):
    if not ints:
        return 0.0
    ints = sorted(ints)
    total = 0.0
    a, b = ints[0]
    for c, d in ints[1:]:
        if c > b:
            total += b - a
            a, b = c, d
        else:
            b = max(b, d)
    return total + (b - a)


def analizar(dxf, verbose=False):
    avisos = []
    # 1. títulos
    titulos = []
    for t in dxf.textos:
        if RE_TITULO.match(t['texto']):
            titulos.append({'texto': t['texto'], 'x': t['x'], 'y': t['y'],
                            'nombre': nombre_parada(t['texto']), 'basc': basculacion(t['texto']),
                            'pivotes': [], 'tiros': [], 'lados': ('', '')})
    if not titulos:
        avisos.append('No se encontró ningún texto "PARADA ..." en el espacio modelo.')
        return titulos, avisos

    # 2. pivotes -> título más cercano (el pivote está unos 2,5-3 m por encima del título)
    pivotes_sin = 0
    for p in dxf.pivotes:
        mejor = None
        for t in titulos:
            dx, dy = p[0] - t['x'], p[1] - t['y']
            if -0.5 <= dy <= 10.0 and abs(dx) <= 15.0:
                dd = math.hypot(dx, dy)
                if mejor is None or dd < mejor[0]:
                    mejor = (dd, t)
        if mejor is None:
            pivotes_sin += 1
            continue
        if any(math.hypot(p[0] - q[0], p[1] - q[1]) < 0.05 for q in mejor[1]['pivotes']):
            continue                      # pivote repetido en el mismo punto
        mejor[1]['pivotes'].append(p)

    # 3. segmentos candidatos (estilo de tiro) deduplicados
    vistos = set()
    candidatos = []
    for s in dxf.segmentos:
        if s['color'] not in COLORES_TIRO:
            continue
        if s['lt'].startswith('CENTER'):
            continue
        if s['capa'].upper() in CAPAS_EXCLUIDAS:
            continue
        clave = (round(s['x1'], 3), round(s['y1'], 3), round(s['x2'], 3), round(s['y2'], 3), s['color'], s['lt'])
        clave2 = (clave[2], clave[3], clave[0], clave[1], clave[4], clave[5])
        if clave in vistos or clave2 in vistos:
            continue
        vistos.add(clave)
        candidatos.append(s)

    # 4. tiros: tramos colineales que parten de cada pivote
    for t in titulos:
        if not t['pivotes']:
            continue
        cerca = [s for s in candidatos
                 if abs((s['x1'] + s['x2']) / 2.0 - t['x']) <= 40.0 and -6.0 <= (s['y1'] + s['y2']) / 2.0 - t['y'] <= 50.0]
        for p in t['pivotes']:
            tramos = []
            for s in cerca:
                wx, wy = s['x2'] - s['x1'], s['y2'] - s['y1']
                L = math.hypot(wx, wy)
                ex, ey = wx / L, wy / L
                rx, ry = s['x1'] - p[0], s['y1'] - p[1]
                perp = abs(rx * ey - ry * ex)
                if perp > TOL_PIVOTE:
                    continue
                t1 = rx * ex + ry * ey
                t2 = t1 + L
                if t1 >= -TOL_LADO:
                    u, a, b = (ex, ey), t1, t2
                elif t2 <= TOL_LADO:
                    u, a, b = (-ex, -ey), -t2, -t1
                else:
                    continue                      # cruza el pivote: línea de piso a techo
                ang = math.degrees(math.atan2(u[1], u[0])) % 360.0
                tramos.append({'ang': ang, 'u': u, 'a': max(a, 0.0), 'b': b, 'seg': s,
                               'clase': clasificar(s['color'], s['lt'])})
            tramos.sort(key=lambda z: z['ang'])
            grupos = []
            for tr in tramos:
                if grupos and abs(tr['ang'] - grupos[-1][0]['ang']) <= ANG_GRUPO:
                    grupos[-1].append(tr)
                else:
                    grupos.append([tr])
            for g in grupos:
                tiro = construir_tiro(t, p, g)
                if tiro is not None:
                    t['tiros'].append(tiro)
    if pivotes_sin and verbose:
        avisos.append('%d puntos de perforación sin título "PARADA" cerca (se ignoran).' % pivotes_sin)

    tiros = [h for t in titulos for h in t['tiros']]
    if not tiros:
        avisos.append('No se reconoció ningún tiro.')
        return titulos, avisos

    # 5. rótulos "L m. A°"
    rotulos = []
    for tx in dxf.textos:
        if RE_TITULO.match(tx['texto']):
            continue
        ml, ma = RE_LARGO.search(tx['texto']), RE_ANGULO.search(tx['texto'])
        if ml and ma:
            rotulos.append({'L': num(ml.group(1)), 'A': num(ma.group(1)), 't': tx, 'tiro': None})
    pares = []
    for r in rotulos:
        tx = r['t']
        for h in tiros:
            vx, vy = tx['x'] - h['px'], tx['y'] - h['py']
            u = h['u']
            tproj = vx * u[0] + vy * u[1]
            if not (h['collar'] - 1.5 <= tproj <= h['fondo'] + 1.5):
                continue
            dperp = abs(vx * u[1] - vy * u[0])
            if dperp > DIST_ROTULO:
                continue
            dif = (tx['rot'] - h['ang'] + 90.0) % 180.0 - 90.0
            if abs(dif) > ANG_ROTULO:
                continue
            pares.append((dperp, r, h))
    pares.sort(key=lambda z: z[0])
    for dperp, r, h in pares:
        if r['tiro'] is None and h['rotulo'] is None:
            r['tiro'] = h
            h['rotulo'] = r
    sin_tiro = [r for r in rotulos if r['tiro'] is None]

    # 6. números de tiro (texto dentro de un círculo junto al fondo)
    enteros = [tx for tx in dxf.textos if RE_ENTERO.match(tx['texto'])]
    circulos = [c for c in dxf.circulos if RADIO_CIRCULO[0] <= c['r'] <= RADIO_CIRCULO[1]]
    usados = set()
    for c in circulos:
        mejor = None
        for i, tx in enumerate(enteros):
            if i in usados:
                continue
            for (x, y) in ((tx['ax'], tx['ay']), (tx['x'], tx['y'])):
                if x is None:
                    continue
                dd = math.hypot(x - c['x'], y - c['y'])
                if dd <= c['r'] + 0.05 and (mejor is None or dd < mejor[0]):
                    mejor = (dd, i)
        if mejor is not None:
            usados.add(mejor[1])
            c['numero'] = enteros[mejor[1]]['texto'].strip()
    pares = []
    for h in tiros:
        fx, fy = h['px'] + h['u'][0] * h['fondo'], h['py'] + h['u'][1] * h['fondo']
        for c in circulos:
            if c['numero'] is None:
                continue
            dd = math.hypot(c['x'] - fx, c['y'] - fy)
            if dd <= DIST_NUM_TIRO:
                pares.append((dd, h, c))
    pares.sort(key=lambda z: z[0])
    tomados = set()
    for dd, h, c in pares:
        if h['numero'] is None and id(c) not in tomados:
            h['numero'] = c['numero']
            tomados.add(id(c))

    # 7. número del taco (texto numérico suelto junto al fin del taco)
    ids_numero_tiro = set(id(enteros[i]) for i in usados)
    numericos = [tx for tx in dxf.textos
                 if RE_NUMERO.match(tx['texto']) and id(tx) not in ids_numero_tiro]
    pares = []
    for h in tiros:
        if h['fin_taco'] is None:
            continue
        jx, jy = h['px'] + h['u'][0] * h['fin_taco'], h['py'] + h['u'][1] * h['fin_taco']
        for tx in numericos:
            dd = min(math.hypot(tx['x'] - jx, tx['y'] - jy),
                     math.hypot((tx['ax'] if tx['ax'] is not None else tx['x']) - jx,
                                (tx['ay'] if tx['ay'] is not None else tx['y']) - jy))
            if dd <= DIST_NUM_TACO:
                pares.append((dd, h, tx))
    pares.sort(key=lambda z: z[0])
    tomados = set()
    for dd, h, tx in pares:
        if h['taco_rot'] is None and id(tx) not in tomados:
            h['taco_rot'] = num(RE_NUMERO.match(tx['texto']).group(1))
            tomados.add(id(tx))
    # en abanicos apretados (diez tacos de "1" casi superpuestos) un tiro puede quedar sin
    # número propio: se le asigna el texto más cercano aunque ya se haya usado
    for dd, h, tx in pares:
        if h['taco_rot'] is None:
            h['taco_rot'] = num(RE_NUMERO.match(tx['texto']).group(1))

    # 8. lados (Nte./Sur, HW/FW) de cada perfil
    for t in titulos:
        lados = []
        for tx in dxf.textos:
            clave = tx['texto'].strip().strip('.').upper()
            if clave in LADOS and abs(tx['x'] - t['x']) <= 10.0 and -1.0 <= tx['y'] - t['y'] <= 6.0:
                lados.append((tx['x'], LADOS[clave]))
        if len(lados) >= 2:
            lados.sort()
            t['lados'] = (lados[0][1], lados[-1][1])

    # 9. observaciones de cada tiro
    for h in tiros:
        if h['rotulo'] is None:
            h['obs'].append('sin rótulo L/°: longitud e inclinación medidas en el dibujo')
        else:
            if abs(h['rotulo']['L'] - h['L_med']) > 0.15:
                h['obs'].append('rótulo %.1f m, dibujo %.2f m' % (h['rotulo']['L'], h['L_med']))
            if abs(h['rotulo']['A'] - h['inc_med']) > 1.5:
                h['obs'].append('rótulo %.0f°, dibujo %.1f°' % (h['rotulo']['A'], h['inc_med']))
        if h['taco_rot'] is not None and abs(h['taco_rot'] - h['taco_med']) > 0.3:
            h['obs'].append('taco rotulado %.1f m, dibujo %.2f m' % (h['taco_rot'], h['taco_med']))
        if h['fin_taco'] is None:
            h['obs'].append('sin taco dibujado')
        elif h['taco_rot'] is None:
            h['obs'].append('taco sin número: medido en el dibujo')
    for r in sin_tiro:
        avisos.append('Rótulo "%s" en (%.2f, %.2f) sin tiro asociado.' % (r['t']['texto'], r['t']['x'], r['t']['y']))
    if verbose:
        for t in titulos:
            if not t['tiros']:
                avisos.append('Título "%s" en (%.2f, %.2f) sin tiros.' % (t['texto'], t['x'], t['y']))
    return titulos, avisos


def construir_tiro(titulo, p, g):
    """Convierte un grupo de tramos colineales (desde el pivote p) en un tiro."""
    tiro_ints = [(z['a'], z['b']) for z in g if z['clase'] in ('taco', 'carga')]
    if not tiro_ints or union_intervalos(tiro_ints) < 1.0:
        return None
    collar = min(a for a, b in tiro_ints)
    fondo = max(b for a, b in tiro_ints)
    taco_ints = [(z['a'], z['b']) for z in g if z['clase'] == 'taco']
    carga_ints = [(z['a'], z['b']) for z in g if z['clase'] == 'carga']
    taco = union_intervalos(taco_ints)
    carga = union_intervalos(carga_ints)
    fin_taco = max(b for a, b in taco_ints) if taco_ints else None
    sx = sum(z['u'][0] * (z['b'] - z['a']) for z in g)
    sy = sum(z['u'][1] * (z['b'] - z['a']) for z in g)
    n = math.hypot(sx, sy)
    u = (sx / n, sy / n)
    ang = math.degrees(math.atan2(u[1], u[0])) % 360.0
    inc = math.degrees(math.atan2(abs(u[0]), u[1]))
    obs = []
    ints = sorted(tiro_ints)
    b_prev = ints[0][1]
    for a, b in ints[1:]:
        if a - b_prev > TOL_UNION:
            obs.append('hueco de %.2f m entre tramos' % (a - b_prev))
        b_prev = max(b_prev, b)
    if abs((taco + carga) - (fondo - collar)) > TOL_UNION:
        obs.append('taco+carga %.2f m, largo %.2f m' % (taco + carga, fondo - collar))
    otros = [z for z in g if z['clase'] == 'otro']
    if otros:
        obs.append('%d tramo(s) de estilo desconocido' % len(otros))
    colores = sorted(set(z['seg']['color'] for z in g if z['clase'] == 'carga'))
    lado = 'izq' if u[0] < -0.005 else ('der' if u[0] > 0.005 else '')
    return {'parada': titulo, 'px': p[0], 'py': p[1], 'u': u, 'ang': ang, 'inc_med': inc,
            'lado': lado, 'collar': collar, 'fondo': fondo, 'L_med': fondo - collar,
            'taco_med': taco, 'carga_med': carga, 'fin_taco': fin_taco,
            'interior': union_intervalos([(z['a'], z['b']) for z in g if z['clase'] == 'interior']),
            'colores': colores, 'tramos': g, 'rotulo': None, 'numero': None, 'taco_rot': None, 'obs': obs}


def longitud_diseno(h):
    """Longitud de diseño del tiro: la rotulada en el plano; si falta, la medida (0,1 m)."""
    return h['rotulo']['L'] if h['rotulo'] else round(h['L_med'], 1)


def taco_dibujado(h):
    """Taco del plano: el número rotulado; si falta, el medido (0,1 m); None si no hay taco dibujado."""
    if h['taco_rot'] is not None:
        return h['taco_rot']
    if h['fin_taco'] is None:
        return None
    return round(h['taco_med'], 1)


def inclinacion(h):
    return h['rotulo']['A'] if h['rotulo'] else round(h['inc_med'])


def lado_tiro(t, h):
    if h['lado'] == 'izq':
        return t['lados'][0]
    if h['lado'] == 'der':
        return t['lados'][1]
    return ''


def clave_tiro(h):
    try:
        return (0, int(h['numero']), -h['ang'])
    except (TypeError, ValueError):
        return (1, 0, -h['ang'])


def ordenar_plano(titulos):
    """Orden del plano: filas de perfiles de arriba abajo (títulos a la misma altura, ±2 m) y, en
    cada fila, de izquierda a derecha."""
    filas = []
    for t in sorted(titulos, key=lambda t: -t['y']):
        if filas and abs(filas[-1][0]['y'] - t['y']) <= 2.0:
            filas[-1].append(t)
        else:
            filas.append([t])
    out = []
    for i, f in enumerate(filas):
        for t in sorted(f, key=lambda t: t['x']):
            t['fila_plano'] = i
            out.append(t)
    return out


def numerar_tiros(t, avisos):
    """Tiros de la parada en orden, con número único (el del círculo del fondo o el orden)."""
    tiros = sorted(t['tiros'], key=clave_tiro)
    numeros = []
    for i, h in enumerate(tiros):
        try:
            numeros.append(int(h['numero']))
        except (TypeError, ValueError):
            numeros.append(None)
    if None in numeros or len(set(numeros)) != len(numeros):
        if any(n is None for n in numeros):
            avisos.append('%s: tiro(s) sin número en el círculo del fondo; se numeran por orden.'
                          % nombre_en_planilla(t['nombre']))
        else:
            avisos.append('%s: números de tiro repetidos en el plano; se numeran por orden.'
                          % nombre_en_planilla(t['nombre']))
        numeros = list(range(1, len(tiros) + 1))
    return list(zip(numeros, tiros))


# ================================================================ 3. INFORMACIÓN DEL PLANO: CARGA, FASES Y CUADRO
def canon(nombre):
    """Clave canónica de una parada: '10', 'AUXHW', 'CUNAFW', 'PE30'... (acepta 'P10', 'PARADA # 10',
    'P AuxHW', 'Cuña Fw', 'PE-30', 'ESPECIAL PE-30')."""
    u = str(nombre).upper().replace('Ñ', 'N')
    u = re.sub(r'\(.*?\)', '', u)                 # quita la basculación "(5° Fw)"
    u = re.sub(r'[^A-Z0-9]', '', u)
    u = re.sub(r'^PARADAS?', '', u)
    m = re.search(r'PE(\d+)$', u)
    if m:
        return 'PE%d' % int(m.group(1))
    for k in ('CUNA', 'AUX'):
        if k in u:
            resto = u.replace(k, '')
            lado = 'HW' if 'HW' in resto else ('FW' if 'FW' in resto else '')
            return k + lado
    u = re.sub(r'^P(?=\d)', '', u)
    m = re.match(r'^0*(\d+)$', u)
    if m:
        return str(int(m.group(1)))
    return u


def nombre_en_planilla(nombre):
    """'10' -> 'P10'; 'AUX. HW' -> 'P AuxHW'; 'CUÑA Hw' -> 'P CuñaHw'; 'ESPECIAL PE-30' -> 'PE-30'."""
    k = canon(nombre)
    if k.isdigit():
        return 'P' + k
    if k in NOMBRES_PLANILLA:
        return NOMBRES_PLANILLA[k]
    m = re.match(r'^PE(\d+)$', k)
    if m:
        return 'PE-' + m.group(1)
    if re.match(r'^\d+[A-Z]+$', k):
        return 'P' + k
    return 'P ' + nombre


def es_etiqueta(texto, conocidas):
    """¿El texto de la columna PARADA es el nombre de una parada (y no una nota como "Tiempo 0")?"""
    if not isinstance(texto, str) or not texto.strip():
        return False
    if canon(texto) in conocidas:
        return True
    return bool(re.match(r'^\s*P\s*(?:E\s*-?\s*)?\d+[A-Za-z]?\s*(?:\(.*\))?\s*$|^\s*P\s+(?:AUX|CU)', texto, re.I))


def claves_en_nota(texto):
    """Paradas nombradas en una nota: 'PARADAS CUÑAS HW Y FW' -> ['CUNAHW', 'CUNAFW'], 'P13 A P15'..."""
    u = texto.upper().replace('Ñ', 'N')
    out = []
    lados = r'((?:HW|FW)(?:\s*(?:,|Y|E|/)\s*(?:HW|FW))*)'
    for m in re.finditer(r'CUNAS?\s*\.?\s*-?\s*' + lados, u):
        out += ['CUNA' + s for s in re.findall(r'HW|FW', m.group(1))]
    for m in re.finditer(r'AUX(?:ILIAR(?:ES)?)?\s*\.?\s*' + lados, u):
        out += ['AUX' + s for s in re.findall(r'HW|FW', m.group(1))]
    for m in re.finditer(r'\bPE\s*-?\s*(\d+)', u):
        out.append('PE%d' % int(m.group(1)))
    for m in re.finditer(r'\bP\s*(\d+)\s+(?:A|AL|HASTA)\s+P?\s*(\d+)\b', u):
        a, b = int(m.group(1)), int(m.group(2))
        if 0 < b - a < 100:
            out += [str(i) for i in range(a, b + 1)]
    for m in re.finditer(r'\bP\s*(\d+)\b', u):
        out.append(str(int(m.group(1))))
    for m in re.finditer(r'\bPARADAS?\s*#?\s*(\d+)\b', u):
        out.append(str(int(m.group(1))))
    return out


def notas_no_carga(textos):
    """{clave de parada: texto de la nota} para las paradas que según las notas del plano no se cargan."""
    out = {}
    for t in textos:
        if not RE_NO_CARGA.search(t['texto'].upper()):
            continue
        texto = t['texto']
        # líneas que continúan la nota (debajo, misma columna, sin número de nota)
        siguientes = sorted([s for s in textos if 0 < t['y'] - s['y'] <= 14 and -3 <= s['x'] - t['x'] <= 15],
                            key=lambda s: -s['y'])
        y_prev = t['y']
        for s in siguientes:
            if y_prev - s['y'] > 6 or RE_NOTA_NUM.match(s['texto']):
                break
            texto += ' ' + s['texto']
            y_prev = s['y']
        for k in claves_en_nota(texto):
            out.setdefault(k, texto)
    return out


def nota_corta(texto):
    if not texto:
        return ''
    m = RE_NOTA_NUM.match(texto)
    return ('nota %s del plano' % m.group(1)) if m else 'nota del plano'


def leer_cuadro_fases(textos):
    """Cuadro de barrenadura / tronadura del plano: {fase: {'tiros', 'barrenada', 'sin_cargar', 'carguio'}}."""
    cabeceras = []
    for t in textos:
        m = RE_FASE_CAB.match(t['texto'])
        if m:
            cabeceras.append((int(m.group(1)), t['x'], t['y']))
    if not cabeceras:
        return {}
    numeros = [(num(t['texto']), t['x'], t['y']) for t in textos if RE_NUMERO.match(t['texto'])]
    cuadro = {}
    for clave, rx in ETIQUETAS_CUADRO:
        for t in textos:
            if not rx.match(t['texto']):
                continue
            xl, yl = t['x'], t['y']
            porfase = {}
            for f, x, y in cabeceras:          # columnas del mismo cuadro: a la derecha y arriba de la etiqueta
                if 0 < x - xl <= 250 and 0 < y - yl <= 80:
                    if f not in porfase or x < porfase[f]:
                        porfase[f] = x
            for f, xh in porfase.items():
                mejor = None
                for v, x, y in numeros:
                    if abs(y - yl) <= 1.2 and abs(x - xh) <= 9:
                        if mejor is None or abs(x - xh) < mejor[0]:
                            mejor = (abs(x - xh), v)
                if mejor is not None:
                    cuadro.setdefault(f, {}).setdefault(clave, mejor[1])
    return cuadro


def leer_cuadro_simple(textos):
    """Cuadro de una sola columna (sin fases): {'tiros', 'barrenada', 'sin_cargar', 'carguio'} con el
    número que está a la derecha de cada etiqueta, en la misma línea."""
    numeros = [(num(t['texto']), t['x'], t['y']) for t in textos if RE_NUMERO.match(t['texto'])]
    out = {}
    for clave, rx in ETIQUETAS_CUADRO:
        for t in textos:
            if not rx.match(t['texto']):
                continue
            cands = [(x - t['x'], v) for v, x, y in numeros if abs(y - t['y']) <= 1.2 and 0 < x - t['x'] <= 150]
            if cands:
                out.setdefault(clave, min(cands)[1])
    return out


def grupos_de_textos(dxf):
    """Textos del espacio modelo y de cada presentación (lámina) por separado: cada lámina tiene su
    propio cuadro y sus coordenadas pueden coincidir con las de otra."""
    grupos = [('modelo', dxf.textos)]
    for g in sorted(set(t['grupo'] for t in dxf.textos_papel)):
        grupos.append((g, [t for t in dxf.textos_papel if t['grupo'] == g]))
    return grupos


def asignar_fases(paradas, cuadro, avisos):
    """Cada fase del cuadro (n.º de tiros y longitud barrenada) es un grupo de paradas consecutivas del
    plano: busca ese grupo. Devuelve {id(parada): fase} o {} si no se puede."""
    fases = sorted(f for f in cuadro if 'tiros' in cuadro[f] and 'barrenada' in cuadro[f])
    if not fases:
        return {}
    filas = {}
    for t in paradas:
        filas.setdefault(t.get('fila_plano', 0), []).append(t)
    asign = {}
    for f in fases:
        n_f = int(round(cuadro[f]['tiros']))
        L_f = cuadro[f]['barrenada']
        tol = max(TOL_CUADRO, 0.02 * n_f)
        grupos = []
        for fila in filas.values():
            for i in range(len(fila)):
                n, L = 0, 0.0
                for j in range(i, len(fila)):
                    if id(fila[j]) in asign:
                        break
                    n += len(fila[j]['tiros'])
                    L += sum(longitud_diseno(h) for h in fila[j]['tiros'])
                    if n > n_f:
                        break
                    if n == n_f and abs(L - L_f) <= tol:
                        grupos.append((abs(L - L_f), fila[i:j + 1]))
        if not grupos:
            avisos.append('La %d° fase del cuadro (%d tiros, %.1f m) no calza con un grupo de paradas '
                          'consecutivas del plano: no se asignan fases.' % (f, n_f, L_f))
            return {}
        grupos.sort(key=lambda g: g[0])
        if len(grupos) > 1 and grupos[1][0] - grupos[0][0] < 0.05:
            avisos.append('La %d° fase del cuadro calza con más de un grupo de paradas: no se asignan fases.' % f)
            return {}
        for t in grupos[0][1]:
            asign[id(t)] = f
    return asign


def resumen_grupo(grupo):
    """Totales de un grupo de paradas con la misma regla del cuadro del plano: la barrenada incluye
    todos los tiros; sin cargar y carguío, sólo los tiros que se cargan."""
    r = {'paradas': len(grupo), 'tiros': 0, 'tiros_carga': 0, 'barrenada': 0.0, 'sin_cargar': 0.0, 'carguio': 0.0}
    for t in grupo:
        for h in t['tiros']:
            L = longitud_diseno(h)
            r['tiros'] += 1
            r['barrenada'] += L
            if t['cargada']:
                taco = taco_dibujado(h) or 0.0
                r['tiros_carga'] += 1
                r['sin_cargar'] += taco
                r['carguio'] += L - taco
    return r


def comparar(r, c):
    """Compara un resumen con la columna del cuadro: lista de (campo, valor, cuadro, ok)."""
    out = []
    for campo in ('tiros', 'barrenada', 'sin_cargar', 'carguio'):
        if campo not in c:
            continue
        v = r[campo]
        ok = (v == int(round(c[campo]))) if campo == 'tiros' else abs(v - c[campo]) <= TOL_CUADRO
        out.append((campo, v, c[campo], ok))
    return out


def info_plano(dxf, paradas, avisos):
    """Notas de carga, fases del cuadro y verificación. Marca en cada parada: clave, cargada,
    nota_carga, fase, fase_txt. Devuelve {'cuadro', 'cuadro_sin_fase', 'lamina', 'no_carga'}."""
    grupos = grupos_de_textos(dxf)
    todos = dxf.textos + dxf.textos_papel
    no_carga = notas_no_carga(todos)
    for t in paradas:
        t['clave'] = canon(t['nombre'])
        t['nota_carga'] = no_carga.get(t['clave'])
        t['cargada'] = t['nota_carga'] is None
    # cuadro por fases: el de la lámina cuyas fases calzan con los perfiles
    cuadro, fases, lamina, avisos_cuadro = {}, {}, None, []
    for nombre, ts in grupos:
        c = leer_cuadro_fases(ts)
        if not c:
            continue
        av = []
        f = asignar_fases(paradas, c, av)
        if f:
            cuadro, fases, lamina = c, f, nombre
            break
        if not avisos_cuadro:
            cuadro, avisos_cuadro = c, av
    if not fases:
        avisos.extend(avisos_cuadro)
    complementario = any('COMPLEMENTARI' in s['texto'].upper() and 'ESPECIAL' in s['texto'].upper() for s in todos)
    for t in paradas:
        t['fase'] = fases.get(id(t))
        if t['fase']:
            t['fase_txt'] = '%d° fase' % t['fase']
        elif complementario and 'ESPECIAL' in t['texto'].upper():
            t['fase_txt'] = 'Complementario'
        else:
            t['fase_txt'] = ''
    # cuadro de una sola columna (otra lámina) para las paradas sin fase, si calza con ellas
    cuadro_sin_fase = {}
    sin_fase = [t for t in paradas if not t['fase']]
    if sin_fase:
        r = resumen_grupo(sin_fase)
        for nombre, ts in grupos:
            if leer_cuadro_fases(ts):
                continue
            s = leer_cuadro_simple(ts)
            if 'tiros' in s and 'barrenada' in s and int(round(s['tiros'])) == r['tiros'] \
                    and abs(s['barrenada'] - r['barrenada']) <= max(TOL_CUADRO, 0.02 * r['tiros']):
                cuadro_sin_fase = s
                break
    return {'cuadro': cuadro if fases else {}, 'cuadro_sin_fase': cuadro_sin_fase, 'lamina': lamina,
            'no_carga': no_carga}


def grupos_por_fase(paradas, info):
    """Grupos consecutivos de paradas con la misma fase (en el orden dado) con su resumen y la columna
    del cuadro del plano que les corresponde: [{'nombre', 'fase', 'grupo', 'r', 'c'}]."""
    grupos = []
    for t in paradas:
        if not grupos or grupos[-1]['nombre'] != (t['fase_txt'] or '(sin fase)'):
            grupos.append({'nombre': t['fase_txt'] or '(sin fase)', 'fase': t['fase'], 'grupo': []})
        grupos[-1]['grupo'].append(t)
    for g in grupos:
        g['r'] = resumen_grupo(g['grupo'])
        if g['fase']:
            g['c'] = info['cuadro'].get(g['fase'], {})
        elif info['cuadro_sin_fase'] and len(g['grupo']) == len([t for t in paradas if not t['fase']]):
            g['c'] = info['cuadro_sin_fase']
        else:
            g['c'] = {}
    return grupos


def ordenar_para_planilla(paradas, orden='fase', fase_primero=None):
    """Orden de las paradas en la planilla."""
    if orden == 'plano':
        return list(paradas)
    fases = sorted(set(t['fase'] for t in paradas if t.get('fase')))
    if fase_primero in fases:
        fases.remove(fase_primero)
        fases.insert(0, fase_primero)
    grupos = [[t for t in paradas if t.get('fase') == f] for f in fases]
    grupos.append([t for t in paradas if not t.get('fase')])
    out = []
    for g in grupos:
        out += [t for t in g if t['cargada']] + [t for t in g if not t['cargada']]
    return out


def seleccionar_paradas(paradas, texto):
    """'10, AuxHW, 11' -> paradas del plano en ese orden (acepta P10, Aux HW, cuña hw, PE-30...)."""
    por_clave = dict((t['clave'], t) for t in paradas)
    elegidas = []
    for tok in re.split(r'[,;]+', texto):
        tok = tok.strip()
        if not tok:
            continue
        t = por_clave.get(canon(tok))
        if t is None:
            raise SystemExit('La parada "%s" no está en el plano. Disponibles: %s'
                             % (tok, ', '.join(nombre_en_planilla(t['nombre']) for t in paradas)))
        if t not in elegidas:
            elegidas.append(t)
    return elegidas


def taco_planilla(t, h, modo):
    """Valor de la columna Taco: el taco del plano; para paradas que no se cargan (sin taco en el plano),
    0 por omisión, vacío o la longitud completa según `modo`."""
    if not t['cargada']:
        if modo == 'largo':
            return longitud_diseno(h)
        return 0.0 if modo == 'cero' else None
    return taco_dibujado(h)


def entradas_planilla(paradas, modo_taco, avisos):
    """Filas a escribir en la planilla, en orden: dict(clave, etiqueta, tiro, largo, taco, nota). Sólo datos
    de los perfiles: nombre de la parada, n.º de tiro, longitud rotulada y taco."""
    out = []
    for t in paradas:
        etiqueta = nombre_en_planilla(t['nombre'])
        for i, (n, h) in enumerate(numerar_tiros(t, avisos)):
            taco = taco_planilla(t, h, modo_taco)
            if t['cargada'] and taco is None:
                avisos.append('%s tiro %d: no tiene taco dibujado; se deja la celda Taco vacía.' % (etiqueta, n))
            out.append({'clave': (t['clave'], n), 'etiqueta': etiqueta, 'tiro': n,
                        'largo': longitud_diseno(h), 'taco': taco, 'nota': None})
    return out


# ================================================================ 4. SALIDA TXT (opcional)
def escribir_txt(ruta_dxf, ruta_txt, paradas, info, avisos, coma=False, modo_taco='largo'):
    def f(v, dec=1):
        if v is None:
            return ''
        s = ('%.' + str(dec) + 'f') % v
        return s.replace('.', ',') if coma else s

    n_tiros = sum(len(t['tiros']) for t in paradas)
    lineas = ['PERFILES DE PARADAS - TIROS, LONGITUD Y TACO',
              'Plano   : %s' % os.path.basename(ruta_dxf),
              'Generado: %s' % datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
              'Paradas : %d      Tiros: %d' % (len(paradas), n_tiros),
              'LONGITUD y TACO: valores rotulados en el plano (si falta el rótulo se usa la medida del dibujo).',
              'SIN_CARGAR: taco, o la longitud completa en las paradas que no se cargan.', '']
    cab = ['FASE', 'PARADA', 'BASCULACION', 'TIRO', 'INCLINACION', 'LADO', 'LONGITUD_m', 'TACO_m',
           'SIN_CARGAR_m', 'CARGA_m', 'SE_CARGA', 'LONG_MED_m', 'TACO_MED_m', 'OBS']
    lineas.append('\t'.join(cab))
    for t in paradas:
        for n, h in numerar_tiros(t, []):
            L = longitud_diseno(h)
            taco = taco_dibujado(h)
            sinc = taco if t['cargada'] else L
            obs = list(h['obs'])
            if not t['cargada']:
                obs.insert(0, 'no se carga (%s)' % nota_corta(t['nota_carga']))
            fila = [t['fase_txt'], nombre_en_planilla(t['nombre']), t['basc'], str(n), f(inclinacion(h), 0) + '°',
                    lado_tiro(t, h), f(L, 1), f(taco, 1), f(sinc, 1), f(L - (sinc or 0.0), 1),
                    'Si' if t['cargada'] else 'No', f(h['L_med'], 2), f(h['taco_med'], 2), '; '.join(obs)]
            lineas.append('\t'.join(fila))
    grupos = grupos_por_fase(paradas, info)
    lineas += ['', 'RESUMEN POR FASE Y VERIFICACION CONTRA EL CUADRO DEL PLANO',
               '\t'.join(['FASE', 'PARADAS', 'TIROS', 'CUADRO', 'BARRENADA_m', 'CUADRO', 'SIN_CARGAR_m', 'CUADRO',
                          'CARGUIO_m', 'CUADRO', 'VERIFICACION'])]
    for g in grupos:
        r, c = g['r'], g['c']
        comp = comparar(r, c) if c else []
        verif = ('OK' if all(ok for _, _, _, ok in comp) else 'DIFERENCIA') if comp else 'sin cuadro'
        lineas.append('\t'.join([g['nombre'], ', '.join(nombre_en_planilla(t['nombre']) for t in g['grupo']),
                                 str(r['tiros']), f(c.get('tiros'), 0), f(r['barrenada']), f(c.get('barrenada')),
                                 f(r['sin_cargar']), f(c.get('sin_cargar')), f(r['carguio']), f(c.get('carguio')), verif]))
    if avisos:
        lineas += ['', 'AVISOS'] + ['- ' + a for a in avisos]
    with open(ruta_txt, 'w', encoding='utf-8-sig', newline='\r\n') as fh:
        fh.write('\n'.join(lineas) + '\n')
    return len(paradas), n_tiros


def imprimir_detalle(paradas):
    for t in paradas:
        decir('\n== %s   (%d pivote(s), %d tiro(s))' % (t['texto'], len(t['pivotes']), len(t['tiros'])))
        for h in sorted(t['tiros'], key=clave_tiro):
            r = h['rotulo']
            decir('  tiro %-4s inc %5.1f %-3s collar %5.2f fondo %5.2f  L %5.2f  taco %5.2f  carga %5.2f  rotulo: %s  taco n: %s  %s'
                  % (h['numero'], h['inc_med'], h['lado'], h['collar'], h['fondo'], h['L_med'], h['taco_med'],
                     h['carga_med'], (r['t']['texto'] if r else '-'), h['taco_rot'], '; '.join(h['obs'])))
            for z in sorted(h['tramos'], key=lambda z: z['a']):
                s = z['seg']
                decir('        %-8s %6.2f -> %6.2f  color %d  %-10s capa %s (%s)' %
                      (z['clase'], z['a'], z['b'], s['color'], s['lt'], s['capa'], s['tipo']))


# ================================================================ 5. PLANILLA EXCEL (edición del XML)
RE_SI = re.compile(r'<si>(.*?)</si>', re.S)
RE_T = re.compile(r'<t(?:\s[^>]*)?>(.*?)</t>', re.S)
RE_ROW = re.compile(r'<row r="(\d+)"[^>]*?(?:/>|>.*?</row>)', re.S)
RE_CELDA = re.compile(r'<c r="([A-Z]+)(\d+)"((?:\s[^>]*?)?)(?:/>|>(.*?)</c>)', re.S)
RE_V = re.compile(r'<v>(.*?)</v>', re.S)
RE_IS = re.compile(r'<is>.*?<t(?:\s[^>]*)?>(.*?)</t>.*?</is>', re.S)
RE_F = re.compile(r'<f(\s[^>/]*)?>(.*?)</f>|<f(\s[^>]*)?/>', re.S)
RE_STR = re.compile(r'"(?:[^"]|"")*"')
# referencia A1 (con hoja opcional, $ opcionales y rango opcional) dentro de una fórmula
RE_REF = re.compile(
    r"(?P<sheet>(?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!)?"
    r"(?<![A-Za-z0-9_.])(?P<a1>\$?)(?P<c1>[A-Z]{1,3})(?P<a2>\$?)(?P<r1>\d+)"
    r"(?::(?P<a3>\$?)(?P<c2>[A-Z]{1,3})(?P<a4>\$?)(?P<r2>\d+))?(?![A-Za-z0-9_(])")
TIPO_HOJA = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'
CT_HOJA = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'


def col_a_num(col):
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n


def num_a_col(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def desescapar(s):
    return (s.replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
             .replace('&apos;', "'").replace('&amp;', '&'))


def fmt_num(v):
    s = '%.4f' % float(v)
    s = s.rstrip('0').rstrip('.')
    return s if s not in ('', '-0') else '0'


def a_float(v):
    if isinstance(v, float):
        return v
    try:
        return num(v)
    except (TypeError, ValueError):
        return None


class _HojaXML(object):
    """Hoja nueva escrita desde cero (para la hoja "Perfiles DXF")."""

    def __init__(self):
        self.filas = []
        self.altos = {}
        self.uniones = []

    def agregar(self, celdas=(), alto=None, unir_hasta=None):
        self.filas.append(list(celdas))
        r = len(self.filas)
        if alto:
            self.altos[r] = alto
        if unir_hasta:
            self.uniones.append('A%d:%s%d' % (r, unir_hasta, r))
        return r

    def xml(self, anchos, congelar=None):
        ncol = max([len(f) for f in self.filas] + [len(anchos), 1])
        p = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n',
             '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
             '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>',
             '<dimension ref="A1:%s%d"/>' % (num_a_col(ncol), max(len(self.filas), 1))]
        if congelar:
            p.append('<sheetViews><sheetView workbookViewId="0"><pane ySplit="%d" topLeftCell="A%d" '
                     'activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A%d" '
                     'sqref="A%d"/></sheetView></sheetViews>' % (congelar, congelar + 1, congelar + 1, congelar + 1))
        else:
            p.append('<sheetViews><sheetView workbookViewId="0"/></sheetViews>')
        p.append('<sheetFormatPr defaultRowHeight="15"/>')
        p.append('<cols>' + ''.join('<col min="%d" max="%d" width="%s" customWidth="1"/>' % (i + 1, i + 1, w)
                                    for i, w in enumerate(anchos)) + '</cols>')
        p.append('<sheetData>')
        for r, fila in enumerate(self.filas, 1):
            celdas = []
            for c, (v, s) in enumerate(fila, 1):
                if v is None and s is None:
                    continue
                ref = '%s%d' % (num_a_col(c), r)
                sa = (' s="%d"' % s) if s is not None else ''
                if v is None or v == '':
                    celdas.append('<c r="%s"%s/>' % (ref, sa))
                elif isinstance(v, (int, float)) and not isinstance(v, bool):
                    celdas.append('<c r="%s"%s><v>%s</v></c>' % (ref, sa, fmt_num(v)))
                else:
                    celdas.append('<c r="%s"%s t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>'
                                  % (ref, sa, xml_escape(str(v))))
            ht = (' ht="%s" customHeight="1"' % self.altos[r]) if r in self.altos else ''
            if celdas or ht:
                p.append('<row r="%d"%s>%s</row>' % (r, ht, ''.join(celdas)))
        p.append('</sheetData>')
        if self.uniones:
            p.append('<mergeCells count="%d">%s</mergeCells>'
                     % (len(self.uniones), ''.join('<mergeCell ref="%s"/>' % m for m in self.uniones)))
        p.append('<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>')
        p.append('<pageSetup orientation="landscape" fitToHeight="0"/>')
        p.append('</worksheet>')
        return ''.join(p)


class Planilla(object):
    """Planilla .xlsx: localiza la hoja y la tabla (encabezado PARADA / TIRO / LONG. DISEÑO / Taco)
    y la reescribe tocando sólo el XML necesario."""

    def __init__(self, ruta, hoja=HOJA_PLANILLA):
        self.ruta = ruta
        with zipfile.ZipFile(ruta) as z:
            self.infos = z.infolist()
            self.partes = dict((i.filename, z.read(i.filename)) for i in self.infos)
        self.cadenas = self._cadenas()
        self.hoja, self.parte_hoja = self._buscar_hoja(hoja)
        self.xml = self.partes[self.parte_hoja].decode('utf-8')
        self.filas_insertadas = 0
        self.movidas = 0
        self.cambios = []
        self.huerfanas = []
        self.descartadas = []
        self._localizar_tabla()

    # --- utilidades de lectura
    def _cadenas(self):
        xml = self.partes.get('xl/sharedStrings.xml')
        if not xml:
            return []
        out = []
        for m in RE_SI.finditer(xml.decode('utf-8')):
            out.append(desescapar(''.join(RE_T.findall(m.group(1)))))
        return out

    def _hojas(self):
        """[(nombre, parte, rId, sheetId)] en el orden del libro."""
        wb = self.partes['xl/workbook.xml'].decode('utf-8')
        rels = self.partes['xl/_rels/workbook.xml.rels'].decode('utf-8')
        destinos = {}
        for m in re.finditer(r'<Relationship\b[^>]*>', rels):
            mi, mt = re.search(r'\bId="([^"]+)"', m.group(0)), re.search(r'\bTarget="([^"]+)"', m.group(0))
            if mi and mt:
                destinos[mi.group(1)] = mt.group(1)
        hojas = []
        for m in re.finditer(r'<sheet\b[^>]*/>', wb):
            mn = re.search(r'\bname="([^"]+)"', m.group(0))
            mr = re.search(r'\b\w+:id="([^"]+)"', m.group(0))
            ms = re.search(r'\bsheetId="(\d+)"', m.group(0))
            if not (mn and mr):
                continue
            destino = destinos.get(mr.group(1), '').lstrip('/')
            if not destino.startswith('xl/'):
                destino = 'xl/' + destino
            hojas.append((desescapar(mn.group(1)), destino, mr.group(1), int(ms.group(1)) if ms else 0))
        return hojas

    def _buscar_hoja(self, hoja):
        hojas = self._hojas()
        for nombre, parte, rid, sid in hojas:
            if nombre.strip().upper() == hoja.strip().upper() and parte in self.partes:
                return nombre, parte
        for nombre, parte, rid, sid in hojas:          # cualquier hoja con el encabezado PARADA
            xml = self.partes.get(parte, b'').decode('utf-8')
            if self._celdas_con_texto(xml, 'PARADA'):
                return nombre, parte
        raise SystemExit('No encuentro en la planilla una hoja con el encabezado "PARADA" (hojas: %s).'
                         % ', '.join(h[0] for h in hojas))

    def valor_celda(self, attrs, interior):
        """Texto o número de una celda ya dividida por RE_CELDA."""
        if interior is None:
            return None
        mt = re.search(r'\st="([^"]+)"', attrs)
        tipo = mt.group(1) if mt else None
        if tipo == 's':
            mv = RE_V.search(interior)
            try:
                return self.cadenas[int(mv.group(1))]
            except (AttributeError, ValueError, IndexError):
                return None
        if tipo == 'inlineStr':
            mi = RE_IS.search(interior)
            return desescapar(mi.group(1)) if mi else ''
        mv = RE_V.search(interior)
        if not mv:
            return None
        if tipo in ('str', 'e'):
            return desescapar(mv.group(1))
        try:
            return float(mv.group(1))
        except ValueError:
            return mv.group(1)

    def _celdas_con_texto(self, xml, texto):
        out = []
        for m in RE_CELDA.finditer(xml):
            v = self.valor_celda(m.group(3), m.group(4))
            if isinstance(v, str) and v.strip().upper() == texto:
                out.append((int(m.group(2)), m.group(1)))
        return out

    def _fila(self, n):
        return re.search(r'<row r="%d"[^>]*?(?:/>|>.*?</row>)' % n, self.xml, re.S)

    def _celdas_fila(self, n):
        m = self._fila(n)
        if not m:
            return {}
        out = {}
        for c in RE_CELDA.finditer(m.group(0)):
            out[c.group(1)] = (c.group(3), c.group(4))
        return out

    def _merges(self):
        return [(col_a_num(m.group(1)), int(m.group(2)), col_a_num(m.group(3)), int(m.group(4)))
                for m in re.finditer(r'<mergeCell ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"', self.xml)]

    @staticmethod
    def _estilo_de(celda):
        if not celda:
            return None
        m = re.search(r'\ss="(\d+)"', celda[0])
        return m.group(1) if m else None

    @staticmethod
    def _estilo_xml(cell_xml):
        if not cell_xml:
            return None
        m = re.match(r'<c r="[A-Z]+\d+"([^>]*?)/?>', cell_xml)
        if not m:
            return None
        ms = re.search(r'\ss="(\d+)"', m.group(1))
        return ms.group(1) if ms else None

    # --- tabla
    def _localizar_tabla(self):
        enc = self._celdas_con_texto(self.xml, 'PARADA')
        if not enc:
            raise SystemExit('La hoja "%s" no tiene el encabezado "PARADA".' % self.hoja)
        self.fila_enc, col_parada = enc[0]
        celdas_enc = self._celdas_fila(self.fila_enc)
        self.col = {'parada': col_parada, 'tiro': None, 'long': None, 'taco': None}
        for col, (attrs, interior) in celdas_enc.items():
            v = self.valor_celda(attrs, interior)
            if not isinstance(v, str):
                continue
            u = v.strip().upper()
            if u == 'TIRO':
                self.col['tiro'] = col
            elif u.startswith('LONG') and ('DISE' in u):
                self.col['long'] = col
            elif u == 'TACO':
                self.col['taco'] = col
        faltan = [k for k, v in self.col.items() if v is None]
        if faltan:
            raise SystemExit('En la fila %d de la hoja "%s" no encuentro las columnas: %s'
                             % (self.fila_enc, self.hoja, ', '.join(faltan)))
        # filas de datos: las que siguen al encabezado mientras la columna de la izquierda de PARADA
        # (el correlativo) tenga un número; si no hay correlativo, mientras exista la celda TIRO
        col_num = num_a_col(col_a_num(self.col['parada']) - 1) if col_a_num(self.col['parada']) > 1 else None
        self.filas = []
        n = self.fila_enc + 1
        primera = self._celdas_fila(n)
        usar_correlativo = bool(col_num and col_num in primera
                                and isinstance(self.valor_celda(*primera[col_num]), float))
        self.col_num = col_num if usar_correlativo else None
        self.estilo_num = self._estilo_de(primera.get(col_num)) if usar_correlativo else None
        while True:
            celdas = self._celdas_fila(n)
            if not celdas:
                break
            if usar_correlativo:
                if col_num not in celdas or not isinstance(self.valor_celda(*celdas[col_num]), float):
                    break
            elif self.col['tiro'] not in celdas:
                break
            self.filas.append(n)
            n += 1
        if not self.filas:
            raise SystemExit('No encuentro filas de datos bajo el encabezado (fila %d).' % self.fila_enc)
        # estilos: la primera fila de datos es siempre inicio de parada
        primera = self._celdas_fila(self.filas[0])
        self.estilo = {}
        for k, col in self.col.items():
            self.estilo[k] = self._estilo_de(primera.get(col))
        estilos_b = {}
        for n in self.filas[1:]:
            s = self._estilo_de(self._celdas_fila(n).get(self.col['parada']))
            if s is not None and s != self.estilo['parada']:
                estilos_b[s] = estilos_b.get(s, 0) + 1
        self.estilo_parada_resto = max(estilos_b, key=estilos_b.get) if estilos_b else self.estilo['parada']
        # columnas de la tabla: desde el correlativo (o PARADA) hasta el último encabezado contiguo
        ini = col_a_num(self.col_num) if self.col_num else col_a_num(self.col['parada'])
        fin = col_a_num(self.col['parada'])
        merges = self._merges()
        c = fin + 1
        while True:
            col = num_a_col(c)
            v = self.valor_celda(*celdas_enc[col]) if col in celdas_enc else None
            lleno = v is not None and not (isinstance(v, str) and not v.strip())
            if not lleno:
                lleno = any(c1 < c <= c2 and r1 <= self.fila_enc <= r2 for (c1, r1, c2, r2) in merges)
            if not lleno:
                break
            fin = c
            c += 1
        fin = max([fin] + [col_a_num(v) for v in self.col.values()])
        self.span = (ini, fin)

    def fase_planilla(self):
        """Fase indicada en el encabezado de la planilla (celda "Fase" y el número a su derecha)."""
        for n in range(1, self.fila_enc):
            items = sorted(self._celdas_fila(n).items(), key=lambda kv: col_a_num(kv[0]))
            for i, (col, (attrs, interior)) in enumerate(items):
                v = self.valor_celda(attrs, interior)
                if isinstance(v, str) and v.strip().upper() == 'FASE':
                    for col2, (a2, i2) in items[i + 1:i + 4]:
                        v2 = self.valor_celda(a2, i2)
                        if isinstance(v2, float):
                            return int(v2)
                        if isinstance(v2, str) and re.match(r'^\s*\d+', v2):
                            return int(re.match(r'^\s*(\d+)', v2).group(1))
        return None

    # --- desplazamiento de referencias (para insertar y mover filas sin romper fórmulas ni rangos)
    def _desplazar_formula(self, formula, fn, solo_calificadas=False):
        """Aplica fn(col, col_abs, fila, fila_abs) -> (col, fila) a cada referencia A1 de la fórmula.
        Las referencias a otras hojas no se tocan; los literales entre comillas tampoco."""
        hoja = self.hoja.upper()

        def rep(m):
            sheet = m.group('sheet')
            if sheet:
                nombre = sheet[:-1]
                if nombre.startswith("'"):
                    nombre = nombre[1:-1].replace("''", "'")
                if nombre.upper() != hoja:
                    return m.group(0)
            elif solo_calificadas:
                return m.group(0)
            c1, r1 = fn(col_a_num(m.group('c1')), bool(m.group('a1')), int(m.group('r1')), bool(m.group('a2')))
            out = (sheet or '') + m.group('a1') + num_a_col(c1) + m.group('a2') + str(r1)
            if m.group('c2'):
                c2, r2 = fn(col_a_num(m.group('c2')), bool(m.group('a3')), int(m.group('r2')), bool(m.group('a4')))
                out += ':' + m.group('a3') + num_a_col(c2) + m.group('a4') + str(r2)
            return out

        partes, pos = [], 0
        for ms in RE_STR.finditer(formula):
            partes.append(RE_REF.sub(rep, formula[pos:ms.start()]))
            partes.append(ms.group(0))
            pos = ms.end()
        partes.append(RE_REF.sub(rep, formula[pos:]))
        return ''.join(partes)

    def _desplazar_rangos(self, texto, fn):
        """'A1:B2 C3' -> cada rango desplazado."""
        return ' '.join(self._desplazar_formula(tok, fn) for tok in texto.split())

    def _desplazar_f_en(self, xml, fn, solo_calificadas=False):
        """Desplaza las fórmulas <f> (texto y atributo ref) de un trozo de XML."""
        def rep(m):
            if m.group(2) is None:
                return m.group(0)
            attrs = m.group(1) or ''
            attrs = re.sub(r'\sref="([^"]*)"', lambda a: ' ref="%s"' % self._desplazar_rangos(a.group(1), fn), attrs)
            return '<f%s>%s</f>' % (attrs, self._desplazar_formula(m.group(2), fn, solo_calificadas))
        return RE_F.sub(rep, xml)

    def _desplazar_fuera(self, xml, fn):
        """Rangos de atributos (ref, sqref...), fórmulas de validaciones/formato condicional y saltos de página."""
        xml = re.sub(r'\b(ref|sqref|activeCell|topLeftCell)="([^"]*)"',
                     lambda m: '%s="%s"' % (m.group(1), self._desplazar_rangos(m.group(2), fn)), xml)
        xml = re.sub(r'<(formula1|formula2|formula|xm:f|xm:sqref)>(.*?)</\1>',
                     lambda m: '<%s>%s</%s>' % (m.group(1), self._desplazar_formula(m.group(2), fn), m.group(1)),
                     xml, flags=re.S)
        xml = re.sub(r'<brk id="(\d+)"', lambda m: '<brk id="%d"' % fn(1, False, int(m.group(1)), False)[1], xml)
        return xml

    def _descompartir(self):
        """Convierte las fórmulas compartidas (t="shared") en fórmulas normales, celda a celda."""
        maestras = {}
        for m in RE_CELDA.finditer(self.xml):
            interior = m.group(4)
            if not interior or 't="shared"' not in interior:
                continue
            mf = re.search(r'<f\s([^>]*)>(.*?)</f>', interior, re.S)
            if mf and 'ref="' in mf.group(1):
                msi = re.search(r'si="(\d+)"', mf.group(1))
                if msi:
                    maestras[msi.group(1)] = (col_a_num(m.group(1)), int(m.group(2)), mf.group(2))

        def rep(m):
            interior = m.group(4)
            if not interior or 't="shared"' not in interior:
                return m.group(0)
            col, fila = col_a_num(m.group(1)), int(m.group(2))

            def repf(mf):
                attrs = mf.group(1) or mf.group(3) or ''
                if 't="shared"' not in attrs:
                    return mf.group(0)
                texto = mf.group(2)
                if not texto:                                     # celda seguidora
                    msi = re.search(r'si="(\d+)"', attrs)
                    if not msi or msi.group(1) not in maestras:
                        return mf.group(0)
                    mcol, mfila, mtexto = maestras[msi.group(1)]
                    dcol, dfila = col - mcol, fila - mfila
                    texto = self._desplazar_formula(
                        mtexto, lambda c, ca, r, ra: (c if ca else c + dcol, r if ra else r + dfila))
                attrs = re.sub(r'\s(t|ref|si)="[^"]*"', '', attrs)
                return '<f%s>%s</f>' % (attrs, texto)

            nuevo = RE_F.sub(repf, interior)
            ini, fin = m.start(4) - m.start(), m.end(4) - m.start()
            return m.group(0)[:ini] + nuevo + m.group(0)[fin:]

        self.xml = RE_CELDA.sub(rep, self.xml)

    def _clonar_fila(self, plantilla, origen, destino):
        """Copia de una fila de la tabla (formatos y fórmulas) para la fila `destino`, sin valores."""
        d = destino - origen
        fn = lambda c, ca, r, ra: (c, r if ra else r + d)
        xml_fila = re.sub(r'^<row r="%d"' % origen, '<row r="%d"' % destino, plantilla)

        def rep(m):
            col, attrs, interior = m.group(1), m.group(3), m.group(4)
            attrs = re.sub(r'\st="[^"]*"', '', attrs)
            ref = '%s%d' % (col, destino)
            if col == self.col_num:                       # correlativo de la tabla
                return '<c r="%s"%s><v>%d</v></c>' % (ref, attrs, destino - self.fila_enc)
            if interior is None or '<f' not in interior:
                return '<c r="%s"%s/>' % (ref, attrs)
            interior = self._desplazar_f_en(interior, fn)
            interior = re.sub(r'<v>.*?</v>|<v/>', '', interior, flags=re.S)
            return '<c r="%s"%s>%s</c>' % (ref, attrs, interior)

        return RE_CELDA.sub(rep, xml_fila)

    def _mover_fila(self, xml_fila, n, nuevo, fn):
        xml_fila = re.sub(r'^<row r="%d"' % n, '<row r="%d"' % nuevo, xml_fila)
        xml_fila = re.sub(r'<c r="([A-Z]+)%d"' % n, lambda m: '<c r="%s%d"' % (m.group(1), nuevo), xml_fila)
        return self._desplazar_f_en(xml_fila, fn)

    def insertar_filas(self, r0, n_filas):
        """Inserta n_filas filas ANTES de la fila r0 (como Excel): todo lo que está en r0 o más abajo baja,
        las fórmulas y rangos que llegan hasta r0 se extienden y las filas nuevas copian el formato y las
        fórmulas de la fila r0-1."""
        self._descompartir()
        fn_ins = lambda c, ca, r, ra: (c, r + n_filas if r >= r0 else r)
        i, j = self.xml.find('<sheetData>'), self.xml.find('</sheetData>')
        if i < 0 or j < 0:
            raise SystemExit('La hoja "%s" no tiene datos; no puedo insertar filas.' % self.hoja)
        pre, sd, post = self.xml[:i], self.xml[i + len('<sheetData>'):j], self.xml[j + len('</sheetData>'):]
        filas, plantilla = [], None
        for m in RE_ROW.finditer(sd):
            n = int(m.group(1))
            filas.append((n, m.group(0)))
            if n == r0 - 1:
                plantilla = m.group(0)
        if plantilla is None:
            raise SystemExit('No encuentro la fila %d de la hoja "%s" para copiar su formato.' % (r0 - 1, self.hoja))
        nuevas = [self._clonar_fila(plantilla, r0 - 1, r0 + k) for k in range(n_filas)]
        out, puestas = [], False
        for n, xml_fila in filas:
            if n >= r0:
                if not puestas:
                    out.extend(nuevas)
                    puestas = True
                xml_fila = self._mover_fila(xml_fila, n, n + n_filas, fn_ins)
            else:
                xml_fila = self._desplazar_f_en(xml_fila, fn_ins)
            out.append(xml_fila)
        if not puestas:
            out.extend(nuevas)
        post = self._desplazar_fuera(post, fn_ins)
        # impresión: con "ajustar a 1 página" la tabla larga quedaría ilegible -> 1 página de ancho
        if re.search(r'<pageSetUpPr\b[^>]*fitToPage="1"', pre):
            post = re.sub(r'<pageSetup\b([^>]*?)/>',
                          lambda m: '<pageSetup%s fitToHeight="0"/>' % re.sub(r'\sfitToHeight="\d+"', '', m.group(1)),
                          post, count=1)
        self.xml = self._desplazar_fuera(pre, fn_ins) + '<sheetData>' + ''.join(out) + '</sheetData>' + post
        self.partes[self.parte_hoja] = self.xml.encode('utf-8')
        # nombres definidos del libro (área de impresión, filtro...) que apuntan a esta hoja
        wb = self.partes['xl/workbook.xml'].decode('utf-8')
        wb = re.sub(r'(<definedName[^>]*>)(.*?)(</definedName>)',
                    lambda m: m.group(1) + self._desplazar_formula(m.group(2), fn_ins, True) + m.group(3), wb, flags=re.S)
        self.partes['xl/workbook.xml'] = wb.encode('utf-8')
        # fórmulas de otras hojas que apunten a esta
        for nombre in list(self.partes):
            if nombre.startswith('xl/worksheets/') and nombre.endswith('.xml') and nombre != self.parte_hoja:
                xml = self.partes[nombre].decode('utf-8')
                if self.hoja.upper() + '!' in xml.upper():
                    self.partes[nombre] = self._desplazar_f_en(xml, fn_ins, True).encode('utf-8')
        # anclas de dibujos (logos, imágenes) de esta hoja
        rels = self.partes.get(self.parte_hoja.replace('worksheets/', 'worksheets/_rels/') + '.rels')
        if rels:
            for m in re.finditer(r'<Relationship [^>]*?Target="([^"]+)"[^>]*?/>', rels.decode('utf-8')):
                if 'drawing' not in m.group(0) or 'legacy' in m.group(0).lower():
                    continue
                parte = 'xl/' + m.group(1).replace('../', '').lstrip('/')
                if parte in self.partes:
                    dx = self.partes[parte].decode('utf-8')
                    dx = re.sub(r'<xdr:row>(\d+)</xdr:row>',
                                lambda a: '<xdr:row>%d</xdr:row>' % (int(a.group(1)) + n_filas if int(a.group(1)) + 1 >= r0 else int(a.group(1))), dx)
                    self.partes[parte] = dx.encode('utf-8')
        # la cadena de cálculo ya no corresponde: se elimina y Excel la reconstruye
        self._quitar_calcchain()
        self.filas_insertadas += n_filas
        self._localizar_tabla()

    def _quitar_calcchain(self):
        if 'xl/calcChain.xml' not in self.partes:
            return
        del self.partes['xl/calcChain.xml']
        self.infos = [k for k in self.infos if k.filename != 'xl/calcChain.xml']
        r = self.partes['xl/_rels/workbook.xml.rels'].decode('utf-8')
        r = re.sub(r'<Relationship [^>]*?Target="calcChain.xml"[^>]*?/>', '', r)
        self.partes['xl/_rels/workbook.xml.rels'] = r.encode('utf-8')
        ct = self.partes['[Content_Types].xml'].decode('utf-8')
        ct = re.sub(r'<Override [^>]*?PartName="/xl/calcChain.xml"[^>]*?/>', '', ct)
        self.partes['[Content_Types].xml'] = ct.encode('utf-8')

    # --- escritura de celdas
    def _celda_xml(self, col, fila, estilo, valor):
        ref = '%s%d' % (col, fila)
        sattr = (' s="%s"' % estilo) if estilo is not None else ''
        if valor is None or valor == '':
            return '<c r="%s"%s/>' % (ref, sattr)
        if isinstance(valor, str):
            return '<c r="%s"%s t="inlineStr"><is><t>%s</t></is></c>' % (ref, sattr, xml_escape(valor))
        return '<c r="%s"%s><v>%s</v></c>' % (ref, sattr, fmt_num(valor))

    def _mover_celda(self, cell_xml, origen, destino):
        """La celda de la fila `origen` llevada a la fila `destino` (las referencias relativas a filas de sus
        fórmulas se corren igual que al copiar y pegar en Excel)."""
        m = RE_CELDA.match(cell_xml)
        col, attrs, interior = m.group(1), m.group(3), m.group(4)
        ref = '%s%d' % (col, destino)
        if interior is None:
            return '<c r="%s"%s/>' % (ref, attrs)
        d = destino - origen
        if d and '<f' in interior:
            interior = self._desplazar_f_en(interior, lambda c, ca, r, ra: (c, r if ra else r + d))
        return '<c r="%s"%s>%s</c>' % (ref, attrs, interior)

    def _fila_con(self, row_xml, celdas_span):
        """La fila con las celdas de la tabla reemplazadas y el resto (otras tablas de la hoja) intacto."""
        ini, fin = self.span
        mo = re.match(r'<row\b[^>]*?(/?)>', row_xml)
        apertura = mo.group(0)
        if mo.group(1):
            apertura = apertura[:-2] + '>'
        otras = [(col_a_num(c.group(1)), c.group(0)) for c in RE_CELDA.finditer(row_xml)
                 if not (ini <= col_a_num(c.group(1)) <= fin)]
        todas = sorted(otras + list(celdas_span.items()), key=lambda kv: kv[0])
        return apertura + ''.join(x for k, x in todas) + '</row>'

    def _leer_tabla(self, conocidas):
        """Filas de la tabla con su identidad (parada, n.º de tiro) y si tienen datos de terreno."""
        ini, fin = self.span
        cp, ct, cl, cx = [col_a_num(self.col[k]) for k in ('parada', 'tiro', 'long', 'taco')]
        cn = col_a_num(self.col_num) if self.col_num else None
        out = []
        actual = None
        etiqueta_actual = None
        for n in self.filas:
            m = self._fila(n)
            celdas, vals, formulas = {}, {}, set()
            for c in RE_CELDA.finditer(m.group(0)):
                k = col_a_num(c.group(1))
                if ini <= k <= fin:
                    celdas[k] = c.group(0)
                    vals[k] = self.valor_celda(c.group(3), c.group(4))
                    if c.group(4) and '<f' in c.group(4):
                        formulas.add(k)
            b = vals.get(cp)
            if isinstance(b, float):
                b = str(int(b)) if b == int(b) else str(b)
            nota = None
            if isinstance(b, str) and b.strip():
                if es_etiqueta(b, conocidas):
                    actual, etiqueta_actual = canon(b), b.strip()
                else:
                    nota = b.strip()
            t = vals.get(ct)
            tiro = None
            if isinstance(t, float) and t == int(t):
                tiro = int(t)
            elif isinstance(t, str) and re.match(r'^\s*\d+\s*$', t):
                tiro = int(t)
            datos = bool(nota) or any(v not in (None, '') for k, v in vals.items()
                                      if k not in (cn, cp, ct, cl, cx) and k not in formulas)
            out.append({'n': n, 'celdas': celdas, 'nota': nota, 'datos': datos,
                        'clave': (actual, tiro) if (actual is not None and tiro is not None) else None,
                        'etiqueta': etiqueta_actual, 'largo': vals.get(cl), 'taco': vals.get(cx)})
        return out

    def _planificar(self, entradas, filas):
        claves = set(e['clave'] for e in entradas)
        fuente, huerfanas, descartadas = {}, [], []
        for f in filas:
            k = f['clave']
            if k is not None and k in claves and k not in fuente:
                fuente[k] = f
            elif f['datos']:
                huerfanas.append(f)
            elif k is not None:
                descartadas.append(f)
        plan = [(fuente.get(e['clave']), e) for e in entradas] + [(f, None) for f in huerfanas]
        return plan, huerfanas, descartadas

    def _celdas_vacias(self):
        """Plantilla de fila vacía (formatos y fórmulas, sin valores) a partir de la última fila de la tabla."""
        n = self.filas[-1]
        ini, fin = self.span
        out = {}
        for c in RE_CELDA.finditer(self._fila(n).group(0)):
            k = col_a_num(c.group(1))
            if not (ini <= k <= fin):
                continue
            attrs, interior = c.group(3), c.group(4)
            if interior and '<f' in interior:
                attrs2 = re.sub(r'\st="[^"]*"', '', attrs)
                interior2 = re.sub(r'<v>.*?</v>|<v/>', '', interior, flags=re.S)
                out[k] = ('<c r="%s%d"%s>%s</c>' % (c.group(1), n, attrs2, interior2), n)
            else:
                out[k] = ('<c r="%s%d"%s/>' % (c.group(1), n, re.sub(r'\st="[^"]*"', '', attrs)), n)
        return out

    def _plan_limpio(self, entradas, filas):
        """Tabla limpia: ninguna fila conserva datos; sólo se recuerdan los valores de diseño previos para
        informar diferencias con el plano."""
        self._previos = {}
        for f in filas:
            if f['clave'] is not None and f['clave'] not in self._previos:
                self._previos[f['clave']] = f
        return [(None, e) for e in entradas], [], []

    def reorganizar(self, entradas, conocidas, avisos, conservar=False):
        """Escribe las entradas (en orden) en la tabla.
        conservar=False (normal): la tabla queda SÓLO con PARADA, TIRO, LONG. DISEÑO y Taco de los perfiles; las
        demás columnas de la tabla quedan vacías (con sus fórmulas y formato) para llenarlas en terreno.
        conservar=True: cada fila existente viaja con su tiro (parada + n.º) y conserva sus datos de terreno."""
        if not entradas:
            raise SystemExit('No hay tiros que escribir.')
        self._descompartir()
        self._previos = {}
        ini, fin = self.span
        if any(c1 <= fin and c2 >= ini and r1 <= self.filas[-1] and r2 >= self.filas[0]
               for (c1, r1, c2, r2) in self._merges()):
            avisos.append('La tabla tiene celdas combinadas: se escribe fila por fila sin mover las demás columnas.')
            return self.escribir_en_sitio(entradas)
        planificar = self._planificar if conservar else self._plan_limpio
        filas = self._leer_tabla(conocidas)
        plan, huerfanas, descartadas = planificar(entradas, filas)
        if len(plan) > len(self.filas):
            self.insertar_filas(self.filas[-1], len(plan) - len(self.filas))
            filas = self._leer_tabla(conocidas)
            plan, huerfanas, descartadas = planificar(entradas, filas)
        self.huerfanas, self.descartadas = huerfanas, descartadas
        cp, ct, cl, cx = [col_a_num(self.col[k]) for k in ('parada', 'tiro', 'long', 'taco')]
        cn = col_a_num(self.col_num) if self.col_num else None
        vacia = self._celdas_vacias()
        nuevas = {}
        conservadas = {}
        anterior = None
        for i, n in enumerate(self.filas):
            src, e = plan[i] if i < len(plan) else (None, None)
            if src is not None:
                celdas = dict((k, self._mover_celda(x, src['n'], n)) for k, x in src['celdas'].items())
                if src['n'] != n:
                    self.movidas += 1
            else:
                celdas = dict((k, self._mover_celda(x, fila_pl, n)) for k, (x, fila_pl) in vacia.items())
            if cn:
                celdas[cn] = self._celda_xml(self.col_num, n, self._estilo_xml(celdas.get(cn)) or self.estilo_num, i + 1)

            def poner(k, col, valor, estilo=None):
                est = estilo or self._estilo_xml(celdas.get(k)) or self.estilo.get(
                    {cp: 'parada', ct: 'tiro', cl: 'long', cx: 'taco'}.get(k))
                celdas[k] = self._celda_xml(col, n, est, valor)

            if e is not None:
                inicio = e['clave'][0] != anterior
                anterior = e['clave'][0]
                if inicio:
                    if src is not None and src['nota']:
                        avisos.append('La nota "%s" de %s tiro %d quedó en la primera fila de la parada: '
                                      'se reemplaza por el nombre de la parada.' % (src['nota'], e['etiqueta'], e['tiro']))
                    poner(cp, self.col['parada'], e['etiqueta'], self.estilo['parada'])
                else:
                    nota = src['nota'] if (src is not None and src['nota']) else e['nota']
                    poner(cp, self.col['parada'], nota, self.estilo_parada_resto)
                poner(ct, self.col['tiro'], e['tiro'])
                poner(cl, self.col['long'], e['largo'])
                poner(cx, self.col['taco'], e['taco'])
                previo = src if src is not None else self._previos.get(e['clave'])
                if previo is not None:
                    for nombre, viejo, nuevo in (('LONG. DISEÑO', previo['largo'], e['largo']), ('Taco', previo['taco'], e['taco'])):
                        v = a_float(viejo)
                        if v is not None and (nuevo is None or abs(v - nuevo) > 0.05):
                            self.cambios.append('%s tiro %d: %s %s -> %s' % (e['etiqueta'], e['tiro'], nombre, fmt_num(v),
                                                                              fmt_num(nuevo) if nuevo is not None else 'vacío'))
            elif src is not None:          # fila con datos de terreno que no corresponde a ningún tiro a escribir
                etiqueta = src['etiqueta'] or '(sin parada)'
                if not src['nota'] and src['etiqueta'] and anterior != src['etiqueta']:
                    poner(cp, self.col['parada'], src['etiqueta'], self.estilo['parada'])
                anterior = src['etiqueta']
                conservadas.setdefault(etiqueta, []).append((src['clave'][1] if src['clave'] else '?', n))
            else:                          # fila libre
                anterior = None
                poner(cp, self.col['parada'], None, self.estilo_parada_resto)
                for k, col in ((ct, self.col['tiro']), (cl, self.col['long']), (cx, self.col['taco'])):
                    poner(k, col, None)
            nuevas[n] = celdas

        def rep(m):
            n = int(m.group(1))
            return self._fila_con(m.group(0), nuevas[n]) if n in nuevas else m.group(0)

        self.xml = RE_ROW.sub(rep, self.xml)
        self.partes[self.parte_hoja] = self.xml.encode('utf-8')
        self._recalcular_al_abrir()
        for etiqueta, lista in conservadas.items():
            motivo = ('no está entre las paradas elegidas' if canon(etiqueta) in conocidas else 'no está en el plano')
            avisos.append('%s (%s) tenía datos de terreno: se conserva al final de la tabla, tiros %s en las filas %d-%d.'
                          % (etiqueta, motivo, ', '.join(str(t) for t, n in lista), lista[0][1], lista[-1][1]))
        quitadas = {}
        for f in descartadas:
            quitadas.setdefault(f['etiqueta'], []).append(str(f['clave'][1]))
        for etiqueta, tiros in quitadas.items():
            avisos.append('Se quitaron de la tabla %s tiros %s: %s y no tenían datos de terreno.'
                          % (etiqueta, ', '.join(tiros), 'no están entre las paradas elegidas'
                             if canon(etiqueta) in conocidas else 'no están en el plano'))
        return len(entradas)

    def escribir_en_sitio(self, entradas):
        """Respaldo: escribe las entradas fila por fila, sin mover las demás columnas."""
        if len(entradas) > len(self.filas):
            self.insertar_filas(self.filas[-1], len(entradas) - len(self.filas))
        anterior = None
        nuevas = {}
        for i, n in enumerate(self.filas):
            fila_xml = self._fila(n).group(0)
            if self.col_num:
                fila_xml = self._poner(fila_xml, self.col_num, n, i + 1, self.estilo_num)
            if i < len(entradas):
                e = entradas[i]
                inicio = e['clave'][0] != anterior
                anterior = e['clave'][0]
                fila_xml = self._poner(fila_xml, self.col['parada'], n, e['etiqueta'] if inicio else e['nota'],
                                       self.estilo['parada'],
                                       self.estilo['parada'] if inicio else self.estilo_parada_resto)
                fila_xml = self._poner(fila_xml, self.col['tiro'], n, e['tiro'], self.estilo['tiro'])
                fila_xml = self._poner(fila_xml, self.col['long'], n, e['largo'], self.estilo['long'])
                fila_xml = self._poner(fila_xml, self.col['taco'], n, e['taco'], self.estilo['taco'])
            else:
                fila_xml = self._poner(fila_xml, self.col['parada'], n, None, self.estilo['parada'],
                                       self.estilo_parada_resto)
                for k in ('tiro', 'long', 'taco'):
                    fila_xml = self._poner(fila_xml, self.col[k], n, None, self.estilo[k])
            nuevas[n] = fila_xml
        self.xml = RE_ROW.sub(lambda m: nuevas.get(int(m.group(1)), m.group(0)), self.xml)
        self.partes[self.parte_hoja] = self.xml.encode('utf-8')
        self._recalcular_al_abrir()
        return len(entradas)

    def _poner(self, fila_xml, col, fila, valor, estilo_defecto, estilo_fijo=None):
        """Devuelve la fila con la celda col escrita (reemplazada o insertada en orden)."""
        ncol = col_a_num(col)
        for m in RE_CELDA.finditer(fila_xml):
            if m.group(1) == col:
                estilo = self._estilo_de((m.group(3), None)) if estilo_fijo is None else estilo_fijo
                if estilo is None:
                    estilo = estilo_defecto
                nueva = self._celda_xml(col, fila, estilo, valor)
                return fila_xml[:m.start()] + nueva + fila_xml[m.end():]
        nueva = self._celda_xml(col, fila, estilo_fijo if estilo_fijo is not None else estilo_defecto, valor)
        if fila_xml.endswith('/>'):                       # fila vacía autocerrada
            fila_xml = fila_xml[:-2] + '></row>'
        for m in RE_CELDA.finditer(fila_xml):
            if col_a_num(m.group(1)) > ncol:
                return fila_xml[:m.start()] + nueva + fila_xml[m.start():]
        return fila_xml[:-len('</row>')] + nueva + '</row>'

    def _recalcular_al_abrir(self):
        wb = self.partes['xl/workbook.xml'].decode('utf-8')
        if 'fullCalcOnLoad' not in wb:
            if '<calcPr' in wb:
                wb = wb.replace('<calcPr', '<calcPr fullCalcOnLoad="1"', 1)
            else:
                wb = wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>')
            self.partes['xl/workbook.xml'] = wb.encode('utf-8')

    # --- estilos y hoja nueva
    def _estilos(self):
        """Agrega (o reutiliza) en styles.xml los estilos de la hoja "Perfiles DXF". Devuelve {nombre: índice}."""
        st = self.partes['xl/styles.xml'].decode('utf-8')

        def agregar(st, cont, hijo, elem):
            m = re.search(r'<%s\b([^>]*?)(?:/>|>(.*?)</%s>)' % (cont, cont), st, re.S)
            if not m:
                pos = st.find('>', st.find('<styleSheet')) + 1
                return st[:pos] + '<%s count="1">%s</%s>' % (cont, elem, cont) + st[pos:], 0
            inner = m.group(2) or ''
            hijos = re.findall(r'<%s\b(?:[^>]*?/>|.*?</%s>)' % (hijo, hijo), inner, re.S)
            if elem in hijos:
                return st, hijos.index(elem)
            attrs = re.sub(r'\scount="\d+"', '', m.group(1))
            nuevo = '<%s count="%d"%s>%s%s</%s>' % (cont, len(hijos) + 1, attrs, inner, elem, cont)
            return st[:m.start()] + nuevo + st[m.end():], len(hijos)

        mf = re.search(r'<numFmt numFmtId="(\d+)" formatCode="0\.0"\s*/>', st)
        if mf:
            fmt1 = int(mf.group(1))
        else:
            ids = [int(x) for x in re.findall(r'numFmtId="(\d+)"', st)]
            fmt1 = max([163] + ids) + 1
            st, _ = agregar(st, 'numFmts', 'numFmt', '<numFmt numFmtId="%d" formatCode="0.0"/>' % fmt1)
        fuente = '<font>%s<sz val="%d"/><color rgb="%s"/><name val="Calibri"/><family val="2"/></font>'
        st, f_n = agregar(st, 'fonts', 'font', fuente % ('', 10, 'FF000000'))
        st, f_b = agregar(st, 'fonts', 'font', fuente % ('<b/>', 10, 'FF000000'))
        st, f_t = agregar(st, 'fonts', 'font', fuente % ('<b/>', 14, 'FF1F3864'))
        st, f_ok = agregar(st, 'fonts', 'font', fuente % ('<b/>', 10, 'FF00703C'))
        st, f_mal = agregar(st, 'fonts', 'font', fuente % ('<b/>', 10, 'FFC00000'))
        relleno = '<fill><patternFill patternType="solid"><fgColor rgb="%s"/><bgColor indexed="64"/></patternFill></fill>'
        st, r_cab = agregar(st, 'fills', 'fill', relleno % 'FFD9E1F2')
        st, r_no = agregar(st, 'fills', 'fill', relleno % 'FFFFF2CC')
        st, r_sec = agregar(st, 'fills', 'fill', relleno % 'FFE2EFDA')
        borde = ('<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right>'
                 '<top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border>')
        st, b_t = agregar(st, 'borders', 'border', borde)

        def xf(fmt, font, fill, border, h=None, wrap=False):
            al = '<alignment%s vertical="center"%s/>' % ((' horizontal="%s"' % h) if h else '', ' wrapText="1"' if wrap else '')
            return ('<xf numFmtId="%d" fontId="%d" fillId="%d" borderId="%d" xfId="0" applyNumberFormat="1" '
                    'applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">%s</xf>' % (fmt, font, fill, border, al))

        defs = {'titulo': xf(0, f_t, 0, 0), 'sub': xf(0, f_n, 0, 0), 'seccion': xf(0, f_b, r_sec, b_t),
                'cab': xf(0, f_b, r_cab, b_t, 'center', True), 'txt': xf(0, f_n, 0, b_t, 'left', True),
                'txtc': xf(0, f_n, 0, b_t, 'center'), 'txtb': xf(0, f_b, 0, b_t, 'center'),
                'int': xf(1, f_n, 0, b_t, 'center'), 'dec': xf(fmt1, f_n, 0, b_t, 'center'),
                'no': xf(0, f_b, r_no, b_t, 'center'), 'ok': xf(0, f_ok, 0, b_t, 'center'),
                'mal': xf(0, f_mal, 0, b_t, 'center'), 'aviso': xf(0, f_n, 0, 0, 'left')}
        idx = {}
        for k, v in defs.items():
            st, idx[k] = agregar(st, 'cellXfs', 'xf', v)
        self.partes['xl/styles.xml'] = st.encode('utf-8')
        return idx

    def _registrar_hoja(self, nombre):
        """Parte (xl/worksheets/sheetN.xml) de la hoja `nombre`; la crea en el libro si no existe."""
        for n, parte, rid, sid in self._hojas():
            if n == nombre:
                return parte
        wb = self.partes['xl/workbook.xml'].decode('utf-8')
        rels = self.partes['xl/_rels/workbook.xml.rels'].decode('utf-8')
        rid = 'rId%d' % (max([int(x) for x in re.findall(r'\bId="rId(\d+)"', rels)] + [0]) + 1)
        k = max([int(x) for x in re.findall(r'xl/worksheets/sheet(\d+)\.xml', ' '.join(self.partes))] + [0]) + 1
        parte = 'xl/worksheets/sheet%d.xml' % k
        sid = max([h[3] for h in self._hojas()] + [0]) + 1
        pref = re.search(r'<sheet\b[^>]*?\b(\w+):id="', wb)
        pref = pref.group(1) if pref else 'r'
        elem = '<sheet name="%s" sheetId="%d" %s:id="%s"/>' % (xml_escape(nombre, {'"': '&quot;'}), sid, pref, rid)
        wb = wb.replace('</sheets>', elem + '</sheets>', 1)
        rels = rels.replace('</Relationships>', '<Relationship Id="%s" Type="%s" Target="worksheets/sheet%d.xml"/>'
                            '</Relationships>' % (rid, TIPO_HOJA, k), 1)
        ct = self.partes['[Content_Types].xml'].decode('utf-8')
        ct = ct.replace('</Types>', '<Override PartName="/%s" ContentType="%s"/></Types>' % (parte, CT_HOJA), 1)
        self.partes['xl/workbook.xml'] = wb.encode('utf-8')
        self.partes['xl/_rels/workbook.xml.rels'] = rels.encode('utf-8')
        self.partes['[Content_Types].xml'] = ct.encode('utf-8')
        self._app_agregar_hoja(nombre)
        info = zipfile.ZipInfo(parte, date_time=datetime.datetime.now().timetuple()[:6])
        info.compress_type = zipfile.ZIP_DEFLATED
        self.infos.append(info)
        self.partes[parte] = b''
        return parte

    def _app_agregar_hoja(self, nombre):
        """Mantiene docProps/app.xml al día (lista de hojas), si tiene la forma habitual."""
        app = self.partes.get('docProps/app.xml')
        if not app:
            return
        a = app.decode('utf-8')
        mh = re.search(r'(<HeadingPairs>\s*<vt:vector[^>]*>\s*<vt:variant>\s*<vt:lpstr>[^<]*</vt:lpstr>\s*</vt:variant>'
                       r'\s*<vt:variant>\s*<vt:i4>)(\d+)(</vt:i4>)', a)
        mt = re.search(r'(<TitlesOfParts>\s*<vt:vector size=")(\d+)("[^>]*>)(.*?)(</vt:vector>)', a, re.S)
        if not (mh and mt):
            return
        n_hojas = int(mh.group(2))
        titulos = re.findall(r'<vt:lpstr>.*?</vt:lpstr>', mt.group(4), re.S)
        titulos.insert(n_hojas, '<vt:lpstr>%s</vt:lpstr>' % xml_escape(nombre))
        nuevo_t = mt.group(1) + str(int(mt.group(2)) + 1) + mt.group(3) + ''.join(titulos) + mt.group(5)
        a = a[:mt.start()] + nuevo_t + a[mt.end():]
        mh = re.search(r'(<HeadingPairs>\s*<vt:vector[^>]*>\s*<vt:variant>\s*<vt:lpstr>[^<]*</vt:lpstr>\s*</vt:variant>'
                       r'\s*<vt:variant>\s*<vt:i4>)(\d+)(</vt:i4>)', a)
        a = a[:mh.start(2)] + str(n_hojas + 1) + a[mh.end(2):]
        self.partes['docProps/app.xml'] = a.encode('utf-8')

    def hoja_perfiles(self, paradas, info, ruta_dxf, avisos):
        """Hoja "Perfiles DXF": todos los tiros de los perfiles, resumen por fase con la verificación contra el
        cuadro del plano, resumen por parada y avisos."""
        est = self._estilos()
        H = _HojaXML()
        n_tiros = sum(len(t['tiros']) for t in paradas)
        H.agregar([('PERFILES DE PARADAS LEÍDOS DEL PLANO', est['titulo'])], alto=22, unir_hasta='L')
        H.agregar([('Plano: %s   ·   leído el %s   ·   %d paradas, %d tiros'
                    % (os.path.basename(ruta_dxf), datetime.datetime.now().strftime('%d-%m-%Y %H:%M'),
                       len(paradas), n_tiros), est['sub'])], unir_hasta='L')
        notas = sorted(set(t['nota_carga'] for t in paradas if t['nota_carga']))
        H.agregar([('Longitud y taco: valores rotulados en el plano. Paradas que no se cargan: %s'
                    % ('; '.join(notas) if notas else 'ninguna según las notas del plano'), est['sub'])], unir_hasta='L')
        cab = ['FASE', 'PARADA', 'BASCULACIÓN', 'TIRO', 'LADO', 'INCLINACIÓN [°]', 'LONG. DISEÑO [M]', 'TACO [M]',
               'LONG. SIN CARGAR [M]', 'LONG. CARGA [M]', 'SE CARGA', 'OBSERVACIONES']
        H.agregar([(c, est['cab']) for c in cab], alto=32)
        for t in paradas:
            etiqueta = nombre_en_planilla(t['nombre'])
            for n, h in numerar_tiros(t, []):
                L = longitud_diseno(h)
                taco = taco_dibujado(h)
                sinc = taco if t['cargada'] else L
                carga = (L - taco if taco is not None else None) if t['cargada'] else 0.0
                obs = list(h['obs'])
                if not t['cargada']:
                    obs = ['no se carga, sólo se barrena (%s)' % nota_corta(t['nota_carga'])] + \
                          [o for o in obs if o != 'sin taco dibujado']
                H.agregar([(t['fase_txt'], est['txtc']), (etiqueta, est['txtb']), (t['basc'], est['txtc']),
                           (n, est['int']), (lado_tiro(t, h), est['txtc']), (inclinacion(h), est['int']),
                           (L, est['dec']), (taco, est['dec']), (sinc, est['dec']), (carga, est['dec']),
                           ('Sí' if t['cargada'] else 'No', est['txtc'] if t['cargada'] else est['no']),
                           ('; '.join(obs), est['txt'])])
        # resumen por fase
        H.agregar()
        H.agregar([('RESUMEN POR FASE Y VERIFICACIÓN CONTRA EL CUADRO DE BARRENADURA / TRONADURA DEL PLANO', est['seccion'])],
                  unir_hasta='L')
        H.agregar([(c, est['cab']) for c in ('FASE', 'PARADAS', 'TIROS', 'TIROS QUE SE CARGAN', 'LONG. BARRENADA [M]',
                                             'LONG. SIN CARGAR [M]', 'LONG. CARGUÍO [M]', 'CUADRO: TIROS',
                                             'CUADRO: BARRENADA [M]', 'CUADRO: SIN CARGAR [M]', 'CUADRO: CARGUÍO [M]',
                                             'VERIFICACIÓN')], alto=48)
        for g in grupos_por_fase(paradas, info):
            r, c, grupo = g['r'], g['c'], g['grupo']
            comp = comparar(r, c) if c else []
            if comp:
                malas = ['%s %s (cuadro %s)' % (campo.replace('_', ' '), fmt_num(round(v, 1)), fmt_num(cv))
                         for campo, v, cv, ok in comp if not ok]
                verif, sv = ('OK: calza con el cuadro' if not malas else 'Diferencia: ' + '; '.join(malas)), \
                    (est['ok'] if not malas else est['mal'])
            else:
                verif, sv = 'sin cuadro en el plano', est['txtc']
            lista = ', '.join(nombre_en_planilla(t['nombre']) for t in grupo)
            H.agregar([(g['nombre'], est['txtb']), (lista, est['txt']),
                       (r['tiros'], est['int']), (r['tiros_carga'], est['int']), (r['barrenada'], est['dec']),
                       (r['sin_cargar'], est['dec']), (r['carguio'], est['dec']),
                       (c.get('tiros'), est['int']), (c.get('barrenada'), est['dec']),
                       (c.get('sin_cargar'), est['dec']), (c.get('carguio'), est['dec']), (verif, sv)],
                      alto=max(16, 14 * int(math.ceil(len(lista) / 30.0)) + 3))
        r = resumen_grupo(paradas)
        H.agregar([('TOTAL', est['txtb']), ('%d paradas' % len(paradas), est['txt']), (r['tiros'], est['int']),
                   (r['tiros_carga'], est['int']), (r['barrenada'], est['dec']), (r['sin_cargar'], est['dec']),
                   (r['carguio'], est['dec'])])
        # resumen por parada
        H.agregar()
        H.agregar([('RESUMEN POR PARADA', est['seccion'])], unir_hasta='L')
        H.agregar([(c, est['cab']) for c in ('FASE', 'PARADA', 'BASCULACIÓN', 'TIROS', 'SE CARGA', 'INCLINACIONES [°]',
                                             'LONG. DISEÑO [M]', 'TACO [M]', 'LONG. SIN CARGAR [M]', 'LONG. CARGA [M]')],
                  alto=32)
        for t in paradas:
            g = resumen_grupo([t])
            incs = [inclinacion(h) for n, h in numerar_tiros(t, [])]
            rango = ('%s a %s' % (fmt_num(min(incs)), fmt_num(max(incs)))) if min(incs) != max(incs) else fmt_num(incs[0])
            H.agregar([(t['fase_txt'], est['txtc']), (nombre_en_planilla(t['nombre']), est['txtb']), (t['basc'], est['txtc']),
                       (g['tiros'], est['int']), ('Sí' if t['cargada'] else 'No', est['txtc'] if t['cargada'] else est['no']),
                       (rango, est['txtc']),
                       (g['barrenada'], est['dec']),
                       (sum(taco_dibujado(h) or 0.0 for h in t['tiros']) if t['cargada'] else None, est['dec']),
                       (g['sin_cargar'] if t['cargada'] else g['barrenada'], est['dec']), (g['carguio'], est['dec'])])
        if avisos:
            H.agregar()
            H.agregar([('AVISOS', est['seccion'])], unir_hasta='L')
            for a in avisos:
                H.agregar([(a, est['aviso'])])
        xml = H.xml(anchos=[14, 30, 13, 9, 10, 13, 13, 11, 14, 13, 11, 70], congelar=4)
        parte = self._registrar_hoja(HOJA_PERFILES)
        self.partes[parte] = xml.encode('utf-8')

    def guardar(self, destino):
        tmp = destino + '.tmp'
        try:
            with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
                for info in self.infos:
                    z.writestr(info, self.partes[info.filename])
            os.replace(tmp, destino)
        except OSError as e:
            if os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except OSError:
                    pass
            raise SystemExit('No puedo escribir "%s". Cierra la planilla en Excel y vuelve a correr el script.\n(%s)'
                             % (destino, e))


# ================================================================ 6. PROGRAMA PRINCIPAL
def imprimir_fases(paradas, info):
    """paradas: en el orden por fase."""
    if info['cuadro']:
        decir('Fases según el cuadro de barrenadura/tronadura del plano (verificación):')
    else:
        decir('El plano no tiene un cuadro por fase que calce con los perfiles: no se asignan fases.')
    for g in grupos_por_fase(paradas, info):
        if not info['cuadro'] and not g['c']:
            continue
        decir('  %s: %s' % (g['nombre'], ', '.join(nombre_en_planilla(t['nombre']) for t in g['grupo'])))
        if g['c']:
            partes = []
            for campo, v, cv, ok in comparar(g['r'], g['c']):
                partes.append('%s %s (cuadro %s) %s' % (campo.replace('_', ' '), fmt_num(round(v, 1)), fmt_num(cv),
                                                         'OK' if ok else 'DIFERENCIA'))
            decir('      ' + ' | '.join(partes))
    no = [t for t in paradas if not t['cargada']]
    if no:
        decir('No se cargan, sólo se barrenan (%s): %s' % (nota_corta(no[0]['nota_carga']),
                                                           ', '.join(nombre_en_planilla(t['nombre']) for t in no)))


def pedir_archivos():
    """Sin argumentos (doble clic): rutas de RUTA_DXF / RUTA_PLANILLA o ventanas para elegir los archivos."""
    dxf, xlsx = RUTA_DXF.strip(), RUTA_PLANILLA.strip()
    if dxf and xlsx:
        return dxf, xlsx
    try:
        import tkinter as tk
        from tkinter import filedialog
        raiz = tk.Tk()
        raiz.withdraw()
        raiz.attributes('-topmost', True)
        if not dxf:
            dxf = filedialog.askopenfilename(parent=raiz, title='1/2  Plano DXF con los perfiles de las paradas',
                                             filetypes=[('Plano DXF', '*.dxf'), ('Todos los archivos', '*.*')])
        if dxf and not xlsx:
            xlsx = filedialog.askopenfilename(parent=raiz, title='2/2  Planilla Excel a rellenar (pestaña JEJ)',
                                              initialdir=os.path.dirname(dxf),
                                              filetypes=[('Planilla Excel', '*.xlsx *.xlsm'), ('Todos los archivos', '*.*')])
        raiz.destroy()
    except Exception:
        if not dxf:
            dxf = input('Ruta del plano DXF: ').strip().strip('"')
        if dxf and not xlsx:
            xlsx = input('Ruta de la planilla Excel: ').strip().strip('"')
    return dxf, xlsx


def avisar(texto, error=False):
    """Mensaje final cuando el script se abrió con doble clic (la consola se cerraría sin dejar leer)."""
    try:
        import tkinter as tk
        from tkinter import messagebox
        raiz = tk.Tk()
        raiz.withdraw()
        raiz.attributes('-topmost', True)
        (messagebox.showerror if error else messagebox.showinfo)('Paradas del DXF -> pestaña JEJ', texto, parent=raiz)
        raiz.destroy()
    except Exception:
        try:
            input('\n%s\n\nPresiona Enter para cerrar...' % texto)
        except EOFError:
            pass


def ruta_respaldo(ruta):
    base, ext = os.path.splitext(ruta)
    r = base + ' - respaldo' + ext
    if os.path.exists(r):
        r = base + ' - respaldo ' + datetime.datetime.now().strftime('%Y-%m-%d %H%M%S') + ext
    return r


def se_puede_escribir(ruta):
    """False si Excel u otro programa tiene el archivo abierto (bloqueado)."""
    if not os.path.exists(ruta):
        return True
    try:
        with open(ruta, 'ab'):
            return True
    except OSError:
        return False


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    interactivo = not argv
    if interactivo:
        dxf, xlsx = pedir_archivos()
        if not dxf or not xlsx:
            avisar('No se eligió el plano DXF o la planilla. No se hizo nada.', error=True)
            return 1
        argv = [dxf, xlsx]
    try:
        resumen = ejecutar(argv)
    except SystemExit as e:
        if interactivo and isinstance(e.code, str):
            decir(e.code)
            avisar(e.code, error=True)
            return 1
        raise
    if interactivo and resumen:
        avisar(resumen)
    return 0


def ejecutar(argv):
    ap = argparse.ArgumentParser(description='Lee los perfiles de paradas de un DXF y rellena PARADA, TIRO, '
                                             'LONG. DISEÑO y Taco en la pestaña JEJ de la planilla de carguío.')
    ap.add_argument('dxf', help='plano DXF (ASCII)')
    ap.add_argument('planilla', nargs='?', help='planilla .xlsx a rellenar (pestaña JEJ); si se omite sólo se genera el TXT')
    ap.add_argument('-o', '--salida', help='escribir en otro archivo .xlsx y dejar la planilla como estaba')
    ap.add_argument('--paradas', help='sólo estas paradas, en este orden, separadas por coma: "10, AuxHW, 11" '
                                      '(por omisión TODAS las paradas del plano)')
    ap.add_argument('--orden', choices=('fase', 'plano'), default=None,
                    help='plano (por omisión): en el orden de los perfiles en el dibujo; fase: agrupadas por fase, '
                         'la fase de la planilla primero')
    ap.add_argument('--conservar-terreno', action='store_true',
                    help='conservar lo ya llenado en terreno en las demás columnas de la tabla (cada fila viaja con su '
                         'tiro); por omisión la tabla queda sólo con PARADA, TIRO, LONG. DISEÑO y Taco')
    ap.add_argument('--taco-no-cargados', choices=('cero', 'vacio', 'largo'), default='cero',
                    help='Taco de los tiros que no se cargan: cero (por omisión), vacio o largo (longitud completa)')
    ap.add_argument('--hoja-perfiles', action='store_true',
                    help='agregar también la pestaña "Perfiles DXF" con todos los datos y la verificación del cuadro')
    ap.add_argument('--hoja', default=HOJA_PLANILLA, help='nombre de la pestaña con la tabla (por omisión %s)' % HOJA_PLANILLA)
    ap.add_argument('--txt', nargs='?', const=True, help='escribir además el TXT (opcionalmente con otro nombre)')
    ap.add_argument('--coma', action='store_true', help='en el TXT, decimales con coma')
    ap.add_argument('-v', '--verbose', action='store_true', help='mostrar el detalle tramo a tramo')
    ap.add_argument('--en-sitio', action='store_true', help=argparse.SUPPRESS)          # ahora es lo normal
    ap.add_argument('--sin-hoja-perfiles', action='store_true', help=argparse.SUPPRESS)  # ahora es lo normal
    ap.add_argument('--todas', action='store_true', help=argparse.SUPPRESS)
    args = ap.parse_args(argv)
    if args.orden is None:
        args.orden = 'fase' if args.conservar_terreno else 'plano'

    if not os.path.isfile(args.dxf):
        raise SystemExit('No existe el plano: %s' % args.dxf)
    if args.planilla and not os.path.isfile(args.planilla):
        raise SystemExit('No existe la planilla: %s' % args.planilla)
    if args.planilla:
        destino = args.salida or args.planilla
        if not se_puede_escribir(destino):
            raise SystemExit('La planilla "%s" está abierta en Excel. Ciérrala y vuelve a correr el script.'
                             % os.path.basename(destino))

    t0 = datetime.datetime.now()
    dxf = DXF(args.dxf)
    decir('DXF leído: %d entidades, %d segmentos, %d pivotes, %d textos, %d círculos (%.1f s)'
          % (dxf.n_entidades, len(dxf.segmentos), len(dxf.pivotes), len(dxf.textos), len(dxf.circulos),
             (datetime.datetime.now() - t0).total_seconds()))
    if dxf.n_en_bloques and not dxf.segmentos:
        decir('Aviso: las entidades están dentro de bloques; este script sólo lee el espacio modelo.')
    titulos, avisos = analizar(dxf, args.verbose)
    paradas = ordenar_plano([t for t in titulos if t['tiros']])
    info = info_plano(dxf, paradas, avisos)
    if args.verbose:
        imprimir_detalle(paradas)
    decir('Paradas en los perfiles del plano: %d   Tiros: %d' % (len(paradas), sum(len(t['tiros']) for t in paradas)))
    imprimir_fases(ordenar_para_planilla(paradas, 'fase'), info)

    # --- TXT
    if args.txt or not args.planilla:
        ruta_txt = args.txt if isinstance(args.txt, str) else os.path.splitext(args.dxf)[0] + '_paradas.txt'
        orden_txt = ordenar_para_planilla(paradas, args.orden)
        n_par, n_tiros = escribir_txt(args.dxf, ruta_txt, orden_txt, info, avisos, args.coma, args.taco_no_cargados)
        decir('TXT: %d paradas, %d tiros -> %s' % (n_par, n_tiros, ruta_txt))

    # --- planilla
    resumen = ''
    if args.planilla:
        planilla = Planilla(args.planilla, args.hoja)
        fase_pl = planilla.fase_planilla()
        orden = ordenar_para_planilla(paradas, args.orden, fase_pl)
        elegidas = seleccionar_paradas(paradas, args.paradas) if args.paradas else orden
        entradas = entradas_planilla(elegidas, args.taco_no_cargados, avisos)
        decir('Planilla: pestaña "%s"%s, encabezado en la fila %d, columnas %s/%s/%s/%s, %d filas de tabla'
              % (planilla.hoja, (' (fase %d)' % fase_pl) if fase_pl else '', planilla.fila_enc, planilla.col['parada'],
                 planilla.col['tiro'], planilla.col['long'], planilla.col['taco'], len(planilla.filas)))
        planilla.reorganizar(entradas, set(t['clave'] for t in paradas), avisos, conservar=args.conservar_terreno)
        if planilla.filas_insertadas:
            decir('Tabla ampliada: %d filas insertadas (ahora %d filas, %d-%d); fórmulas, formatos y rangos ajustados.'
                  % (planilla.filas_insertadas, len(planilla.filas), planilla.filas[0], planilla.filas[-1]))
        if planilla.movidas:
            decir('Filas que cambiaron de lugar con sus datos de terreno: %d' % planilla.movidas)
        if planilla.cambios:
            decir('Valores de diseño que tenía la planilla y no coinciden con el plano (quedan los del plano):')
            for c in planilla.cambios:
                decir('   ' + c)
        if not args.conservar_terreno:
            decir('Tabla de la pestaña "%s": sólo PARADA, TIRO, LONG. DISEÑO y Taco de los perfiles; las demás columnas '
                  'quedan vacías para llenarlas en terreno.' % planilla.hoja)
        if args.hoja_perfiles:
            planilla.hoja_perfiles(orden, info, args.dxf, avisos)
        destino = args.salida or args.planilla
        respaldo = None
        if os.path.abspath(destino) == os.path.abspath(args.planilla):
            respaldo = ruta_respaldo(args.planilla)
            shutil.copy2(args.planilla, respaldo)
        planilla.guardar(destino)
        decir('Pestaña "%s" rellenada: %d tiros de %d paradas en las filas %d-%d -> %s'
              % (planilla.hoja, len(entradas), len(elegidas), planilla.filas[0], planilla.filas[0] + len(entradas) - 1,
                 destino))
        if respaldo:
            decir('Copia de la planilla antes de rellenar: %s' % respaldo)
        resumen = ('Listo. Pestaña %s rellenada con %d tiros de %d paradas (PARADA, TIRO, LONG. DISEÑO y Taco).\n%s\n'
                   'Planilla: %s' % (planilla.hoja, len(entradas), len(elegidas),
                                     'Las demás columnas de la tabla quedaron vacías para llenarlas en terreno.\n'
                                     if not args.conservar_terreno else '', destino))
        if respaldo:
            resumen += '\nRespaldo: %s' % os.path.basename(respaldo)
        if planilla.cambios:
            resumen += '\n\nValores que la planilla tenía distintos al plano (quedan los del plano):\n' + '\n'.join(planilla.cambios)
    for a in avisos:
        decir('AVISO: ' + a)
    return resumen


if __name__ == '__main__':
    sys.exit(main())
