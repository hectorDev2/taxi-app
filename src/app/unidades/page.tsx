"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Car, MapPin, Wifi, WifiOff } from "lucide-react";
import { api } from "@/lib/mock-api";

const estadoBadge: Record<string, string> = {
  libre: "bg-green-100 text-green-700",
  asignado: "bg-yellow-100 text-yellow-700",
  esperando_pasajero: "bg-orange-100 text-orange-700",
  ocupado: "bg-blue-100 text-blue-700",
  fuera_servicio: "bg-red-100 text-red-700",
  desconectado: "bg-gray-100 text-gray-700",
};

const estadoIcon: Record<string, React.ElementType> = {
  libre: Wifi,
  asignado: Wifi,
  esperando_pasajero: Wifi,
  ocupado: Wifi,
  fuera_servicio: WifiOff,
  desconectado: WifiOff,
};

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<any[]>([]);

  useEffect(() => {
    api.unidades.list().then(setUnidades);
  }, []);

  return (
    <div>
      <Header title="Unidades" />

      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Libres", filter: "libre", color: "bg-green-500" },
            { label: "Asignadas", filter: "asignado", color: "bg-yellow-500" },
            { label: "Ocupadas", filter: "ocupado", color: "bg-blue-500" },
            { label: "F. Servicio", filter: "fuera_servicio", color: "bg-red-500" },
          ].map((item) => (
            <div key={item.filter} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{unidades.filter((u) => u.estado_actual === item.filter).length}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mapa de Flota</h3>
          <div className="bg-gray-100 rounded-lg h-[300px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MapPin className="w-10 h-10 mx-auto mb-2" />
              <p>Visualización de unidades en tiempo real</p>
              <p className="text-sm">(requiere integración con Google Maps)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Unidad</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Placa</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Capacidad</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Conductor</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => {
                const Icon = estadoIcon[u.estado_actual] || Wifi;
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.placa}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.tipo_unidad === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.capacidad} asientos</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge[u.estado_actual] || ""}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {u.estado_actual.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.conductor_asignado || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
