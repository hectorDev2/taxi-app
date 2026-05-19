"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Save } from "lucide-react";
import { api } from "@/lib/mock-api";
import type { TarifaConfig } from "@/lib/mock-data";

export default function ConfiguracionPage() {
  const [tarifas, setTarifas] = useState<TarifaConfig | null>(null);

  useEffect(() => {
    api.tarifas.get().then((list) => {
      if (list.length > 0) setTarifas(list[0]);
    });
  }, []);

  return (
    <div>
      <Header title="Configuración" />

      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Parámetros de Tarifa</h3>
          {tarifas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Base (S/)</label>
                <input type="number" defaultValue={tarifas.tarifa_base} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Km (S/)</label>
                <input type="number" defaultValue={tarifas.costo_por_km} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Minuto (S/)</label>
                <input type="number" defaultValue={tarifas.costo_por_minuto} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recargo Nocturno (%)</label>
                <input type="number" defaultValue={tarifas.recargo_nocturno} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recargo por Tipo de Unidad (%)</label>
                <input type="number" defaultValue={tarifas.recargo_tipo_unidad} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vigente desde</label>
                <input type="text" defaultValue={tarifas.vigente_desde} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none" />
              </div>
            </div>
          )}
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
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm">
                <option>5 segundos</option>
                <option>10 segundos</option>
                <option selected>15 segundos</option>
                <option>30 segundos</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Retención de ubicaciones históricas</p>
                <p className="text-xs text-gray-500">Tiempo que se conservan las ubicaciones en la base de datos</p>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm">
                <option>7 días</option>
                <option selected>30 días</option>
                <option>90 días</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors">
            <Save className="w-5 h-5" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
