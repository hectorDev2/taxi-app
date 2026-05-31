"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/header";
import { useAuth } from "@/lib/auth-context";
import { Car, Clock, CheckCircle, AlertTriangle, Phone, MapPin, Navigation, Star, Zap, Power, PowerOff, X } from "lucide-react";
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

  // Driver location realtime subscription for admin/operator view
  useEffect(() => {
    if (esConductor) return; // conductor view uses their own GPS, not this
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

  if (esConductor) {
    const viajeActivo = misViajes[0];

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
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Viajes de Hoy <span className="text-gray-400 font-normal">({historialViajes.length})</span>
              </h3>
              <button onClick={() => setShowHistorial(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
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
        </Modal>
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
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
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
          <div className="shrink-0 pt-1">
            <SimuladorUbicaciones />
          </div>
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
