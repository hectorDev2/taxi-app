import { createClient } from "@/lib/supabase/client";
import type { AppVehicle, AppVehicleLocation } from "./types";

function mapVehicle(row: any, driverName?: string): AppVehicle {
  return {
    id: row.id,
    codigo: row.code || `V-${row.id?.slice(0, 4)?.toUpperCase()}`,
    placa: row.license_plate,
    tipo_unidad: (row.vehicle_type === "cargo_passengers" ? "carga_pasajeros" : "pasajeros") as AppVehicle["tipo_unidad"],
    capacidad: row.seats || 4,
    estado_actual: row.is_active ? "libre" : "fuera_servicio",
    activa: row.is_active,
    conductor_asignado: driverName,
    conductor_id: row.owner_id,
    marca: row.brand,
    modelo: row.model,
    anio: row.year,
  };
}

export const vehicleService = {
  async list(): Promise<AppVehicle[]> {
    const supabase = createClient();
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("*, profiles!vehicles_owner_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    return (vehicles || []).map((v: any) =>
      mapVehicle(v, v.profiles?.full_name || undefined)
    );
  },

  async getById(id: string): Promise<AppVehicle | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("vehicles")
      .select("*, profiles!vehicles_owner_id_fkey(full_name)")
      .eq("id", id)
      .single();
    if (!data) return null;
    return mapVehicle(data, (data as any).profiles?.full_name || undefined);
  },

  async create(input: {
    codigo: string;
    placa: string;
    marca?: string;
    modelo?: string;
    anio?: number;
    tipo_unidad: AppVehicle["tipo_unidad"];
    capacidad: number;
    conductor_id: string;
  }): Promise<AppVehicle | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("vehicles")
      .insert({
        code: input.codigo,
        license_plate: input.placa,
        brand: input.marca || null,
        model: input.modelo || null,
        year: input.anio || null,
        vehicle_type: input.tipo_unidad === "carga_pasajeros" ? "cargo_passengers" : "passengers",
        seats: input.capacidad,
        owner_id: input.conductor_id,
        is_active: true,
      } as any)
      .select("*, profiles!vehicles_owner_id_fkey(full_name)")
      .single();
    if (!data) return null;
    return mapVehicle(data, (data as any).profiles?.full_name || undefined);
  },

  async update(id: string, input: Partial<AppVehicle>): Promise<AppVehicle | null> {
    const supabase = createClient();
    const updates: Record<string, any> = {};
    if (input.placa) updates.license_plate = input.placa;
    if (input.tipo_unidad) updates.vehicle_type = input.tipo_unidad === "carga_pasajeros" ? "cargo_passengers" : "passengers";
    if (input.capacidad) updates.seats = input.capacidad;
    if (input.activa !== undefined) updates.is_active = input.activa;
    if (input.codigo) updates.code = input.codigo;
    if (input.marca) updates.brand = input.marca;
    if (input.modelo) updates.model = input.modelo;
    if (input.anio) updates.year = input.anio;
    const { data } = await supabase
      .from("vehicles")
      .update(updates as any)
      .eq("id", id)
      .select("*, profiles!vehicles_owner_id_fkey(full_name)")
      .single();
    if (!data) return null;
    return mapVehicle(data, (data as any).profiles?.full_name || undefined);
  },

  async getUbicaciones(): Promise<AppVehicleLocation[]> {
    const supabase = createClient();
    const { data: drivers } = await supabase
      .from("profiles")
      .select("id, full_name, current_latitude, current_longitude, last_location_update")
      .eq("role", "driver")
      .not("current_latitude", "is", null)
      .not("current_longitude", "is", null);
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, code, license_plate, owner_id");
    const vehicleMap = new Map((vehicles || []).map((v) => [v.owner_id, v]));
    return (drivers || []).map((d) => {
      const v = vehicleMap.get(d.id);
      return {
        unidad_id: v?.id || d.id,
        latitud: d.current_latitude!,
        longitud: d.current_longitude!,
        velocidad: 0,
        fecha_hora: d.last_location_update || new Date().toISOString(),
        codigo: (v as any)?.code || undefined,
        placa: (v as any)?.license_plate || undefined,
      };
    });
  },

  async getUbicacion(vehicleId: string): Promise<AppVehicleLocation | null> {
    const supabase = createClient();
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, code, license_plate, owner_id")
      .eq("id", vehicleId)
      .single();
    if (!vehicle) return null;
    const { data: driver } = await supabase
      .from("profiles")
      .select("current_latitude, current_longitude, last_location_update")
      .eq("id", vehicle.owner_id)
      .single();
    if (!driver?.current_latitude || !driver?.current_longitude) return null;
    return {
      unidad_id: vehicle.id,
      latitud: driver.current_latitude,
      longitud: driver.current_longitude,
      velocidad: 0,
      fecha_hora: driver.last_location_update || new Date().toISOString(),
      codigo: vehicle.code || undefined,
      placa: vehicle.license_plate || undefined,
    };
  },

  async nearestUnits(lat: number, lng: number, tipo?: string): Promise<any[]> {
    const supabase = createClient();
    const tipoFiltro = tipo === "carga_pasajeros" ? "cargo_passengers" : undefined;
    const { data } = await supabase.rpc("nearby_drivers", {
      lat,
      lng,
      radius_km: 10,
    });
    if (!data) return [];
    return data
      .filter((d: any) => !tipoFiltro || (d as any).vehicle_type === tipoFiltro)
      .map((d: any) => ({
        id: (d as any).vehicle_id,
        codigo: `V-${(d as any).vehicle_id?.slice(0, 4)?.toUpperCase()}`,
        placa: "",
        tipo_unidad: (d as any).vehicle_type === "cargo_passengers" ? "carga_pasajeros" : "pasajeros",
        capacidad: (d as any).vehicle_seats,
        estado_actual: "libre",
        activa: true,
        conductor_asignado: (d as any).full_name,
        distancia: (d as any).distance_km,
        conductor_id: (d as any).id,
      }));
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    return !error;
  },

  subscribe(callback: (payload: any) => void) {
    const supabase = createClient();
    return supabase
      .channel("vehicles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, callback)
      .subscribe();
  },
};
