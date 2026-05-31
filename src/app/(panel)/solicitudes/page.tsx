"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header";
import { Plus, Search } from "lucide-react";
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
        <Header title="Solicitudes" />

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por código, pasajero, dirección..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none w-80"
                />
              </div>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.keys(TRIP_STATUS_BADGE).map((k) => (
                  <option key={k} value={k}>{STATUS_LABELS[k] || k.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => router.push("/solicitudes/nueva")}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Solicitud
            </button>
          </div>

          {loading ? <SkeletonTable rows={6} /> : (
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
                {paginadas.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No se encontraron solicitudes</td></tr>
                ) : (paginadas.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.nombre_pasajero}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {s.telefono_pasajero ? (
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${s.telefono_pasajero}`} className="text-blue-600 hover:underline" title="Llamar">
                            {s.telefono_pasajero}
                          </a>
                          <a
                            href={`https://wa.me/51${s.telefono_pasajero.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, soy operador de taxi.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                            title="WhatsApp"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </a>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">{s.punto_recojo_texto}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.tipo_servicio === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${TRIP_STATUS_BADGE[s.estado] || ""}`}>
                        {STATUS_LABELS[s.estado] || s.estado.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {s.canal_origen === "whatsapp" ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </span>
                      ) : s.canal_origen === "telefono" ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                          Teléfono
                        </span>
                      ) : (
                        <span className="capitalize">{s.canal_origen}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(() => {
                        const action = STATUS_ACTIONS[s.estado] || { label: "Ver detalle", variant: "ghost" };
                        return action.variant === "primary" ? (
                          <button
                            onClick={() => router.push(`/solicitudes?id=${s.id}`)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {action.label}
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/solicitudes?id=${s.id}`)}
                            className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
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
        <DetalleModal id={detalleId} onClose={() => router.push("/solicitudes")} />
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
