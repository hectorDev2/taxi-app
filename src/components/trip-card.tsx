"use client";

import { Phone, MapPin, X } from "lucide-react";
import MapboxMap from "@/components/map";
import { getEstadoFlujo } from "@/lib/constants";

const accentStyles = {
  yellow: {
    bg: "bg-yellow-400",
    ring: "ring-yellow-200",
    text: "text-yellow-700",
  },
  blue: {
    bg: "bg-blue-500",
    ring: "ring-blue-200",
    text: "text-blue-700",
  },
};

interface TripCardProps {
  viaje: any;
  miUbicacion: { lat: number; lng: number } | null;
  ruta: [number, number][] | null;
  actualizando: string | null;
  accent?: "yellow" | "blue";
  flujoStartKey?: "pendiente" | "asignada";
  onActualizarEstado: (tripId: string, nuevoEstado: string) => void;
  onCancelarClick: (tripId: string) => void;
}

export default function TripCard({
  viaje,
  miUbicacion,
  ruta,
  actualizando,
  accent = "yellow",
  flujoStartKey = "pendiente",
  onActualizarEstado,
  onCancelarClick,
}: TripCardProps) {
  const ESTADOS_FLUJO = getEstadoFlujo(flujoStartKey);
  const idx = ESTADOS_FLUJO.findIndex((e) => e.key === viaje.estado);
  const c = accentStyles[accent];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">{viaje.codigo}</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
            viaje.estado === "pendiente" || viaje.estado === "asignada" ? "bg-yellow-100 text-yellow-700" :
            viaje.estado === "aceptada" ? "bg-indigo-100 text-indigo-700" :
            viaje.estado === "conductor_llego" ? "bg-orange-100 text-orange-700" :
            viaje.estado === "servicio_iniciado" ? "bg-purple-100 text-purple-700" :
            "bg-green-100 text-green-700"
          }`}>
            {viaje.estado.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-3">
          {ESTADOS_FLUJO.map((est, i) => {
            const done = i <= idx;
            const current = i === idx;
            return (
              <div key={est.key} className="flex-1 flex flex-col items-center">
                <div className={`w-full h-1 rounded-full ${done ? c.bg : "bg-gray-200"}`} />
                <div className={`mt-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                  current ? `${c.bg} ${c.ring}` :
                  done ? c.bg : "bg-gray-100"
                }`}>
                  <est.icon className={`w-3 h-3 ${done ? "text-white" : "text-gray-400"}`} />
                </div>
                <span className={`text-[10px] mt-1 ${done ? `${c.text} font-medium` : "text-gray-400"}`}>
                  {est.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Pasajero</p>
            <p className="font-medium text-gray-900 truncate">{viaje.nombre_pasajero}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Teléfono</p>
            {viaje.telefono_pasajero ? (
              <a href={`tel:${viaje.telefono_pasajero}`} className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {viaje.telefono_pasajero}
              </a>
            ) : <p className="text-gray-500">—</p>}
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Recojo</p>
            <p className="text-gray-900 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
              {viaje.punto_recojo_texto}
            </p>
          </div>
          {viaje.punto_destino_texto && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Destino</p>
              <p className="text-gray-900 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                {viaje.punto_destino_texto}
              </p>
            </div>
          )}
        </div>
      </div>

      {viaje.latitud_recojo && viaje.longitud_recojo && (
        <div className="mx-5 mb-4">
          <MapboxMap
            height="150px"
            markers={[
              ...(miUbicacion
                ? [{ lat: miUbicacion.lat, lng: miUbicacion.lng, color: "#3b82f6", label: "Mi ubicación", type: "taxi" as const }]
                : []),
              { lat: viaje.latitud_recojo, lng: viaje.longitud_recojo, color: "#eab308", label: "Recojo", type: "person" },
              ...(viaje.latitud_destino && viaje.longitud_destino
                ? [{ lat: viaje.latitud_destino, lng: viaje.longitud_destino, color: "#ef4444", label: "Destino", type: "destino" as const }]
                : []),
            ]}
            routes={ruta ? [{ points: ruta, color: "#3b82f6" }] : []}
            center={miUbicacion ? [miUbicacion.lng, miUbicacion.lat] : [viaje.longitud_recojo, viaje.latitud_recojo]}
            zoom={13}
            interactive={false}
          />
        </div>
      )}

      <div className="flex gap-2 px-5 pb-5">
        {(viaje.estado === "pendiente" || viaje.estado === "asignada") ? (
          <button
            onClick={() => onActualizarEstado(viaje.id, "aceptada")}
            disabled={actualizando === viaje.id}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {actualizando === viaje.id ? "..." : "Aceptar Viaje"}
          </button>
        ) : null}
        {viaje.estado === "aceptada" ? (
          <button
            onClick={() => onActualizarEstado(viaje.id, "conductor_llego")}
            disabled={actualizando === viaje.id}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {actualizando === viaje.id ? "..." : "Llegué al Recojo"}
          </button>
        ) : null}
        {viaje.estado === "conductor_llego" ? (
          <button
            onClick={() => onActualizarEstado(viaje.id, "servicio_iniciado")}
            disabled={actualizando === viaje.id}
            className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-200 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {actualizando === viaje.id ? "..." : "Iniciar Servicio"}
          </button>
        ) : null}
        {viaje.estado === "servicio_iniciado" ? (
          <button
            onClick={() => onActualizarEstado(viaje.id, "servicio_completado")}
            disabled={actualizando === viaje.id}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {actualizando === viaje.id ? "..." : "Completar Viaje"}
          </button>
        ) : null}
        {viaje.estado !== "servicio_completado" && viaje.estado !== "cancelada" ? (
          <button
            onClick={() => onCancelarClick(viaje.id)}
            className="px-4 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
