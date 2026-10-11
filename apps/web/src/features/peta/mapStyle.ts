import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl'

// Style peta "malam", warnanya senada dengan foto header: laut gelap, daratan biru malam,
// jalan seperti lampu jalan yang redup, pantai sedikit berwarna pasir.
// Data peta dari OpenFreeMap (gratis, tanpa API key), skema OpenMapTiles.

const TILES = 'https://tiles.openfreemap.org/planet'
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

const color = {
  land: '#101d2c',
  residential: '#12202f',
  green: '#0f2127',
  beach: '#232e38',
  water: '#070e19',
  river: '#0a1522',
  building: '#142438',
  buildingEdge: '#1a2c42',
  label: '#ece7d6',
  labelSoft: '#d6cdb0',
  halo: '#0c1622',
  waterLabel: '#5d7896',
}

/** Warna pasir dengan transparansi, dipakai untuk jalan dan batas wilayah. */
const sand = (alpha: number) => `rgba(214, 205, 176, ${alpha})`

const name: ExpressionSpecification = ['coalesce', ['get', 'name:latin'], ['get', 'name']]
const isLine: ExpressionSpecification = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false]
const isArea: ExpressionSpecification = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false]
const isPoint: ExpressionSpecification = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false]
const classIn = (...classes: string[]): ExpressionSpecification => [
  'match',
  ['get', 'class'],
  classes,
  true,
  false,
]

const labelPaint = (textColor: string) => ({
  'text-color': textColor,
  'text-halo-color': color.halo,
  'text-halo-width': 1.2,
  'text-halo-blur': 0.5,
})

