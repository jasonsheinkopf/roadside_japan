/**
 * leaflet-map.ts — the single shared map engine, used by both the mini-map on detail
 * pages and the full-screen map page. Returns a tiny API so callers can swap the visible
 * set as filters change.
 *
 * Design notes:
 *  - Tiles: Esri World Street Map is primary — unlike OpenStreetMap's raster tiles, which
 *    label every place in the region's local script (Japanese here), Esri always labels
 *    globally in English/Latin script, which matches this site's English content. No API
 *    key required. OpenStreetMap tiles remain as an automatic fallback if Esri's tiles
 *    fail to load (CSP block, outage, etc.) — see swapToFallbackTiles below. Both are free
 *    to embed with attribution.
 *  - Markers: custom emoji DivIcons (per category) — avoids Leaflet's notorious broken
 *    default-marker image paths under bundlers, and looks on-brand.
 *  - Clustering: leaflet.markercluster keeps the all-Japan view readable.
 */
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { CATEGORY_META } from "../data/categories";
import type { IndexRecord } from "../lib/types";

export interface MapOptions {
  el: HTMLElement;
  center?: [number, number];
  zoom?: number;
  cluster?: boolean;
}

export interface MapHandle {
  map: L.Map;
  setRecords(records: IndexRecord[]): void;
  focus(lat: number, lng: number, zoom?: number): void;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function pinIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="rj-pin"><span>${emoji}</span></div>`,
    iconSize: [34, 34],
    popupAnchor: [0, -20],
  });
}

export function createMap(opts: MapOptions): MapHandle {
  const map = L.map(opts.el, { scrollWheelZoom: true, attributionControl: true }).setView(
    opts.center ?? [36.2048, 138.2529],
    opts.zoom ?? 5,
  );

  // Primary: Esri World Street Map — labels globally in English, no API key.
  // Note the tile coordinate order is {z}/{y}/{x}, not OSM's {z}/{x}/{y} — do not swap.
  const primaryTiles = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    },
  ).addTo(map);

  // Fallback: swap to OpenStreetMap (local-script labels, but always available) if Esri's
  // tiles fail repeatedly — a handful of transient errors shouldn't trigger a swap.
  let tileErrors = 0;
  let swappedToFallback = false;
  primaryTiles.on("tileerror", () => {
    if (swappedToFallback || ++tileErrors < 4) return;
    swappedToFallback = true;
    map.removeLayer(primaryTiles);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  });

  const cluster = opts.cluster !== false;
  const layer = cluster
    ? (L as typeof L & { markerClusterGroup: (o?: unknown) => L.LayerGroup }).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 48,
      })
    : L.layerGroup();
  layer.addTo(map);

  function setRecords(records: IndexRecord[]) {
    layer.clearLayers();
    for (const r of records) {
      const emoji = CATEGORY_META[r.category]?.emoji ?? "📍";
      const marker = L.marker([r.lat, r.lng], { icon: pinIcon(emoji), title: r.title });
      const sub = `${CATEGORY_META[r.category]?.label ?? r.category} · ${escapeHtml(r.prefectureName)}`;
      marker.bindPopup(
        `<a class="rj-pop" href="${r.url}"><strong>${escapeHtml(r.title)}</strong><br><span>${sub}</span></a>`,
      );
      layer.addLayer(marker);
    }
    // Defensive: Leaflet needs a size recalc if the container was hidden at init.
    setTimeout(() => map.invalidateSize(), 0);
  }

  function focus(lat: number, lng: number, zoom = 13) {
    map.setView([lat, lng], zoom);
  }

  return { map, setRecords, focus };
}
