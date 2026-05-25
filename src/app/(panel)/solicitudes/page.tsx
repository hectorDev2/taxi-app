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

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  asignada: "bg-blue-100 text-blue-700",
  aceptada: "bg-indigo-100 text-indigo-700",
  conductor_llego: "bg-orange-100 text-orange-700",
  servicio_iniciado: "bg-purple-100 text-purple-700",
  servicio_completado: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

function SolicitudesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detalleId = searchParams.get("id");
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

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

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(filtradas.length / porPagina);
  const paginadas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

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
                {Object.keys(estadoBadge).map((k) => (
                  <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
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
                      <button onClick={() => router.push(`/solicitudes?id=${s.id}`)} className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">Ver detalle</button>
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
