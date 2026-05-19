"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Search, Download } from "lucide-react";
import { api } from "@/lib/mock-api";

export default function HistorialPage() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  useEffect(() => {
    api.solicitudes.getHistorial().then(setServicios);
    api.solicitudes.list().then((list) => {
      const completadas = list.filter((s) => s.estado === "servicio_completado" || s.estado === "cancelada");
      setSolicitudes(completadas);
    });
  }, []);

  const renderRows = () => {
    if (servicios.length > 0) {
      return servicios.map((s) => (
        <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="px-6 py-4 text-sm font-medium text-gray-900">S-{String(s.solicitud_id).padStart(3, "0")}</td>
          <td className="px-6 py-4 text-sm text-gray-700">S/ {s.tarifa_sugerida.toFixed(2)}</td>
          <td className="px-6 py-4 text-sm text-gray-700">{s.distancia_estimada_km} km</td>
          <td className="px-6 py-4 text-sm text-gray-700">{s.duracion_estimada_min} min</td>
          <td className="px-6 py-4 text-sm text-gray-700">{s.distancia_real_km ? `${s.distancia_real_km} km` : "—"}</td>
          <td className="px-6 py-4 text-sm text-gray-700">{s.duracion_real_min ? `${s.duracion_real_min} min` : "—"}</td>
          <td className="px-6 py-4">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${s.estado_final === "completado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {s.estado_final}
            </span>
          </td>
        </tr>
      ));
    }

    return solicitudes.map((s) => (
      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.codigo}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{s.created_at.split("T")[0]}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{s.created_at.split("T")[1]?.slice(0, 5) || "—"}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{s.nombre_pasajero}</td>
        <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">{s.punto_recojo_texto}</td>
        <td className="px-6 py-4 text-sm text-gray-700">S/ —</td>
        <td className="px-6 py-4">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${s.estado === "servicio_completado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {s.estado.replace("servicio_", "")}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div>
      <Header title="Historial de Servicios" />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none w-64" />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm">
              <option>Todos los estados</option>
              <option>Completado</option>
              <option>Cancelado</option>
            </select>
            <input type="date" className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm" />
          </div>
          <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Solicitud</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tarifa</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Dist. Est.</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Dur. Est.</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Dist. Real</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Dur. Real</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <p>Mostrando {servicios.length + solicitudes.length} registros</p>
        </div>
      </div>
    </div>
  );
}
