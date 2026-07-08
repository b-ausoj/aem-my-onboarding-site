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

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

const SWISSTOPO_TILES = 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg';
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const GEOADMIN_WMS = 'https://wms.geo.admin.ch/';
const FORBIDDEN_LAYERS = [
  'ch.bafu.schutzgebiete-schweizerischer_nationalpark',
  'ch.bafu.wrz-wildruhezonen_portal',
  'ch.bafu.bundesinventare-jagdbanngebiete',
].join(',');

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
  canvas.setAttribute('aria-label', 'Interactive map of where wild camping is forbidden, restricted or tolerated in Switzerland');
  block.append(canvas);

  const legend = document.createElement('div');
  legend.className = 'map-legend';
  legend.innerHTML = `
    <p class="map-legend-title">What the colours mean</p>
    <ul>
      <li><span class="map-swatch map-swatch-red"></span><span><strong>Forbidden</strong> — Swiss National Park, wildlife rest zones (<em>Wildruhezonen</em>) and federal game reserves. Drawn live from official swisstopo / BAFU data.</span></li>
      <li><span class="map-swatch map-swatch-amber"></span><span><strong>Grey area</strong> — valleys, forests, farmland and the cantonal patchwork. Rules vary and aren't mappable; verify locally.</span></li>
      <li><span class="map-swatch map-swatch-green"></span><span><strong>Generally tolerated</strong> — a single-night bivouac high above the treeline, well away from the red zones.</span></li>
    </ul>
    <p class="map-disclaimer">Guidance only, not legal advice. Only the red zones come from official data — always check local and cantonal rules before you go.</p>`;
  block.append(legend);

  loadCSSOnce(LEAFLET_CSS);
  try {
    await loadScriptOnce(LEAFLET_JS);
  } catch (e) {
    canvas.classList.add('map-canvas-error');
    canvas.innerHTML = '<p>The map could not be loaded right now. See <a href="/protected-zones">Protected zones</a> for where wild camping is forbidden.</p>';
    return;
  }

  const { L } = window;
  const map = L.map(canvas, {
    center: [46.8, 8.23],
    zoom: 8,
    minZoom: 7,
    maxZoom: 16,
    scrollWheelZoom: false,
  });

  const base = L.tileLayer(SWISSTOPO_TILES, {
    maxZoom: 18,
    attribution: '© <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
  });
  base.on('tileerror', () => {
    // fall back to OpenStreetMap if the swisstopo endpoint is unavailable
    if (!map.hasLayer(base)) return;
    map.removeLayer(base);
    L.tileLayer(OSM_TILES, {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  });
  base.addTo(map);

  const forbidden = L.tileLayer.wms(GEOADMIN_WMS, {
    layers: FORBIDDEN_LAYERS,
    format: 'image/png',
    transparent: true,
    opacity: 0.55,
    version: '1.3.0',
    attribution: '© <a href="https://www.geo.admin.ch/">BAFU / geo.admin.ch</a>',
  });
  forbidden.addTo(map);

  L.control.layers(null, { 'Forbidden zones (official)': forbidden }, { collapsed: false }).addTo(map);

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
