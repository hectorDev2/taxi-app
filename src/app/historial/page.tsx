"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Search, Download } from "lucide-react";
import { api } from "@/lib/mock-api";
import { SkeletonTable } from "@/components/skeleton";
import Pagination from "@/components/pagination";

export default function HistorialPage() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    Promise.all([api.solicitudes.getHistorial(), api.solicitudes.list()]).then(([hist, list]) => {
      setServicios(hist);
      const completadas = list.filter((s) => s.estado === "servicio_completado" || s.estado === "cancelada");
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

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado, filtroFecha]);

  const totalPaginas = Math.ceil(filtradas.length / porPagina);
  const paginadas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const handleExport = async () => {
    setExporting(true);
    const csv = await api.solicitudes.exportHistorialCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial-servicios-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <div>
      <Header title="Historial de Servicios" />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none w-64"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            {exporting ? "Exportando..." : "Exportar"}
          </button>
        </div>

        {loading ? <SkeletonTable rows={5} /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Solicitud</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Fecha</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Pasajero</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Origen</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tarifa</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
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
