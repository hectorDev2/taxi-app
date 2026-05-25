"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/header";
import { useAuth } from "@/lib/auth-context";
import { Car, Clock, CheckCircle, AlertTriangle, X, Phone, MapPin, Navigation, Star, Zap, Power, PowerOff } from "lucide-react";
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

const ESTADOS_FLUJO = [
  { key: "pendiente", label: "Asignado", icon: Clock },
  { key: "aceptada", label: "Aceptado", icon: CheckCircle },
  { key: "conductor_llego", label: "Llegué", icon: MapPin },
  { key: "servicio_iniciado", label: "En Viaje", icon: Navigation },
  { key: "servicio_completado", label: "Completado", icon: Star },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [ultimasSolicitudes, setUltimasSolicitudes] = useState<any[]>([]);
  const [marcadores, setMarcadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargaError, setCargaError] = useState(false);
  const [misViajes, setMisViajes] = useState<any[]>([]);
  const [viajesCompletadosHoy, setViajesCompletadosHoy] = useState(0);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: string; motivo: string } | null>(null);
  const [online, setOnline] = useState(true);
  const [miUbicacion, setMiUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [ruta, setRuta] = useState<[number, number][] | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialViajes, setHistorialViajes] = useState<any[]>([]);

  const esConductor = user?.rol === "conductor";

  const cargarViajesConductor = useCallback(() => {
    if (!user) { setLoading(false); return; }
    tripService.list()
      .then((list) => {
        const hoy = new Date().toISOString().split("T")[0];
        const conductorId = user.supabase_id || user.id;
        const mis = list.filter(
          (s) => s.conductor_id === conductorId && !["servicio_completado", "cancelada"].includes(s.estado)
        );
        const completadosHoy = list.filter(
          (s) => s.conductor_id === conductorId && s.estado === "servicio_completado" && s.created_at?.startsWith(hoy)
        ).length;
        setMisViajes(mis);
        setViajesCompletadosHoy(completadosHoy);
      })
      .catch((e) => {
        console.error("Error cargando viajes conductor:", e);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const cargarDashboard = () => {
    Promise.all([
      tripService.getEstadisticas().catch((e) => {
        console.error("Error estadísticas:", e);
        return {};
      }),
      tripService.list().catch((e) => {
        console.error("Error lista viajes:", e);
        return [];
      }),
      vehicleService.getUbicaciones().catch((e) => {
        console.error("Error ubicaciones:", e);
        return [];
      }),
    ]).then(([s, list, ubicaciones]) => {
      setStats(s as any);
      setUltimasSolicitudes((list as any[]).slice(0, 5));
      const markers = (ubicaciones as any[]).map((u: any) => ({
        lat: u.latitud,
        lng: u.longitud,
        color: "#22c55e",
        label: u.codigo || `Unidad ${u.unidad_id?.slice(0, 4)}`,
        type: "taxi" as const,
      }));
      setMarcadores(markers);
      setCargaError(false);
    }).catch((e) => {
      console.error("Error en Promise.all:", e);
      setCargaError(true);
    }).finally(() => setLoading(false));
  };

  // Carga inicial
  useEffect(() => {
    cargarDashboard();
  }, []);

  // Cuando auth termina, recargamos con sesión completa
  useEffect(() => {
    if (authLoading) return;
    if (esConductor && user) {
      cargarViajesConductor();
    } else {
      cargarDashboard();
    }
  }, [esConductor, user, authLoading, cargarViajesConductor]);

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

  // Ubicación simulada en Abancay para testeo
  useEffect(() => {
    if (!esConductor || !online) return;

    const baseLat = -13.6348;
    const baseLng = -72.8800;
    const jitter = () => (Math.random() - 0.5) * 0.01;

    let currentLat = baseLat + jitter();
    let currentLng = baseLng + jitter();
    setMiUbicacion({ lat: currentLat, lng: currentLng });

    const interval = setInterval(() => {
      const viaje = misViajes[0];

      if (!viaje) {
        currentLat += (Math.random() - 0.5) * 0.002;
        currentLng += (Math.random() - 0.5) * 0.002;
      } else if (viaje.estado === "conductor_llego" && viaje.latitud_recojo) {
        currentLat = viaje.latitud_recojo;
        currentLng = viaje.longitud_recojo;
      } else if (viaje.estado === "servicio_iniciado" && viaje.latitud_destino && viaje.longitud_destino) {
        const dx = viaje.longitud_destino - currentLng;
        const dy = viaje.latitud_destino - currentLat;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001) {
          const speed = 0.001;
          currentLng += (dx / dist) * speed;
          currentLat += (dy / dist) * speed;
        }
      } else if (viaje.estado === "servicio_completado" && viaje.latitud_destino) {
        currentLat = viaje.latitud_destino;
        currentLng = viaje.longitud_destino;
      } else if (viaje.latitud_recojo && viaje.longitud_recojo && (viaje.estado === "aceptada" || viaje.estado === "pendiente" || viaje.estado === "asignada")) {
        const dx = viaje.longitud_recojo - currentLng;
        const dy = viaje.latitud_recojo - currentLat;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001) {
          const speed = 0.001;
          currentLng += (dx / dist) * speed;
          currentLat += (dy / dist) * speed;
        }
      } else {
        currentLat += (Math.random() - 0.5) * 0.002;
        currentLng += (Math.random() - 0.5) * 0.002;
      }

      setMiUbicacion({ lat: currentLat, lng: currentLng });
    }, 3000);

    return () => clearInterval(interval);
  }, [esConductor, online, misViajes]);

  // Ruta desde mi ubicación al destino según el estado
  useEffect(() => {
    if (!miUbicacion || misViajes.length === 0) return;
    const viaje = misViajes[0];
    if (!viaje?.latitud_recojo || !viaje?.longitud_recojo) return;

    if (viaje.estado === "servicio_iniciado" && viaje.latitud_destino && viaje.longitud_destino) {
      fetchRoute([miUbicacion.lng, miUbicacion.lat], [viaje.longitud_destino, viaje.latitud_destino])
        .then(setRuta)
        .catch(() => {});
    } else {
      fetchRoute([miUbicacion.lng, miUbicacion.lat], [viaje.longitud_recojo, viaje.latitud_recojo])
        .then(setRuta)
        .catch(() => {});
    }
  }, [miUbicacion, misViajes]);

  const actualizarEstado = async (tripId: string, nuevoEstado: string) => {
    setActualizando(tripId);
    await tripService.updateStatus(tripId, nuevoEstado, user?.supabase_id);
    setActualizando(null);
    cargarViajesConductor();
  };

  const cancelarViaje = async () => {
    if (!cancelModal || !cancelModal.motivo) return;
    await tripService.cancel(cancelModal.id, cancelModal.motivo, "driver");
    setCancelModal(null);
    cargarViajesConductor();
  };

  const estadoIndex = (estado: string) => ESTADOS_FLUJO.findIndex((e) => e.key === estado);

  if (esConductor) {
    const viajeActivo = misViajes[0];
    const currentIdx = viajeActivo ? estadoIndex(viajeActivo.estado) : -1;

    return (
      <>
        <div className="max-w-2xl mx-auto">
          {/* Header con online toggle + resumen */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-2 rounded-full">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.nombres || "Conductor"}</p>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {online ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
              {online ? "En línea" : "Desconectado"}
            </button>
          </div>

          <div className="p-4 space-y-4">
            {cargaError && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                No se pudieron cargar los viajes.
              </div>
            )}

            {/* Cards de resumen del día */}
            {!loading && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Viajes Hoy", value: viajesCompletadosHoy, icon: CheckCircle, color: "bg-green-500", onClick: () => {
                    if (viajesCompletadosHoy === 0) return;
                    const conductorId = user?.supabase_id || user?.id;
                    tripService.list().then((list) => {
                      const hoy = new Date().toISOString().split("T")[0];
                      setHistorialViajes(list.filter(
                        (s) => s.conductor_id === conductorId && s.estado === "servicio_completado" && s.created_at?.startsWith(hoy)
                      ));
                      setShowHistorial(true);
                    }).catch(() => {});
                  }},
                  { label: "Activo", value: misViajes.length, icon: Navigation, color: "bg-yellow-500" },
                  { label: "Online", value: "6h", icon: Zap, color: "bg-blue-500" },
                ].map((item) => (
                  <div key={item.label} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${item.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                    onClick={item.onClick}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <div className={`${item.color} p-1.5 rounded-lg`}>
                        <item.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center text-gray-400 py-12 text-sm">Cargando viajes...</div>
            ) : misViajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Car className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-base font-medium text-gray-500">No tienes viajes activos</p>
                <p className="text-sm mt-1">Espera a que el operador te asigne un servicio</p>
              </div>
            ) : (
              <div className="space-y-4">
                {misViajes.map((viaje) => {
                  const idx = estadoIndex(viaje.estado);
                  return (
                    <div key={viaje.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Timeline de progreso */}
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-bold text-gray-900">{viaje.codigo}</h3>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            viaje.estado === "pendiente" || viaje.estado === "asignada" ? "bg-yellow-100 text-yellow-700" :
                            viaje.estado === "aceptada" ? "bg-indigo-100 text-indigo-700" :
                            viaje.estado === "conductor_llego" ? "bg-orange-100 text-orange-700" :
                            viaje.estado === "servicio_iniciado" ? "bg-purple-100 text-purple-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {viaje.estado.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="flex items-center gap-1 mt-3">
                          {ESTADOS_FLUJO.map((est, i) => {
                            const done = i <= idx;
                            const current = i === idx;
                            return (
                              <div key={est.key} className="flex-1 flex flex-col items-center">
                                <div className={`w-full h-1 rounded-full ${done ? "bg-yellow-400" : "bg-gray-200"}`} />
                                <div className={`mt-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                                  current ? "bg-yellow-400 ring-2 ring-yellow-200" :
                                  done ? "bg-yellow-400" : "bg-gray-100"
                                }`}>
                                  <est.icon className={`w-3 h-3 ${done ? "text-white" : "text-gray-400"}`} />
                                </div>
                                <span className={`text-[10px] mt-1 ${done ? "text-yellow-700 font-medium" : "text-gray-400"}`}>
                                  {est.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info del viaje */}
                      <div className="px-5 pb-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">Pasajero</p>
                            <p className="font-medium text-gray-900 truncate">{viaje.nombre_pasajero}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Teléfono</p>
                            {viaje.telefono_pasajero ? (
                              <a href={`tel:${viaje.telefono_pasajero}`} className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {viaje.telefono_pasajero}
                              </a>
                            ) : <p className="text-gray-500">—</p>}
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-400">Recojo</p>
                            <p className="text-gray-900 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
                              {viaje.punto_recojo_texto}
                            </p>
                          </div>
                          {viaje.punto_destino_texto && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-400">Destino</p>
                              <p className="text-gray-900 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                {viaje.punto_destino_texto}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mapa */}
                      {viaje.latitud_recojo && viaje.longitud_recojo && (
                        <div className="mx-5 mb-4">
                          <MapboxMap
                            height="150px"
                            markers={[
                              ...(miUbicacion
                                ? [{ lat: miUbicacion.lat, lng: miUbicacion.lng, color: "#3b82f6", label: "Mi ubicación", type: "taxi" as const }]
                                : []),
                              { lat: viaje.latitud_recojo, lng: viaje.longitud_recojo, color: "#eab308", label: "Recojo", type: "person" },
                              ...(viaje.latitud_destino && viaje.longitud_destino
                                ? [{ lat: viaje.latitud_destino, lng: viaje.longitud_destino, color: "#ef4444", label: "Destino", type: "destino" as const }]
                                : []),
                            ]}
                            routes={ruta && viaje === misViajes[0] ? [{ points: ruta, color: "#3b82f6" }] : []}
                            center={miUbicacion ? [miUbicacion.lng, miUbicacion.lat] : [viaje.longitud_recojo, viaje.latitud_recojo]}
                            zoom={13}
                            interactive={false}
                          />
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex gap-2 px-5 pb-5">
                        {viaje.estado === "pendiente" || viaje.estado === "asignada" ? (
                          <button
                            onClick={() => actualizarEstado(viaje.id, "aceptada")}
                            disabled={actualizando === viaje.id}
                            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            {actualizando === viaje.id ? "..." : "Aceptar Viaje"}
                          </button>
                        ) : null}
                        {viaje.estado === "aceptada" ? (
                          <button
                            onClick={() => actualizarEstado(viaje.id, "conductor_llego")}
                            disabled={actualizando === viaje.id}
                            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            {actualizando === viaje.id ? "..." : "Llegué al Recojo"}
                          </button>
                        ) : null}
                        {viaje.estado === "conductor_llego" ? (
                          <button
                            onClick={() => actualizarEstado(viaje.id, "servicio_iniciado")}
                            disabled={actualizando === viaje.id}
                            className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-200 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            {actualizando === viaje.id ? "..." : "Iniciar Servicio"}
                          </button>
                        ) : null}
                        {viaje.estado === "servicio_iniciado" ? (
                          <button
                            onClick={() => actualizarEstado(viaje.id, "servicio_completado")}
                            disabled={actualizando === viaje.id}
                            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            {actualizando === viaje.id ? "..." : "Completar Viaje"}
                          </button>
                        ) : null}
                        {viaje.estado !== "servicio_completado" && viaje.estado !== "cancelada" ? (
                          <button
                            onClick={() => setCancelModal({ id: viaje.id, motivo: "" })}
                            className="px-4 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">Cancelar Viaje</h3>
                <button onClick={() => setCancelModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <select
                  value={cancelModal.motivo}
                  onChange={(e) => setCancelModal({ ...cancelModal, motivo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none text-sm"
                >
                  <option value="">Motivo de cancelación</option>
                  <option value="Pasajero canceló">Pasajero canceló</option>
                  <option value="Vehículo en mantenimiento">Vehículo en mantenimiento</option>
                  <option value="Tráfico / demora">Tráfico / demora</option>
                  <option value="Dirección incorrecta">Dirección incorrecta</option>
                  <option value="Otro">Otro</option>
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setCancelModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Volver
                  </button>
                  <button
                    onClick={cancelarViaje}
                    disabled={!cancelModal.motivo}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Confirmar Cancelación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showHistorial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowHistorial(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
                <h3 className="text-base font-semibold text-gray-800">
                  Viajes de Hoy <span className="text-gray-400 font-normal">({historialViajes.length})</span>
                </h3>
                <button onClick={() => setShowHistorial(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {historialViajes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No hay viajes completados hoy</p>
                ) : (
                  historialViajes.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.codigo}</p>
                        <p className="text-xs text-gray-400">{v.nombre_pasajero} · {v.punto_recojo_texto}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(v.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))
                )}
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
        {cargaError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No se pudieron cargar los datos desde Supabase. Revisá que la REST API esté habilitada en
            {" "}<strong>Project Settings → API</strong> y que los CORS permitan <code>http://localhost:3000</code>.
          </div>
        )}
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
