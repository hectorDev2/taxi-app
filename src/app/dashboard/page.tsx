"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { useAuth } from "@/lib/auth-context";
import { Car, Clock, CheckCircle, AlertTriangle, X } from "lucide-react";
import { tripService } from "@/lib/services/trip-service";
import { vehicleService } from "@/lib/services/vehicle-service";
import { useTripsRealtime, useVehiclesRealtime } from "@/lib/services/realtime";
import MapboxMap, { fetchRoute } from "@/components/map";
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
  const { user } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [ultimasSolicitudes, setUltimasSolicitudes] = useState<any[]>([]);
  const [marcadores, setMarcadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [misViajes, setMisViajes] = useState<any[]>([]);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: string; motivo: string } | null>(null);

  const esConductor = user?.rol === "conductor";

  const cargarViajesConductor = () => {
    if (!user) return;
    tripService.list()
      .then((list) => {
        const mis = list.filter(
          (s) => s.conductor_id === (user.supabase_id || user.id) && !["servicio_completado", "cancelada"].includes(s.estado)
        );
        setMisViajes(mis);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const cargarDashboard = () => {
    Promise.all([
      tripService.getEstadisticas().catch(() => ({})),
      tripService.list().catch(() => []),
      vehicleService.getUbicaciones().catch(() => []),
    ]).then(([s, list, ubicaciones]) => {
      setStats(s as any);
      setUltimasSolicitudes((list as any[]).slice(0, 5));
      const markers = (ubicaciones as any[]).map((u: any) => ({
        lat: u.latitud,
        lng: u.longitud,
        color: "#22c55e",
        label: u.codigo || `Unidad ${u.unidad_id?.slice(0, 4)}`,
      }));
      setMarcadores(markers);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (esConductor && user) {
      cargarViajesConductor();
    } else {
      cargarDashboard();
    }
  }, [esConductor, user]);

  useTripsRealtime(() => {
    if (esConductor) {
      cargarViajesConductor();
    } else {
      cargarDashboard();
    }
  });

  useVehiclesRealtime(() => {
    if (!esConductor) {
      cargarDashboard();
    }
  });

  const actualizarEstado = async (tripId: string, nuevoEstado: string) => {
    setActualizando(tripId);
    await tripService.updateStatus(tripId, nuevoEstado, user?.supabase_id);
    setActualizando(null);
    tripService.list().then((list) => {
      const mis = list.filter(
        (s) => s.conductor_id === (user?.supabase_id || user?.id) && !["servicio_completado", "cancelada"].includes(s.estado)
      );
      setMisViajes(mis);
    });
  };

  const cancelarViaje = async () => {
    if (!cancelModal || !cancelModal.motivo) return;
    await tripService.cancel(cancelModal.id, cancelModal.motivo, "driver");
    setMisViajes((prev) => prev.filter((v) => v.id !== cancelModal.id));
    setCancelModal(null);
  };

  if (esConductor) {
    return (
      <>
        <div>
          <Header title="Mis Viajes" />
          <div className="p-8">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Cargando viajes...</div>
            ) : misViajes.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg font-medium">No tienes viajes activos</p>
                <p className="text-sm mt-1">Espera a que el operador te asigne un servicio</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {misViajes.map((viaje) => (
                  <div key={viaje.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{viaje.codigo}</h3>
                        <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          viaje.estado === "pendiente" || viaje.estado === "asignada" ? "bg-yellow-100 text-yellow-700" :
                          viaje.estado === "aceptada" ? "bg-indigo-100 text-indigo-700" :
                          viaje.estado === "conductor_llego" ? "bg-orange-100 text-orange-700" :
                          viaje.estado === "servicio_iniciado" ? "bg-purple-100 text-purple-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {viaje.estado.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Pasajero</p>
                        <p className="text-sm font-medium text-gray-900">{viaje.nombre_pasajero}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tel\u00e9fono</p>
                        <p className="text-sm text-gray-700">{viaje.telefono_pasajero || "\u2014"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Recojo</p>
                        <p className="text-sm text-gray-900">{viaje.punto_recojo_texto}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Destino</p>
                        <p className="text-sm text-gray-900">{viaje.punto_destino_texto || "\u2014"}</p>
                      </div>
                    </div>
                    {viaje.latitud_recojo && viaje.longitud_recojo && (
                      <div className="mb-4">
                        <MapboxMap
                          height="140px"
                          markers={[
                            { lat: viaje.latitud_recojo, lng: viaje.longitud_recojo, color: "#eab308", label: "Recojo" },
                            ...(viaje.latitud_destino && viaje.longitud_destino
                              ? [{ lat: viaje.latitud_destino, lng: viaje.longitud_destino, color: "#ef4444", label: "Destino" }]
                              : []),
                          ]}
                          center={[viaje.longitud_recojo, viaje.latitud_recojo]}
                          zoom={13}
                          interactive={false}
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {viaje.estado === "pendiente" || viaje.estado === "asignada" ? (
                        <button
                          onClick={() => actualizarEstado(viaje.id, "aceptada")}
                          disabled={actualizando === viaje.id}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {actualizando === viaje.id ? "Actualizando..." : "Aceptar Viaje"}
                        </button>
                      ) : null}
                      {viaje.estado === "aceptada" ? (
                        <button
                          onClick={() => actualizarEstado(viaje.id, "conductor_llego")}
                          disabled={actualizando === viaje.id}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Llegu\u00e9 al Punto de Recojo
                        </button>
                      ) : null}
                      {viaje.estado === "conductor_llego" ? (
                        <button
                          onClick={() => actualizarEstado(viaje.id, "servicio_iniciado")}
                          disabled={actualizando === viaje.id}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-200 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Iniciar Servicio
                        </button>
                      ) : null}
                      {viaje.estado === "servicio_iniciado" ? (
                        <button
                          onClick={() => actualizarEstado(viaje.id, "servicio_completado")}
                          disabled={actualizando === viaje.id}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Completar Viaje
                        </button>
                      ) : null}
                      {viaje.estado !== "servicio_completado" && viaje.estado !== "cancelada" ? (
                        <button
                          onClick={() => setCancelModal({ id: viaje.id, motivo: "" })}
                          className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancelar Viaje
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Cancelar Viaje</h3>
                <button onClick={() => setCancelModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Selecciona el motivo de cancelaci\u00f3n:</p>
                <select
                  value={cancelModal.motivo}
                  onChange={(e) => setCancelModal({ ...cancelModal, motivo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                >
                  <option value="">Seleccione un motivo</option>
                  <option value="Pasajero cancel\u00f3">Pasajero cancel\u00f3</option>
                  <option value="Veh\u00edculo en mantenimiento">Veh\u00edculo en mantenimiento</option>
                  <option value="Tr\u00e1fico / demora">Tr\u00e1fico / demora</option>
                  <option value="Direcci\u00f3n incorrecta">Direcci\u00f3n incorrecta</option>
                  <option value="Otro">Otro</option>
                </select>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setCancelModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Volver
                  </button>
                  <button
                    onClick={cancelarViaje}
                    disabled={!cancelModal.motivo}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Confirmar Cancelaci\u00f3n
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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
