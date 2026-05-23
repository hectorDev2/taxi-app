"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Marker {
  lat: number; lng: number; color?: string; label?: string;
}

interface Route {
  points: [number, number][];
  color?: string;
}

interface Props {
  height?: string;
  markers?: Marker[];
  routes?: Route[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onClick?: (lng: number, lat: number) => void;
}

function generateCurvedPath(origin: [number, number], dest: [number, number], steps = 30): [number, number][] {
  const mid = [(origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2];
  const dx = dest[0] - origin[0];
  const dy = dest[1] - origin[1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  mid[0] += (dy / dist) * dist * 0.15;
  mid[1] -= (dx / dist) * dist * 0.15;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    pts.push([a * origin[0] + b * mid[0] + c * dest[0], a * origin[1] + b * mid[1] + c * dest[1]]);
  }
  return pts;
}

export async function fetchRoute(origin: [number, number], dest: [number, number]): Promise<[number, number][]> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?geometries=geojson&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates?.length > 0) {
      return data.routes[0].geometry.coordinates as [number, number][];
    }
  } catch {}
  return generateCurvedPath(origin, dest);
}

function removeRouteLayers(map: mapboxgl.Map) {
  const ids = ["apptaxi-route-line", "apptaxi-route-glow"];
  ids.forEach((id) => {
    try { if (map.getLayer(id)) map.removeLayer(id); } catch {}
    try { if (map.getSource(id)) map.removeSource(id); } catch {}
  });
}

function addRouteToMap(map: mapboxgl.Map, points: [number, number][], color: string) {
  const data: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: points },
  };
  removeRouteLayers(map);
  map.addSource("apptaxi-route-line", { type: "geojson", data });
  map.addLayer({
    id: "apptaxi-route-line",
    type: "line",
    source: "apptaxi-route-line",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": color, "line-width": 5, "line-opacity": 0.85 },
  });
  if (points.length > 2) {
    map.addSource("apptaxi-route-glow", { type: "geojson", data });
    map.addLayer({
      id: "apptaxi-route-glow",
      type: "line",
      source: "apptaxi-route-glow",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": color, "line-width": 12, "line-opacity": 0.2 },
    });
  }
}

export default function MapboxMap({
  height = "400px",
  markers = [],
  routes = [],
  center = [-77.0428, -12.0464],
  zoom = 12,
  interactive = true,
  onClick,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!container.current || map.current) return;
    mapboxgl.accessToken = TOKEN;
    const m = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
      interactive,
    });
    m.addControl(new mapboxgl.NavigationControl(), "top-right");
    m.on("load", () => setLoaded(true));
    if (interactive && onClick) {
      m.on("click", (e) => onClick(e.lngLat.lng, e.lngLat.lat));
    }
    map.current = m;
  }, []);

  useEffect(() => {
    if (!map.current || !loaded) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full border-2 border-white shadow";
      el.style.backgroundColor = m.color || "#eab308";
      el.title = m.label || "";
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [markers, loaded]);

  useEffect(() => {
    if (!map.current || !loaded) return;
    removeRouteLayers(map.current);
    if (routes.length > 0) {
      addRouteToMap(map.current, routes[0].points, routes[0].color || "#eab308");
      if (routes[0].points.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds([routes[0].points[0], routes[0].points[0]]);
        routes[0].points.forEach((p) => bounds.extend(p));
        map.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    }
  }, [routes, loaded]);

  return <div ref={container} className="rounded-lg" style={{ width: "100%", height }} />;
}
