"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Car, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { api } from "@/lib/mock-api";
import MapboxMap from "@/components/map";
import { SkeletonCard, SkeletonMap } from "@/components/skeleton";

const iconMap: Record<string, React.ElementType> = {
  libres: Car,
  ocupadas: Clock,
  serviciosHoy: CheckCircle,
  fueraServicio: AlertTriangle,
};

const colorMap: Record<string, string> = {
  libres: "bg-green-500",
  ocupadas: "bg-blue-500",
  serviciosHoy: "bg-yellow-500",
  fueraServicio: "bg-red-500",
};

const labelMap: Record<string, string> = {
  libres: "Unidades Libres",
  ocupadas: "Unidades Ocupadas",
  serviciosHoy: "Servicios Hoy",
  fueraServicio: "Fuera de Servicio",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [ultimasSolicitudes, setUltimasSolicitudes] = useState<any[]>([]);
  const [marcadores, setMarcadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.solicitudes.getEstadisticas(),
      api.solicitudes.list(),
      api.unidades.getUbicaciones(),
    ]).then(([s, list, ubicaciones]) => {
      setStats(s);
      setUltimasSolicitudes(list.slice(0, 5));
      const markers = ubicaciones.map((u: any) => ({
        lat: u.latitud,
        lng: u.longitud,
        color: u.unidad_id === 2 ? "#3b82f6" : "#22c55e",
        label: `Unidad ${u.unidad_id}`,
      }));
      setMarcadores(markers);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (["libres", "ocupadas", "serviciosHoy", "fueraServicio"].map((key) => {
            const Icon = iconMap[key];
            return (
              <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{labelMap[key]}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats[key] ?? "—"}</p>
                  </div>
                  <div className={`${colorMap[key]} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mapa de Unidades</h3>
            {loading ? <SkeletonMap /> : <MapboxMap height="350px" markers={marcadores} />}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimas Solicitudes</h3>
            <div className="space-y-3">
              {ultimasSolicitudes.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.nombre_pasajero}</p>
                    <p className="text-xs text-gray-500">{s.punto_recojo_texto}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.estado === "pendiente" ? "bg-yellow-100 text-yellow-700" :
                    s.estado === "asignada" || s.estado === "aceptada" ? "bg-blue-100 text-blue-700" :
                    s.estado === "servicio_completado" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {s.estado.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
