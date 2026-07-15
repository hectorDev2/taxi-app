"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header";
import { Plus, Search, Filter, ChevronDown, Phone, MessageSquare } from "lucide-react";
import Pagination from "@/components/pagination";
import { tripService } from "@/lib/services/trip-service";
import { useTripsRealtime } from "@/lib/services/realtime";
import { SkeletonTable } from "@/components/skeleton";
import DetalleModal from "@/components/detalle-modal";
import { TRIP_STATUS_BADGE } from "@/lib/constants";
import usePagination from "@/hooks/usePagination";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  asignada: "Asignada",
  assigned: "Asignada",
  aceptada: "Aceptada",
  conductor_llego: "Conductor llegó",
  servicio_iniciado: "Servicio iniciado",
  servicio_completado: "Completado",
  cancelada: "Cancelada",
};

const STATUS_ACTIONS: Record<string, { label: string; variant: "primary" | "ghost" }> = {
  pendiente: { label: "Asignar", variant: "primary" },
  asignada: { label: "Ver detalle", variant: "ghost" },
  aceptada: { label: "Ver detalle", variant: "ghost" },
  conductor_llego: { label: "Ver detalle", variant: "ghost" },
  servicio_iniciado: { label: "Ver detalle", variant: "ghost" },
  servicio_completado: { label: "Ver detalle", variant: "ghost" },
  cancelada: { label: "Ver detalle", variant: "ghost" },
};

function SolicitudesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detalleId = searchParams.get("id");
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    tripService.list()
      .then((list) => { setSolicitudes(list); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useTripsRealtime(() => {
    tripService.list().then(setSolicitudes).catch(() => {});
  });

  const filtradas = solicitudes.filter((s) => {
    if (filtroEstado && s.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!s.codigo.toLowerCase().includes(q) &&
          !s.nombre_pasajero.toLowerCase().includes(q) &&
          !s.punto_recojo_texto.toLowerCase().includes(q) &&
          !(s.telefono_pasajero || "").includes(q)) return false;
    }
    return true;
  });

  const { pagina, setPagina, totalPaginas, paginadas, reset } = usePagination(filtradas, 10);
  useEffect(() => { reset(); }, [busqueda, filtroEstado]);

  return (
    <>
      <div>
        <Header title="Solicitudes" subtitle={`${solicitudes.length} solicitudes registradas`} />

        <div className="p-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por código, pasajero, dirección..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none w-80 text-sm bg-white/80 backdrop-blur transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none text-sm appearance-none bg-white/80 backdrop-blur transition-all cursor-pointer min-w-[160px]"
                >
                  <option value="">Todos los estados</option>
                  {Object.keys(TRIP_STATUS_BADGE).map((k) => (
                    <option key={k} value={k}>{STATUS_LABELS[k] || k.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {filtroEstado && (
                <button
                  onClick={() => setFiltroEstado("")}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
            <button
              onClick={() => router.push("/solicitudes/nueva")}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-gray-900 font-bold px-5 py-2.5 rounded-xl shadow-md shadow-yellow-200/50 transition-all duration-200 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Nueva Solicitud
            </button>
          </div>

          {/* Table */}
          {loading ? <SkeletonTable rows={6} /> : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Código", "Pasajero", "Teléfono", "Punto de Recojo", "Servicio", "Estado", "Acción"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginadas.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No se encontraron solicitudes</td></tr>
                ) : (paginadas.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-gray-900">{s.codigo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">{s.nombre_pasajero}</span>
                    </td>
                    <td className="px-6 py-4">
                      {s.telefono_pasajero ? (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${s.telefono_pasajero}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors" title="Llamar">
                            <Phone className="w-3.5 h-3.5" />
                            {s.telefono_pasajero}
                          </a>
                          <a
                            href={`https://wa.me/51${s.telefono_pasajero.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, soy operador de taxi.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-600 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{s.punto_recojo_texto}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{s.tipo_servicio === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${TRIP_STATUS_BADGE[s.estado] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[s.estado] || s.estado.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(() => {
                        const action = STATUS_ACTIONS[s.estado] || { label: "Ver detalle", variant: "ghost" };
                        return action.variant === "primary" ? (
                          <button
                            onClick={() => router.push(`/solicitudes?id=${s.id}`)}
                            className="bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-gray-900 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.97]"
                          >
                            {action.label}
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/solicitudes?id=${s.id}`)}
                            className="text-yellow-600 hover:text-yellow-700 text-sm font-bold px-3 py-1.5 hover:bg-yellow-50 rounded-lg transition-colors"
                          >
                            {action.label}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
            <Pagination currentPage={pagina} totalPages={totalPaginas} totalItems={solicitudes.length} filteredItems={filtradas.length} onPageChange={setPagina} />
          </div>
          )}
        </div>
      </div>

      {detalleId && (
        <DetalleModal
          id={detalleId}
          onClose={() => router.push("/solicitudes")}
          onMutate={() => tripService.list().then(setSolicitudes).catch(() => {})}
        />
      )}
    </>
  );
}

export default function SolicitudesPage() {
  return (
    <Suspense fallback={null}>
      <SolicitudesContent />
    </Suspense>
  );
}
