"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Marker {
  lat: number;
  lng: number;
  color?: string;
  label?: string;
  type?: "taxi" | "person" | "pickup" | "destino";
  onClick?: () => void;
  popupHtml?: string;
  draggable?: boolean;
  onDragEnd?: (lng: number, lat: number) => void;
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

function generateCurvedPath(
  origin: [number, number],
  dest: [number, number],
  steps = 30
): [number, number][] {
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
    pts.push([
      a * origin[0] + b * mid[0] + c * dest[0],
      a * origin[1] + b * mid[1] + c * dest[1],
    ]);
  }
  return pts;
}

export async function fetchRoute(
  origin: [number, number],
  dest: [number, number]
): Promise<[number, number][]> {
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
    try {
      if (map.getLayer(id)) map.removeLayer(id);
    } catch {}
    try {
      if (map.getSource(id)) map.removeSource(id);
    } catch {}
  });
}

function addRouteToMap(
  map: mapboxgl.Map,
  points: [number, number][],
  color: string
) {
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
  center = [-72.8800, -13.6348],
  zoom = 12,
  interactive = true,
  onClick,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const dragCallbacksRef = useRef<
    Map<number, ((lng: number, lat: number) => void) | undefined>
  >(new Map());
  const [loaded, setLoaded] = useState(false);

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

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
    if (interactive) {
      m.on("click", (e) => onClickRef.current?.(e.lngLat.lng, e.lngLat.lat));
    }
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !loaded) return;

    markers.forEach((m, i) => {
      dragCallbacksRef.current.set(i, m.onDragEnd);
    });

    markers.forEach((m, i) => {
      if (i < markersRef.current.length) {
        markersRef.current[i].setLngLat([m.lng, m.lat]);
        return;
      }

      const el = document.createElement("div");
      el.title = m.label || "";

      if (m.type === "taxi") {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${m.color || "#3b82f6"}" stroke="white" stroke-width="1.5"><path d="M5 11l1.5-4.5h11L19 11M3 11v5a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-5l-2-7H5l-2 7z"/><circle cx="7" cy="16" r="1.5" fill="white"/><circle cx="17" cy="16" r="1.5" fill="white"/></svg>`;
        el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
      } else if (m.type === "person") {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${m.color || "#22c55e"}" stroke="white" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>`;
        el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
      } else if (m.type === "pickup") {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${m.color || "#eab308"}" stroke="white" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`;
        el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
      } else if (m.type === "destino") {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${m.color || "#ef4444"}" stroke="white" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
        el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
      } else {
        el.className = "w-4 h-4 rounded-full border-2 border-white shadow";
        el.style.backgroundColor = m.color || "#eab308";
      }

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: m.draggable ?? false,
      })
        .setLngLat([m.lng, m.lat])
        .addTo(map.current!);

      if (m.popupHtml) {
        el.addEventListener("mouseenter", () => {
          if (popupRef.current) popupRef.current.remove();
          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setLngLat([m.lng, m.lat])
            .setHTML(m.popupHtml!)
            .addTo(map.current!);
          popupRef.current = popup;
        });
        el.addEventListener("mouseleave", () => {
          popupRef.current?.remove();
          popupRef.current = null;
        });
      }

      if (m.onClick) {
        el.style.cursor = "pointer";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          m.onClick!();
        });
      }

      if (m.draggable) {
        const idx = i;
        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          dragCallbacksRef.current.get(idx)?.(lngLat.lng, lngLat.lat);
        });
      }

      markersRef.current.push(marker);
    });

    while (markersRef.current.length > markers.length) {
      const m = markersRef.current.pop();
      if (m) {
        m.remove();
        dragCallbacksRef.current.delete(markersRef.current.length);
      }
    }
  }, [markers, loaded]);

  useEffect(() => {
    if (!map.current || !loaded) return;
    removeRouteLayers(map.current);
    if (routes.length > 0) {
      addRouteToMap(
        map.current,
        routes[0].points,
        routes[0].color || "#eab308"
      );
      if (routes[0].points.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds(
          [routes[0].points[0], routes[0].points[0]]
        );
        routes[0].points.forEach((p) => bounds.extend(p));
        map.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    }
  }, [routes, loaded]);

  return (
    <div
      ref={container}
      className="rounded-lg"
      style={{ width: "100%", height }}
    />
  );
}
