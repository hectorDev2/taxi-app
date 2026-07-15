"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/header";
import { useAuth } from "@/lib/auth-context";
import { Car, Clock, CheckCircle, AlertTriangle, Phone, MapPin, Navigation, Star, Zap, Power, PowerOff, X, Loader2, Route, DollarSign, Users, Activity } from "lucide-react";
import { tripService } from "@/lib/services/trip-service";
import { vehicleService } from "@/lib/services/vehicle-service";
import { createClient } from "@/lib/supabase/client";
import { useTripsRealtime, useVehiclesRealtime } from "@/lib/services/realtime";
import MapboxMap, { fetchRoute } from "@/components/map";
import { SkeletonCard, SkeletonMap } from "@/components/skeleton";
import Modal from "@/components/modal";
import TripCard from "@/components/trip-card";
import CancelTripModal from "@/components/cancel-trip-modal";
import SimuladorUbicaciones from "@/components/simulador-ubicaciones";

const STATS_META: Record<string, { label: string; icon: React.ElementType; gradient: string; shadow: string }> = {
  libres: { label: "Unidades Libres", icon: Car, gradient: "from-green-500 to-emerald-500", shadow: "shadow-green-200" },
  ocupadas: { label: "Unidades Ocupadas", icon: Clock, gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-200" },
  serviciosHoy: { label: "Servicios Hoy", icon: CheckCircle, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-200" },
  fueraServicio: { label: "Fuera de Servicio", icon: AlertTriangle, gradient: "from-red-500 to-rose-500", shadow: "shadow-red-200" },
};

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
        driverId: u.conductor_id,
      }));
      setMarcadores(markers);
      setCargaError(false);
    }).catch((e) => {
      console.error("Error en Promise.all:", e);
      setCargaError(true);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

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

  useEffect(() => {
    if (esConductor) return;
    const supabase = createClient();
    const sub = supabase
      .channel("admin-driver-locations")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: "role=eq.driver",
        },
        (payload: any) => {
          const { current_latitude, current_longitude, id } = payload.new;
          if (current_latitude && current_longitude) {
            setMarcadores((prev) =>
              prev.map((m) =>
                m.driverId === id
                  ? { ...m, lat: current_latitude, lng: current_longitude }
                  : m
              )
            );
          }
        }
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [esConductor]);

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

  if (esConductor) {
    const viajeActivo = misViajes[0];

    return (
      <>
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2.5 rounded-xl shadow-md shadow-yellow-200">
                <Car className="w-5 h-5 text-gray-900" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-gray-900">{user?.nombres || "Conductor"}</p>
                <p className="text-[11px] text-gray-400 font-medium">Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className={`relative flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                online
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-200"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${online ? "bg-white animate-pulse" : "bg-gray-400"}`} />
              {online ? "En línea" : "Desconectado"}
            </button>
          </div>

          <div className="p-4 space-y-4">
            {cargaError && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                No se pudieron cargar los viajes.
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Viajes Hoy", value: viajesCompletadosHoy, icon: CheckCircle, gradient: "from-green-500 to-emerald-500", shadow: "shadow-green-200", onClick: () => {
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
                  { label: "Activo", value: misViajes.length, icon: Navigation, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-200", onClick: undefined },
                  { label: "Online", value: "Sí", icon: Zap, gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-200", onClick: undefined },
                ].map((item) => (
                  <div key={item.label} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${item.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                    onClick={item.onClick}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <div className={`bg-gradient-to-br ${item.gradient} ${item.shadow} p-2 rounded-xl shadow-sm`}>
                        <item.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center text-gray-400 py-12 text-sm">Cargando viajes...</div>
            ) : misViajes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white" />
                  </div>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
                      <Car className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white font-bold text-lg">No tenés viajes activos</p>
                    <p className="text-blue-100 text-sm mt-1">Esperá a que el operador te asigne un servicio</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {misViajes.map((viaje) => (
                  <TripCard
                    key={viaje.id}
                    viaje={viaje}
                    miUbicacion={miUbicacion}
                    ruta={ruta}
                    actualizando={actualizando}
                    accent="yellow"
                    flujoStartKey="pendiente"
                    onActualizarEstado={actualizarEstado}
                    onCancelarClick={(id) => setCancelModal({ id, motivo: "" })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <CancelTripModal
          open={!!cancelModal}
          motivo={cancelModal?.motivo || ""}
          onMotivoChange={(motivo) => setCancelModal(cancelModal ? { ...cancelModal, motivo } : null)}
          onClose={() => setCancelModal(null)}
          onConfirm={cancelarViaje}
        />

        <Modal open={showHistorial} onClose={() => setShowHistorial(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
              <h3 className="text-lg font-bold text-gray-900">
                Viajes de Hoy <span className="text-gray-400 font-normal">({historialViajes.length})</span>
              </h3>
              <button onClick={() => setShowHistorial(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {historialViajes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay viajes completados hoy</p>
              ) : (
                historialViajes.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{v.codigo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{v.nombre_pasajero} · {v.punto_recojo_texto}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">{new Date(v.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Resumen general del sistema" />

      <div className="p-8">
        {cargaError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            No se pudieron cargar los datos desde Supabase. Revisá que la REST API esté habilitada en
            {" "}<strong>Project Settings → API</strong> y que los CORS permitan <code>http://localhost:3000</code>.
          </div>
        )}

        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-1">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (["libres", "ocupadas", "serviciosHoy", "fueraServicio"].map((key) => {
              const meta = STATS_META[key];
              const Icon = meta.icon;
              return (
                <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{meta.label}</p>
                    <div className={`bg-gradient-to-br ${meta.gradient} ${meta.shadow} p-2.5 rounded-xl shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">{stats[key] ?? "—"}</p>
                </div>
              );
            }))}
          </div>
          <div className="shrink-0 pt-1">
            <SimuladorUbicaciones />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-500" />
              Mapa de Unidades
            </h3>
            {loading ? <SkeletonMap /> : <div className="rounded-xl overflow-hidden border border-gray-100"><MapboxMap height="350px" markers={marcadores} /></div>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-yellow-500" />
              Últimas Solicitudes
            </h3>
            <div className="space-y-1">
              {ultimasSolicitudes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay solicitudes recientes</p>
              ) : (ultimasSolicitudes.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{s.nombre_pasajero}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{s.punto_recojo_texto}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    s.estado === "pendiente" ? "bg-yellow-100 text-yellow-700" :
                    s.estado === "asignada" || s.estado === "aceptada" ? "bg-blue-100 text-blue-700" :
                    s.estado === "servicio_completado" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {s.estado.replace("_", " ")}
                  </span>
                </div>
              )))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
