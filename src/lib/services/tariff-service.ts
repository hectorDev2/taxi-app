import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import type { AppTariffConfig } from "./types";

function mapTariff(row: Tables<"tariff_config">): AppTariffConfig {
  return {
    id: row.id,
    nombre: row.name,
    tarifa_base: Number(row.base_fare),
    costo_por_km: Number(row.cost_per_km),
    costo_por_minuto: Number(row.cost_per_minute),
    recargo_nocturno: Number(row.night_surcharge),
    recargo_tipo_unidad: Number(row.vehicle_type_surcharge),
    vigente_desde: row.valid_from,
  };
}

export const tariffService = {
  async get(): Promise<AppTariffConfig[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("tariff_config")
      .select("*")
      .order("valid_from", { ascending: false });
    return (data || []).map(mapTariff);
  },

  async update(id: string, input: Partial<AppTariffConfig>): Promise<AppTariffConfig | null> {
    const supabase = createClient();
    const updates: TablesUpdate<"tariff_config"> = {};
    if (input.tarifa_base !== undefined) updates.base_fare = input.tarifa_base;
    if (input.costo_por_km !== undefined) updates.cost_per_km = input.costo_por_km;
    if (input.costo_por_minuto !== undefined) updates.cost_per_minute = input.costo_por_minuto;
    if (input.recargo_nocturno !== undefined) updates.night_surcharge = input.recargo_nocturno;
    if (input.recargo_tipo_unidad !== undefined) updates.vehicle_type_surcharge = input.recargo_tipo_unidad;
    const { data } = await supabase
      .from("tariff_config")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return data ? mapTariff(data) : null;
  },
};
