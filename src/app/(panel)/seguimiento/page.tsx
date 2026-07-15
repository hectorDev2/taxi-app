"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Header from "@/components/header";
import MapboxMap from "@/components/map";
import { createClient } from "@/lib/supabase/client";
import { useTripsRealtime } from "@/lib/services/realtime";
import { TRIP_STATUS_MAP } from "@/lib/services/types";
import { Car, MapPin, Clock, Navigation, User, Wifi, WifiOff } from "lucide-react";
import type { RealtimePostgresChangesPayload } from "@supabase/realtime-js";
import type { Tables } from "@/lib/database.types";

type TripRow = Tables<"trips">;

interface DriverMarker {
  tripId: string;
  driverId: string;
  driverName: string;
  vehicleCode: string;
  status: string;
  lat: number;
  lng: number;
  pickupAddress: string;
  dropoffAddress: string;
  updatedAt: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  assigned: "#f59e0b",
  accepted: "#3b82f6",
  arrived: "#8b5cf6",
  in_progress: "#10b981",
};

const STATUS_LABEL: Record<string, string> = {
  assigned: "Asignado",
  accepted: "Aceptado",
  arrived: "En punto",
  in_progress: "En viaje",
};

function secondsAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

export default function SeguimientoPage() {
  const [drivers, setDrivers] = useState<DriverMarker[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const driversRef = useRef<DriverMarker[]>([]);
  driversRef.current = drivers;

  const cargarViajes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select(`
        id, status, driver_id,
        pickup_address, dropoff_address,
        driver_current_latitude, driver_current_longitude,
        driver_location_updated_at,
        profiles!trips_driver_id_fkey(full_name),
        vehicles!trips_vehicle_id_fkey(code)
      `)
      .in("status", ["assigned", "accepted", "arrived", "in_progress"])
      .not("driver_id", "is", null);

    if (!data) return;

    const markers: DriverMarker[] = data
      .filter((t) => t.driver_current_latitude && t.driver_current_longitude)
      .map((t) => ({
        tripId: t.id,
        driverId: t.driver_id!,
        driverName: (t.profiles as any)?.full_name ?? "Conductor",
        vehicleCode: (t.vehicles as any)?.code ?? "—",
        status: t.status,
        lat: t.driver_current_latitude!,
        lng: t.driver_current_longitude!,
        pickupAddress: t.pickup_address ?? "",
        dropoffAddress: t.dropoff_address ?? "",
        updatedAt: t.driver_location_updated_at,
      }));

    setDrivers(markers);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarViajes();
    const interval = setInterval(cargarViajes, 30_000);
    return () => clearInterval(interval);
  }, [cargarViajes]);

  // Realtime: actualizar posición cuando cambia trips
  useTripsRealtime((payload: RealtimePostgresChangesPayload<TripRow>) => {
    const row = payload.new as TripRow;
    if (!row?.id) return;

    setDrivers((prev) => {
      // Si el viaje ya estaba en lista y actualizó ubicación
      const idx = prev.findIndex((d) => d.tripId === row.id);
      if (idx >= 0) {
        if (!["assigned", "accepted", "arrived", "in_progress"].includes(row.status)) {
          // Viaje terminó/cancelado → remover
          return prev.filter((_, i) => i !== idx);
        }
        if (row.driver_current_latitude && row.driver_current_longitude) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lat: row.driver_current_latitude,
            lng: row.driver_current_longitude,
            updatedAt: row.driver_location_updated_at,
            status: row.status,
          };
          return updated;
        }
        return prev;
      }
      // Viaje nuevo activo con ubicación
      if (
        ["assigned", "accepted", "arrived", "in_progress"].includes(row.status) &&
        row.driver_current_latitude &&
        row.driver_current_longitude
      ) {
        cargarViajes(); // refetch para obtener nombres
      }
      return prev;
    });
  });

  const selectedDriver = drivers.find((d) => d.tripId === selected);

  const markers = drivers.map((d) => ({
    lat: d.lat,
    lng: d.lng,
    type: "taxi" as const,
    color: STATUS_COLOR[d.status] ?? "#6b7280",
    label: d.driverName,
    popupHtml: `<div style="font-size:12px;font-weight:600">${d.driverName}</div><div style="font-size:11px;color:#6b7280">${d.vehicleCode} · ${STATUS_LABEL[d.status] ?? d.status}</div>`,
    onClick: () => setSelected((prev) => (prev === d.tripId ? null : d.tripId)),
  }));

  const center: [number, number] = drivers.length > 0
    ? [drivers[0].lng, drivers[0].lat]
    : [-72.88, -13.6348];

  return (
    <div className="flex flex-col h-screen">
      <Header title="Seguimiento en vivo" subtitle="Monitoreo en tiempo real de conductores" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white/90 backdrop-blur-xl border-r border-gray-200/60 flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Vehículos activos</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {drivers.length}
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Cargando...
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 text-sm px-6 text-center">
              <Car className="w-8 h-8 opacity-30" />
              <p>Sin vehículos activos con GPS</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {drivers.map((d) => (
                <li key={d.tripId}>
                  <button
                    onClick={() => setSelected((prev) => (prev === d.tripId ? null : d.tripId))}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                      selected === d.tripId ? "bg-blue-50 border-l-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLOR[d.status] ?? "#6b7280" }}
                        />
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">
                          {d.driverName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{d.vehicleCode}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                        style={{ backgroundColor: STATUS_COLOR[d.status] ?? "#6b7280" }}
                      >
                        {STATUS_LABEL[d.status] ?? d.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      GPS: {secondsAgo(d.updatedAt)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Mapa + panel detalle */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <MapboxMap
            height="100%"
            markers={markers}
            center={center}
            zoom={14}
          />

          {/* Panel detalle del conductor seleccionado */}
          {selectedDriver && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: STATUS_COLOR[selectedDriver.status] ?? "#6b7280" }}
                  >
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedDriver.driverName}</p>
                    <p className="text-xs text-gray-500">{selectedDriver.vehicleCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="truncate">{selectedDriver.pickupAddress}</span>
                </div>
                <div className="flex gap-2">
                  <Navigation className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span className="truncate">{selectedDriver.dropoffAddress}</span>
                </div>
                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <Wifi className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span>GPS actualizado {secondsAgo(selectedDriver.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
