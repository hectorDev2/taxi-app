"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/mock-api";

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  asignada: "bg-blue-100 text-blue-700",
  aceptada: "bg-indigo-100 text-indigo-700",
  conductor_llego: "bg-orange-100 text-orange-700",
  servicio_iniciado: "bg-purple-100 text-purple-700",
  servicio_completado: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  useEffect(() => {
    api.solicitudes.list().then(setSolicitudes);
  }, []);

  return (
    <div>
      <Header title="Solicitudes" />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar solicitud..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none w-80"
            />
          </div>
          <button
            onClick={() => router.push("/solicitudes/nueva")}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Código</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Pasajero</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Teléfono</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Punto de Recojo</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Servicio</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Canal</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.nombre_pasajero}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.telefono_pasajero || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">{s.punto_recojo_texto}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.tipo_servicio === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge[s.estado] || ""}`}>
                      {s.estado.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{s.canal_origen}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => router.push(`/solicitudes/${s.id}`)} className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
