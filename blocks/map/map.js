/**
 * Legality map: a Swiss base map overlaid with the official "forbidden" zones
 * — the Swiss National Park, wildlife rest zones (Wildruhezonen) and federal
 * game reserves (Jagdbanngebiete) — pulled live from geo.admin.ch, plus a
 * legend explaining the forbidden / grey-area / generally-tolerated tiers.
 *
 * Leaflet and its CSS are loaded lazily from a CDN so the map never blocks LCP.
 * Only the red zones are drawn from authoritative data; amber and green are
 * guidance the map cannot draw accurately (that patchwork is the whole point).
 *
 * Authored structure (optional single cell of intro text):
 *   <div class="map"><div><div>Intro paragraph…</div></div></div>
 *
 * @param {Element} block The map block element
 */

import { getLanguage } from '../../scripts/scripts.js';

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

const SWISSTOPO_TILES = 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg';
// Switzerland extent — keep the map from panning/zooming into the empty area
// beyond swisstopo's national coverage (which is what made tiles disappear).
const SWITZERLAND_BOUNDS = [[45.75, 5.8], [47.95, 10.6]];
const GEOADMIN_WMS = 'https://wms.geo.admin.ch/';
const FORBIDDEN_LAYERS = [
  'ch.bafu.schutzgebiete-schweizerischer_nationalpark',
  'ch.bafu.wrz-wildruhezonen_portal',
  'ch.bafu.bundesinventare-jagdbanngebiete',
  'ch.bafu.wrz-jagdbanngebiete_select', // "Wildtierschutzgebiete" (wildlife reserves)
].join(',');

const SWATCH_CLASSES = ['map-swatch-red', 'map-swatch-amber', 'map-swatch-green'];

const MAP_STRINGS = {
  en: {
    aria: 'Interactive map of where wild camping is forbidden, restricted or tolerated in Switzerland',
    title: 'What the colours mean',
    tiers: [
      ['Forbidden', 'Swiss National Park, wildlife rest zones (<em>Wildruhezonen</em>) and federal game reserves. Drawn live from official swisstopo / BAFU data.'],
      ['Grey area', "valleys, forests, farmland and the cantonal patchwork. Rules vary and aren't mappable; verify locally."],
      ['Generally tolerated', 'a single-night bivouac high above the treeline, well away from the red zones.'],
    ],
    disclaimer: 'Guidance only, not legal advice. Only the red zones come from official data — always check local and cantonal rules before you go.',
    layer: 'Forbidden zones (official)',
    error: 'The map could not be loaded right now.',
  },
  de: {
    aria: 'Interaktive Karte, wo Wildcampen in der Schweiz verboten, eingeschränkt oder toleriert ist',
    title: 'Was die Farben bedeuten',
    tiers: [
      ['Verboten', 'Schweizerischer Nationalpark, Wildruhezonen und eidgenössische Jagdbanngebiete. Live aus offiziellen swisstopo-/BAFU-Daten.'],
      ['Grauzone', 'Täler, Wälder, Kulturland und der kantonale Flickenteppich. Die Regeln variieren und lassen sich nicht kartieren; vor Ort prüfen.'],
      ['Meist toleriert', 'ein einzelnes Nachtbiwak hoch über der Baumgrenze, weit weg von den roten Zonen.'],
    ],
    disclaimer: 'Nur zur Orientierung, keine Rechtsberatung. Nur die roten Zonen stammen aus offiziellen Daten — prüfe immer die lokalen und kantonalen Regeln, bevor du losziehst.',
    layer: 'Verbotene Zonen (offiziell)',
    error: 'Die Karte konnte gerade nicht geladen werden.',
  },
  fr: {
    aria: 'Carte interactive indiquant où le camping sauvage est interdit, restreint ou toléré en Suisse',
    title: 'Ce que signifient les couleurs',
    tiers: [
      ['Interdit', 'Parc national suisse, zones de tranquillité de la faune (<em>Wildruhezonen</em>) et districts francs fédéraux. Tracé en direct à partir des données officielles swisstopo / OFEV.'],
      ['Zone grise', 'vallées, forêts, terres agricoles et la mosaïque cantonale. Les règles varient et ne sont pas cartographiables ; vérifiez sur place.'],
      ['Généralement toléré', "un bivouac d'une seule nuit haut au-dessus de la limite des arbres, loin des zones rouges."],
    ],
    disclaimer: 'À titre indicatif uniquement, pas un conseil juridique. Seules les zones rouges proviennent de données officielles — vérifiez toujours les règles locales et cantonales avant de partir.',
    layer: 'Zones interdites (officielles)',
    error: "La carte n'a pas pu être chargée pour le moment.",
  },
};

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function loadCSSOnce(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

export default async function decorate(block) {
  // Pull optional intro text authored in the first cell, then reset the block.
  const introCell = block.querySelector(':scope > div > div');
  const introHTML = introCell ? introCell.innerHTML : '';
  block.textContent = '';

  if (introHTML) {
    const intro = document.createElement('div');
    intro.className = 'map-intro';
    intro.innerHTML = introHTML;
    block.append(intro);
  }

  const canvas = document.createElement('div');
  canvas.className = 'map-canvas';
  canvas.setAttribute('role', 'application');
  const strings = MAP_STRINGS[getLanguage()] || MAP_STRINGS.en;
  canvas.setAttribute('aria-label', strings.aria);
  block.append(canvas);

  const legend = document.createElement('div');
  legend.className = 'map-legend';
  const tiers = strings.tiers
    .map(([label, desc], i) => `<li><span class="map-swatch ${SWATCH_CLASSES[i]}"></span><span><strong>${label}</strong> — ${desc}</span></li>`)
    .join('');
  legend.innerHTML = `
    <p class="map-legend-title">${strings.title}</p>
    <ul>${tiers}</ul>
    <p class="map-disclaimer">${strings.disclaimer}</p>`;
  block.append(legend);

  loadCSSOnce(LEAFLET_CSS);
  try {
    await loadScriptOnce(LEAFLET_JS);
  } catch (e) {
    canvas.classList.add('map-canvas-error');
    canvas.innerHTML = `<p>${strings.error}</p>`;
    return;
  }

  const { L } = window;
  const map = L.map(canvas, {
    center: [46.8, 8.23],
    zoom: 8,
    minZoom: 8,
    maxZoom: 16,
    maxBounds: SWITZERLAND_BOUNDS,
    maxBoundsViscosity: 1,
    scrollWheelZoom: false,
  });

  L.tileLayer(SWISSTOPO_TILES, {
    maxZoom: 18,
    bounds: SWITZERLAND_BOUNDS,
    attribution: '© <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
  }).addTo(map);

  const forbidden = L.tileLayer.wms(GEOADMIN_WMS, {
    layers: FORBIDDEN_LAYERS,
    format: 'image/png',
    transparent: true,
    opacity: 0.9,
    version: '1.3.0',
    className: 'map-forbidden',
    bounds: SWITZERLAND_BOUNDS,
    attribution: '© <a href="https://www.geo.admin.ch/">BAFU / geo.admin.ch</a>',
  });
  forbidden.addTo(map);

  L.control.layers(null, { [strings.layer]: forbidden }, { collapsed: false }).addTo(map);

  // Leaflet renders only a small tile patch if the container isn't at its
  // final size when the map initialises (block CSS can apply a beat later).
  // Recompute on every size change so the tiles always fill the canvas.
  const resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(canvas);
  requestAnimationFrame(() => map.invalidateSize());

  // Only grab the scroll wheel once the user interacts with the map.
  canvas.addEventListener('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());
}