export const nightStyle: StyleSpecification = {
  version: 8,
  name: 'Tongkrongan Malam',
  glyphs: GLYPHS,
  sources: {
    openmaptiles: { type: 'vector', url: TILES },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': color.land } },

    // ---------- Area ----------
    {
      id: 'residential',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      maxzoom: 16,
      filter: ['all', isArea, ['==', ['get', 'class'], 'residential']],
      paint: { 'fill-color': color.residential },
    },
    {
      id: 'wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      minzoom: 8,
      filter: ['all', isArea, ['match', ['get', 'class'], ['wood', 'grass', 'wetland'], true, false]],
      paint: {
        'fill-color': color.green,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 11, 1],
      },
    },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      filter: isArea,
      paint: { 'fill-color': color.green },
    },
    {
      id: 'beach',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['all', isArea, ['==', ['get', 'class'], 'sand']],
      paint: { 'fill-color': color.beach },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      filter: ['all', isArea, ['!=', ['get', 'brunnel'], 'tunnel']],
      paint: { 'fill-color': color.water, 'fill-antialias': true },
    },
    {
      id: 'river',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      filter: isLine,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color.river,
        'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 8, 0.6, 14, 2, 18, 6],
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-color': color.building,
        'fill-outline-color': color.buildingEdge,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 1],
      },
    },

    // ---------- Jalan ----------
    {
      id: 'road-path',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 14,
      filter: ['all', isLine, ['==', ['get', 'class'], 'path']],
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': sand(0.12),
        'line-dasharray': [2, 2],
        'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 14, 0.8, 20, 3],
      },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 11,
      filter: ['all', isLine, classIn('minor', 'service', 'track')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': sand(0.14),
        'line-width': ['interpolate', ['exponential', 1.55], ['zoom'], 11, 0.4, 14, 1.4, 20, 14],
      },
    },
    {
      id: 'road-major-far',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 7,
      maxzoom: 11,
      filter: ['all', isLine, classIn('primary', 'secondary', 'tertiary', 'trunk')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': sand(0.2), 'line-width': 0.8 },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 11,
      filter: ['all', isLine, classIn('primary', 'secondary', 'tertiary', 'trunk')],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': sand(0.26),
        'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 11, 1, 14, 2.6, 20, 18],
      },
    },
    {
      id: 'road-motorway-far',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      maxzoom: 6,
      filter: ['all', isLine, ['==', ['get', 'class'], 'motorway']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': sand(0.26), 'line-width': 0.8 },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 6,
      filter: ['all', isLine, ['==', ['get', 'class'], 'motorway']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': sand(0.42),
        'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 6, 0.8, 12, 2.2, 20, 26],
      },
    },
    {
      id: 'railway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['all', isLine, ['==', ['get', 'class'], 'rail'], ['!', ['has', 'service']]],
      paint: {
        'line-color': 'rgba(244, 243, 238, 0.16)',
        'line-dasharray': [3, 3],
        'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 12, 0.8, 20, 4],
      },
    },

    // ---------- Batas wilayah ----------
    {
      id: 'boundary-region',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      minzoom: 8,
      filter: [
        'all',
        ['==', ['typeof', ['get', 'admin_level']], 'number'],
        ['>=', ['get', 'admin_level'], 3],
        ['<=', ['get', 'admin_level'], 6],
        ['!=', ['get', 'maritime'], 1],
      ],
      paint: {
        'line-color': sand(0.16),
        'line-dasharray': [2, 3],
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 12, 1.2],
      },
    },
    {
      id: 'boundary-country',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': sand(0.32),
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 12, 2],
      },
    },

    // ---------- Label ----------
    {
      id: 'water-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      filter: isPoint,
      layout: {
        'text-field': name,
        'text-font': ['Noto Sans Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 0, 10, 8, 13],
        'text-letter-spacing': 0.15,
        'text-max-width': 6,
      },
      paint: { 'text-color': color.waterLabel, 'text-halo-color': color.water, 'text-halo-width': 1 },
    },
    {
      id: 'water-label-line',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'water_name',
      filter: isLine,
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 350,
        'text-field': name,
        'text-font': ['Noto Sans Italic'],
        'text-size': 12,
        'text-letter-spacing': 0.15,
      },
      paint: { 'text-color': color.waterLabel, 'text-halo-color': color.water, 'text-halo-width': 1 },
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      minzoom: 13,
      filter: ['all', isLine, classIn('motorway', 'trunk', 'primary', 'secondary', 'tertiary')],
      layout: {
        'symbol-placement': 'line',
        'text-field': name,
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 12],
        'text-rotation-alignment': 'map',
      },
      paint: labelPaint(sand(0.6)),
    },
    {
      id: 'road-label-minor',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      minzoom: 15,
      filter: ['all', isLine, classIn('minor', 'service')],
      layout: {
        'symbol-placement': 'line',
        'text-field': name,
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-rotation-alignment': 'map',
      },
      paint: labelPaint(sand(0.45)),
    },
    {
      id: 'place-neighbourhood',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 11,
      filter: classIn('suburb', 'neighbourhood', 'quarter', 'hamlet'),
      layout: {
        'text-field': name,
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 15, 11],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.12,
        'text-max-width': 8,
      },
      paint: labelPaint(sand(0.5)),
    },
    {
      id: 'place-village',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 10,
      filter: ['==', ['get', 'class'], 'village'],
      layout: {
        'text-field': name,
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 12],
        'text-max-width': 8,
      },
      paint: labelPaint(sand(0.7)),
    },
    {
      id: 'place-town',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 7,
      filter: ['==', ['get', 'class'], 'town'],
      layout: {
        'text-field': name,
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 12, 14],
        'text-max-width': 8,
      },
      paint: labelPaint(color.labelSoft),
    },
    {
      id: 'place-state',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 5,
      maxzoom: 8,
      filter: ['==', ['get', 'class'], 'state'],
      layout: {
        'text-field': name,
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 12],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
        'text-max-width': 9,
      },
      paint: labelPaint(sand(0.5)),
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      minzoom: 4,
      filter: ['==', ['get', 'class'], 'city'],
      layout: {
        'text-field': name,
        'text-font': ['case', ['==', ['get', 'capital'], 2], ['literal', ['Noto Sans Bold']], ['literal', ['Noto Sans Regular']]],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 14, 12, 18],
        'text-max-width': 8,
      },
      paint: labelPaint(color.label),
    },
    {
      id: 'place-country',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      maxzoom: 8,
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': name,
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 15],
        'text-max-width': 7,
      },
      paint: labelPaint(color.label),
    },
  ],
}
