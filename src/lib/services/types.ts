import type { Tables } from "@/lib/database.types";

export type ProfileRow = Tables<"profiles">;
export type VehicleRow = Tables<"vehicles">;
export type TripRow = Tables<"trips">;
export type TripStatusHistoryRow = Tables<"trip_status_history">;
export type PaymentRow = Tables<"payments">;

export type AppRole = "admin" | "operador" | "conductor";

export const ROLE_MAP: Record<string, AppRole> = {
  admin: "admin",
  operator: "operador",
  driver: "conductor",
};

export const ROLE_MAP_REVERSE: Record<AppRole, string> = {
  admin: "admin",
  operador: "operator",
  conductor: "driver",
};

export const TRIP_STATUS_MAP: Record<string, string> = {
  pending: "pendiente",
  accepted: "aceptada",
  arrived: "conductor_llego",
  in_progress: "servicio_iniciado",
  completed: "servicio_completado",
  cancelled: "cancelada",
};

export const TRIP_STATUS_MAP_REVERSE: Record<string, string> = {
  pendiente: "pending",
  asignada: "pending",
  aceptada: "accepted",
  conductor_llego: "arrived",
  servicio_iniciado: "in_progress",
  servicio_completado: "completed",
  cancelada: "cancelled",
};

export interface AppUser {
  id: string;
  supabase_id: string;
  nombres: string;
  email: string;
  telefono: string;
  rol: AppRole;
  estado: "activo" | "inactivo";
  created_at: string;
}

export interface AppVehicle {
  id: string;
  codigo: string;
  placa: string;
  tipo_unidad: "pasajeros" | "carga_pasajeros";
  capacidad: number;
  estado_actual: string;
  activa: boolean;
  conductor_asignado?: string;
  conductor_id?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
}

export interface AppVehicleLocation {
  unidad_id: string;
  latitud: number;
  longitud: number;
  velocidad: number;
  fecha_hora: string;
  codigo?: string;
  placa?: string;
}

export interface AppTrip {
  id: string;
  codigo: string;
  canal_origen: "telefono" | "app" | "presencial";
  nombre_pasajero: string;
  telefono_pasajero: string;
  punto_recojo_texto: string;
  latitud_recojo: number;
  longitud_recojo: number;
  punto_destino_texto?: string;
  latitud_destino?: number;
  longitud_destino?: number;
  tipo_servicio: "pasajeros" | "carga_pasajeros";
  estado: string;
  operador_id: string;
  conductor_id?: string;
  unidad_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AppTariffConfig {
  id: string;
  nombre: string;
  tarifa_base: number;
  costo_por_km: number;
  costo_por_minuto: number;
  recargo_nocturno: number;
  recargo_tipo_unidad: number;
  vigente_desde: string;
}

export interface ServiceHistoryItem {
  id: string;
  solicitud_id: string;
  tarifa_sugerida: number;
  tarifa_final?: number;
  distancia_estimada_km: number;
  duracion_estimada_min: number;
  distancia_real_km?: number;
  duracion_real_min?: number;
  estado_final: string;
}
