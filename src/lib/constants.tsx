import { Car, CheckCircle, Clock, MapPin, Navigation, Star, Wifi, WifiOff } from "lucide-react";
import type { ElementType } from "react";

// ─── Trip Status Badges (panel solicitudes + detalle-modal) ───

export const TRIP_STATUS_BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  asignada: "bg-blue-100 text-blue-700",
  aceptada: "bg-indigo-100 text-indigo-700",
  conductor_llego: "bg-orange-100 text-orange-700",
  servicio_iniciado: "bg-purple-100 text-purple-700",
  servicio_completado: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

// ─── Vehicle Status Badges (unidades page) ───

export const VEHICLE_STATUS_BADGE: Record<string, string> = {
  libre: "bg-green-100 text-green-700",
  asignado: "bg-yellow-100 text-yellow-700",
  esperando_pasajero: "bg-orange-100 text-orange-700",
  ocupado: "bg-blue-100 text-blue-700",
  fuera_servicio: "bg-red-100 text-red-700",
  desconectado: "bg-gray-100 text-gray-700",
};

export const VEHICLE_STATUS_ICON: Record<string, ElementType> = {
  libre: Wifi,
  asignado: Wifi,
  esperando_pasajero: Wifi,
  ocupado: Wifi,
  fuera_servicio: WifiOff,
  desconectado: WifiOff,
};

// ─── Trip Status Flow (dashboard + driver dashboard) ───

const FLUJO_COMPLETO = [
  { key: "pendiente", label: "Pendiente", icon: Clock },
  { key: "asignada", label: "Asignado", icon: Car },
  { key: "aceptada", label: "Aceptado", icon: CheckCircle },
  { key: "conductor_llego", label: "Llegué", icon: MapPin },
  { key: "servicio_iniciado", label: "En Viaje", icon: Navigation },
  { key: "servicio_completado", label: "Completado", icon: Star },
];

/**
 * Returns a slice of the full status flow starting from `startKey`.
 *
 * - "pendiente" → [pendiente, asignada, aceptada, conductor_llego, servicio_iniciado, servicio_completado]
 * - "asignada"  → [asignada, aceptada, conductor_llego, servicio_iniciado, servicio_completado]
 */
export function getEstadoFlujo(startKey: string) {
  const idx = FLUJO_COMPLETO.findIndex((e) => e.key === startKey);
  if (idx === -1) return FLUJO_COMPLETO;
  return FLUJO_COMPLETO.slice(idx);
}
