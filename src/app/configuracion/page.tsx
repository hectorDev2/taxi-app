"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Save, Loader2 } from "lucide-react";
import { tariffService } from "@/lib/services/tariff-service";
import { useToast } from "@/components/toast";
import type { AppTariffConfig } from "@/lib/services/types";

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [tarifas, setTarifas] = useState<AppTariffConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tarifaBase, setTarifaBase] = useState(0);
  const [costoKm, setCostoKm] = useState(0);
  const [costoMin, setCostoMin] = useState(0);
  const [recargoNocturno, setRecargoNocturno] = useState(0);
  const [recargoTipo, setRecargoTipo] = useState(0);
  const [frecuenciaGps, setFrecuenciaGps] = useState("15");
  const [retencionHist, setRetencionHist] = useState("30");

  useEffect(() => {
    tariffService.get()
      .then((list) => {
        if (list.length > 0) {
          const t = list[0];
          setTarifas(t);
          setTarifaBase(t.tarifa_base);
          setCostoKm(t.costo_por_km);
          setCostoMin(t.costo_por_minuto);
          setRecargoNocturno(t.recargo_nocturno);
          setRecargoTipo(t.recargo_tipo_unidad);
        }
      })
      .catch(() => toast("Error al cargar configuraci\u00f3n", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!tarifas) return;
    setSaving(true);
    try {
      await tariffService.update(tarifas.id, {
        tarifa_base: tarifaBase,
        costo_por_km: costoKm,
        costo_por_minuto: costoMin,
        recargo_nocturno: recargoNocturno,
        recargo_tipo_unidad: recargoTipo,
      });
      toast("Configuraci\u00f3n guardada exitosamente");
    } catch {
      toast("Error al guardar configuraci\u00f3n", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Configuración" />
        <div className="p-8 flex items-center justify-center text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Configuración" />

      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Parámetros de Tarifa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Base (S/)</label>
              <input type="number" value={tarifaBase} onChange={(e) => setTarifaBase(Number(e.target.value))} step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Km (S/)</label>
              <input type="number" value={costoKm} onChange={(e) => setCostoKm(Number(e.target.value))} step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Minuto (S/)</label>
              <input type="number" value={costoMin} onChange={(e) => setCostoMin(Number(e.target.value))} step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recargo Nocturno (%)</label>
              <input type="number" value={recargoNocturno} onChange={(e) => setRecargoNocturno(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recargo por Tipo de Unidad (%)</label>
              <input type="number" value={recargoTipo} onChange={(e) => setRecargoTipo(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigente desde</label>
              <input type="text" value={tarifas?.vigente_desde || ""} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipos de Unidad</h3>
          <div className="space-y-3">
            {[
              { nombre: "Pasajeros", capacidad: "4 asientos" },
              { nombre: "Carga + Pasajeros", capacidad: "6 asientos" },
            ].map((tipo) => (
              <div key={tipo.nombre} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">{tipo.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">{tipo.capacidad}</span>
                </div>
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferencias Generales</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Frecuencia de envío de ubicación</p>
                <p className="text-xs text-gray-500">Cada cuántos segundos se actualiza la posición del conductor</p>
              </div>
              <select value={frecuenciaGps} onChange={(e) => setFrecuenciaGps(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm">
                <option value="5">5 segundos</option>
                <option value="10">10 segundos</option>
                <option value="15">15 segundos</option>
                <option value="30">30 segundos</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Retención de ubicaciones históricas</p>
                <p className="text-xs text-gray-500">Tiempo que se conservan las ubicaciones en la base de datos</p>
              </div>
              <select value={retencionHist} onChange={(e) => setRetencionHist(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm">
                <option value="7">7 días</option>
                <option value="30">30 días</option>
                <option value="90">90 días</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
