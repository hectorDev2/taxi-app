import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import type { RealtimePostgresChangesPayload } from "@supabase/realtime-js";
import type { AppTrip, ServiceHistoryItem } from "./types";
import { TRIP_STATUS_MAP, TRIP_STATUS_MAP_REVERSE } from "./types";

function mapTrip(row: Tables<"trips">): AppTrip {
  return {
    id: row.id,
    codigo: row.code || `S-${row.id?.slice(0, 4)?.toUpperCase()}`,
    canal_origen: (row.channel === "whatsapp" ? "whatsapp" : row.channel === "phone" ? "telefono" : row.channel === "app" ? "app" : row.channel === "presencial" ? "presencial" : "telefono") as AppTrip["canal_origen"],
    nombre_pasajero: row.passenger_name || "",
    telefono_pasajero: row.passenger_phone || "",
    punto_recojo_texto: row.pickup_address || "",
    latitud_recojo: row.pickup_latitude,
    longitud_recojo: row.pickup_longitude,
    punto_destino_texto: row.dropoff_address || undefined,
    latitud_destino: row.dropoff_latitude || undefined,
    longitud_destino: row.dropoff_longitude || undefined,
    tipo_servicio: (row.service_type === "cargo_passengers" ? "carga_pasajeros" : "pasajeros") as AppTrip["tipo_servicio"],
    estado: TRIP_STATUS_MAP[row.status] || row.status,
    operador_id: row.operator_id || row.passenger_id,
    conductor_id: row.driver_id ?? undefined,
    unidad_id: row.vehicle_id ?? undefined,
    created_at: row.requested_at,
    updated_at: row.updated_at,
  };
}

export const tripService = {
  async list(): Promise<AppTrip[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .order("requested_at", { ascending: false });
    return (data || []).map(mapTrip);
  },

  async getById(id: string): Promise<AppTrip | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single();
    return data ? mapTrip(data) : null;
  },

  async create(input: {
    passenger_name: string;
    passenger_phone?: string;
    pickup_address: string;
    pickup_latitude: number;
    pickup_longitude: number;
    dropoff_address?: string;
    dropoff_latitude?: number;
    dropoff_longitude?: number;
    service_type: string;
    channel: string;
    operator_id: string;
  }): Promise<AppTrip | null> {
    const supabase = createClient();
    const code = `S-${Date.now().toString(36).toUpperCase()}`;
    const { data } = await supabase
      .from("trips")
      .insert({
        code,
        passenger_name: input.passenger_name,
        passenger_phone: input.passenger_phone || null,
        pickup_address: input.pickup_address,
        pickup_latitude: input.pickup_latitude,
        pickup_longitude: input.pickup_longitude,
        dropoff_address: input.dropoff_address || null,
        dropoff_latitude: input.dropoff_latitude ?? null,
        dropoff_longitude: input.dropoff_longitude ?? null,
        service_type: input.service_type,
        channel: input.channel,
        operator_id: input.operator_id,
        passenger_id: input.operator_id,
        status: "pending",
      // FIXME: supabase strict typing — dropoff_latitude/dropoff_longitude are non-nullable in
      // generated types but we pass null when not provided, which the DB allows at the constraint level
      } as any)
      .select()
      .single();
    return data ? mapTrip(data) : null;
  },

  async assign(tripId: string, vehicleId: string, driverId: string, operatorId: string): Promise<AppTrip | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .update({
        driver_id: driverId,
        vehicle_id: vehicleId,
        operator_id: operatorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tripId)
      .select()
      .single();
    return data ? mapTrip(data) : null;
  },

  async updateStatus(tripId: string, mockStatus: string, changedBy?: string): Promise<AppTrip | null> {
    const supabase = createClient();
    const dbStatus = TRIP_STATUS_MAP_REVERSE[mockStatus] || mockStatus;
    const now = new Date().toISOString();
    const updates: TablesUpdate<"trips"> & { cancelled_by?: string } = {
      status: dbStatus,
      updated_at: now,
    };
    if (dbStatus === "accepted") updates.accepted_at = now;
    if (dbStatus === "arrived") updates.arrived_at = now;
    if (dbStatus === "in_progress") updates.started_at = now;
    if (dbStatus === "completed") updates.completed_at = now;
    if (dbStatus === "cancelled") {
      updates.cancelled_at = now;
      updates.cancelled_by = changedBy || "system";
    }
    const { data } = await supabase
      .from("trips")
      .update(updates)
      .eq("id", tripId)
      .select()
      .single();
    return data ? mapTrip(data) : null;
  },

  async cancel(tripId: string, reason: string, cancelledBy: string): Promise<AppTrip | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .update({
        status: "cancelled",
        cancel_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies TablesUpdate<"trips">)
      .eq("id", tripId)
      .select()
      .single();
    return data ? mapTrip(data) : null;
  },

  async getHistorial(): Promise<ServiceHistoryItem[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .in("status", ["completed", "cancelled"])
      .order("updated_at", { ascending: false });
    return (data || []).map((row) => ({
      id: row.id,
      solicitud_id: row.id,
      tarifa_sugerida: Number(row.estimated_price) || 0,
      tarifa_final: Number(row.final_price) || undefined,
      distancia_estimada_km: 0,
      duracion_estimada_min: 0,
      distancia_real_km: undefined,
      duracion_real_min: undefined,
      estado_final: row.status === "completed" ? "completado" : "cancelada",
    }));
  },

  async getEstadisticas(): Promise<Record<string, number>> {
    const supabase = createClient();
    const { data: trips } = await supabase.from("trips").select("status, requested_at, driver_id");
    const all = trips || [];
    const hoy = new Date().toISOString().split("T")[0];

    const activeStatuses = ["accepted", "arrived", "in_progress"];
    const activas = all.filter((t) => activeStatuses.includes(t.status));
    const driverIdsActivas = new Set(activas.map((t) => t.driver_id).filter(Boolean));

    const serviciosHoy = all.filter((t) => t.requested_at?.startsWith(hoy) || false).length;

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, is_active, owner_id")
      .eq("is_active", true)
      .not("owner_id", "is", null);

    const allVehicles = vehicles || [];
    // Libres = active vehicles with a driver assigned that are NOT in an active trip
    const libres = allVehicles.filter((v) => !driverIdsActivas.has(v.owner_id)).length;
    const ocupadas = driverIdsActivas.size;
    const totalVehicles = allVehicles.length + (allVehicles.filter((v) => !v.is_active).length || 0);

    return {
      libres,
      ocupadas,
      fueraServicio: 0,
      desconectadas: 0,
      serviciosHoy,
      total: totalVehicles,
    };
  },

  async exportHistorialCSV(): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .in("status", ["completed", "cancelled"])
      .order("updated_at", { ascending: false });
    const rows = (data || []).map((t) => {
      return `${t.code || ""},${t.requested_at?.split("T")[0] || ""},"${t.passenger_name || ""}","${t.pickup_address || ""}",${t.final_price ?? t.estimated_price ?? ""},,${t.status === "completed" ? "completado" : "cancelada"}`;
    });
    return ["Código,Fecha,Pasajero,Origen,Tarifa,Distancia,Estado", ...rows].join("\n");
  },

  subscribe(callback: (payload: RealtimePostgresChangesPayload<Tables<"trips">>) => void) {
    const supabase = createClient();
    return supabase
      .channel("trips-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, callback)
      .subscribe();
  },
};
