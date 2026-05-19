"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || "";

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
}

export async function fetchRoute(origin: [number, number], dest: [number, number]): Promise<[number, number][]> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?geometries=geojson&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates as [number, number][];
    }
  } catch {}
  return [origin, dest];
}

export default function MapboxMap({
  height = "400px",
  markers = [],
  routes = [],
  center = [-77.0428, -12.0464],
  zoom = 12,
  interactive = true,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!container.current || map.current) return;
    mapboxgl.accessToken = TOKEN;
    map.current = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
      interactive,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, []);

  useEffect(() => {
    if (!map.current) return;
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
  }, [markers]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const existing = document.querySelectorAll(".apptaxi-route-layer");
    existing.forEach((el) => el.remove());
    routes.forEach((route, i) => {
      const id = `route-${i}`;
      map.current!.addSource(id, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.points } },
      });
      map.current!.addLayer({
        id,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": route.color || "#3b82f6", "line-width": 4, "line-opacity": 0.8 },
      });
    });
  }, [routes]);

  return <div ref={container} className="rounded-lg apptaxi-map" style={{ width: "100%", height }} />;
}
