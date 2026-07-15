"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Search, Download } from "lucide-react";
import { tripService } from "@/lib/services/trip-service";
import { SkeletonTable } from "@/components/skeleton";
import Pagination from "@/components/pagination";
import usePagination from "@/hooks/usePagination";

export default function HistorialPage() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  useEffect(() => {
    Promise.all([
      tripService.getHistorial().catch(() => []),
      tripService.list().catch(() => []),
    ]).then(([hist, list]) => {
      setServicios(hist);
      const completadas = (list as any[]).filter(
        (s: any) => s.estado === "servicio_completado" || s.estado === "cancelada"
      );
      setSolicitudes(completadas);
      setLoading(false);
    });
  }, []);

  const items = servicios.length > 0 ? servicios.map((s) => {
    const sol = solicitudes.find((x) => x.id === s.solicitud_id);
    return {
      id: s.id,
      codigo: sol?.codigo || `S-${String(s.solicitud_id).padStart(3, "0")}`,
      fecha: sol?.created_at?.split("T")[0] || "",
      pasajero: sol?.nombre_pasajero || "",
      origen: sol?.punto_recojo_texto || "",
      tarifa: s.tarifa_final ?? s.tarifa_sugerida,
      estado: s.estado_final,
    };
  }) : solicitudes.map((s) => ({
    id: s.id,
    codigo: s.codigo,
    fecha: s.created_at.split("T")[0],
    pasajero: s.nombre_pasajero,
    origen: s.punto_recojo_texto,
    tarifa: null,
    estado: s.estado === "servicio_completado" ? "completado" : "cancelada",
  }));

  const filtradas = items.filter((i) => {
    if (filtroEstado && i.estado !== filtroEstado) return false;
    if (filtroFecha && i.fecha !== filtroFecha) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!i.codigo.toLowerCase().includes(q) && !i.pasajero.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const { pagina, setPagina, totalPaginas, paginadas, reset } = usePagination(filtradas, 10);
  useEffect(() => { reset(); }, [busqueda, filtroEstado, filtroFecha]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await tripService.exportHistorialCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial-servicios-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <Header title="Historial de Servicios" subtitle={`${items.length} servicios registrados`} />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none w-64 text-sm bg-white/80 backdrop-blur transition-all"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none text-sm bg-white/80 backdrop-blur transition-all"
            >
              <option value="">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none text-sm bg-white/80 backdrop-blur transition-all"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 disabled:from-gray-300 disabled:to-gray-300 text-gray-900 font-bold px-5 py-2.5 rounded-xl shadow-md shadow-yellow-200/50 transition-all duration-200 active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            {exporting ? "Exportando..." : "Exportar"}
          </button>
        </div>

        {loading ? <SkeletonTable rows={5} /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Solicitud", "Fecha", "Pasajero", "Origen", "Tarifa", "Estado"].map((h) => (
                  <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginadas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No se encontraron registros</td></tr>
              ) : (paginadas.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{i.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{i.fecha}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{i.pasajero}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">{i.origen}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{i.tarifa ? `S/ ${i.tarifa.toFixed(2)}` : "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${i.estado === "completado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {i.estado}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
          <Pagination currentPage={pagina} totalPages={totalPaginas} totalItems={items.length} filteredItems={filtradas.length} onPageChange={setPagina} />
        </div>
        )}
      </div>
    </div>
  );
}
