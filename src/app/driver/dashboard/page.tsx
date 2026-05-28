"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { tripService } from "@/lib/services/trip-service";
import { useTripsRealtime } from "@/lib/services/realtime";
import LocationTracker from "@/components/location-tracker";
import MapboxMap from "@/components/map";
import { Car, Clock, CheckCircle, MapPin, Navigation, Star, X, Phone, Zap, PowerOff, AlertCircle } from "lucide-react";

const ESTADOS_FLUJO = [
  { key: "asignada", label: "Asignado", icon: Car },
  { key: "aceptada", label: "Aceptado", icon: CheckCircle },
  { key: "conductor_llego", label: "Llegué", icon: MapPin },
  { key: "servicio_iniciado", label: "En Viaje", icon: Navigation },
  { key: "servicio_completado", label: "Completado", icon: Star },
];

export default function DriverDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [misViajes, setMisViajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ id: string; motivo: string } | null>(null);
  const [online, setOnline] = useState(true);
  const [miUbicacion, setMiUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [ruta, setRuta] = useState<[number, number][] | null>(null);

  const cargarViajes = () => {
    if (!user) return;
    tripService.list()
      .then((list) => {
        const conductorId = user.supabase_id || user.id;
        const activos = list.filter(
          (s) => s.conductor_id === conductorId && !["servicio_completado", "cancelada"].includes(s.estado)
        );
        setMisViajes(activos);
      })
      .catch((e) => console.error("Error cargando viajes:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.rol !== "conductor") return;
    cargarViajes();
  }, [user, authLoading]);

  useTripsRealtime(() => {
    cargarViajes();
  });

  useEffect(() => {
    if (!online) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [online]);

  const actualizarEstado = async (tripId: string, nuevoEstado: string) => {
    setActualizando(tripId);
    await tripService.updateStatus(tripId, nuevoEstado, user?.supabase_id);
    setActualizando(null);
    cargarViajes();
  };

  const cancelarViaje = async () => {
    if (!cancelModal?.motivo) return;
    await tripService.cancel(cancelModal.id, cancelModal.motivo, "driver");
    setCancelModal(null);
    cargarViajes();
  };

  const estadoIndex = (estado: string) =>
    ESTADOS_FLUJO.findIndex((e) => e.key === estado);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user?.rol !== "conductor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">No tenés acceso a esta sección</p>
          <p className="text-gray-500 text-sm mt-2">Esta área es solo para conductores</p>
        </div>
      </div>
    );
  }

  const viajeActivo = misViajes[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-full">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.nombres || "Conductor"}</p>
            <p className="text-xs text-gray-400">App Conductor</p>
          </div>
        </div>
        <button
          onClick={() => setOnline(!online)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {online ? <Zap className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
          {online ? "En línea" : "Desconectado"}
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Viajes Hoy", value: misViajes.filter(v => v.estado === "servicio_completado").length, color: "bg-green-500" },
            { label: "Activos", value: misViajes.length, color: "bg-yellow-500" },
            { label: "Online", value: online ? "Sí" : "No", color: "bg-blue-500" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">{item.label}</p>
                <div className={`${item.color} p-1.5 rounded-lg`}>
                  <Car className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Active trip */}
        {!viajeActivo ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-500">No tenés viajes activos</p>
            <p className="text-sm text-gray-400 mt-1">Esperá a que el operador te asigne un servicio</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Progress bar */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900">{viajeActivo.codigo}</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  viajeActivo.estado === "asignada" ? "bg-yellow-100 text-yellow-700" :
                  viajeActivo.estado === "aceptada" ? "bg-indigo-100 text-indigo-700" :
                  viajeActivo.estado === "conductor_llego" ? "bg-orange-100 text-orange-700" :
                  viajeActivo.estado === "servicio_iniciado" ? "bg-purple-100 text-purple-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {viajeActivo.estado.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {ESTADOS_FLUJO.map((est, i) => {
                  const done = i <= estadoIndex(viajeActivo.estado);
                  const current = i === estadoIndex(viajeActivo.estado);
                  return (
                    <div key={est.key} className="flex-1 flex flex-col items-center">
                      <div className={`w-full h-1 rounded-full ${done ? "bg-blue-500" : "bg-gray-200"}`} />
                      <div className={`mt-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        current ? "bg-blue-500 ring-2 ring-blue-200" :
                        done ? "bg-blue-500" : "bg-gray-100"
                      }`}>
                        <est.icon className={`w-3 h-3 ${done ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <span className={`text-[10px] mt-1 ${done ? "text-blue-700 font-medium" : "text-gray-400"}`}>
                        {est.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trip info */}
            <div className="px-5 pb-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Pasajero</p>
                  <p className="font-medium text-gray-900 truncate">{viajeActivo.nombre_pasajero}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Teléfono</p>
                  {viajeActivo.telefono_pasajero ? (
                    <a href={`tel:${viajeActivo.telefono_pasajero}`} className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {viajeActivo.telefono_pasajero}
                    </a>
                  ) : <p className="text-gray-500">—</p>}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Recojo</p>
                  <p className="text-gray-900 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
                    {viajeActivo.punto_recojo_texto}
                  </p>
                </div>
                {viajeActivo.punto_destino_texto && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Destino</p>
                    <p className="text-gray-900 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {viajeActivo.punto_destino_texto}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            {viajeActivo.latitud_recojo && viajeActivo.longitud_recojo && (
              <div className="mx-5 mb-4">
                <MapboxMap
                  height="150px"
                  markers={[
                    ...(miUbicacion && online
                      ? [{ lat: miUbicacion.lat, lng: miUbicacion.lng, color: "#3b82f6", label: "Mi ubicación", type: "taxi" as const }]
                      : []),
                    { lat: viajeActivo.latitud_recojo, lng: viajeActivo.longitud_recojo, color: "#eab308", label: "Recojo", type: "person" },
                    ...(viajeActivo.latitud_destino && viajeActivo.longitud_destino
                      ? [{ lat: viajeActivo.latitud_destino, lng: viajeActivo.longitud_destino, color: "#ef4444", label: "Destino", type: "destino" as const }]
                      : []),
                  ]}
                  routes={ruta ? [{ points: ruta, color: "#3b82f6" }] : []}
                  center={miUbicacion && online ? [miUbicacion.lng, miUbicacion.lat] : [viajeActivo.longitud_recojo, viajeActivo.latitud_recojo]}
                  zoom={13}
                  interactive={false}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 px-5 pb-5">
              {viajeActivo.estado === "asignada" && (
                <button
                  onClick={() => actualizarEstado(viajeActivo.id, "aceptada")}
                  disabled={actualizando === viajeActivo.id}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-200 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {actualizando === viajeActivo.id ? "..." : "Aceptar Viaje"}
                </button>
              )}
              {viajeActivo.estado === "aceptada" && (
                <button
                  onClick={() => actualizarEstado(viajeActivo.id, "conductor_llego")}
                  disabled={actualizando === viajeActivo.id}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {actualizando === viajeActivo.id ? "..." : "Llegué al Recojo"}
                </button>
              )}
              {viajeActivo.estado === "conductor_llego" && (
                <button
                  onClick={() => actualizarEstado(viajeActivo.id, "servicio_iniciado")}
                  disabled={actualizando === viajeActivo.id}
                  className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-200 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {actualizando === viajeActivo.id ? "..." : "Iniciar Servicio"}
                </button>
              )}
              {viajeActivo.estado === "servicio_iniciado" && (
                <button
                  onClick={() => actualizarEstado(viajeActivo.id, "servicio_completado")}
                  disabled={actualizando === viajeActivo.id}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {actualizando === viajeActivo.id ? "..." : "Completar Viaje"}
                </button>
              )}
              {viajeActivo.estado !== "servicio_completado" && viajeActivo.estado !== "cancelada" && (
                <button
                  onClick={() => setCancelModal({ id: viajeActivo.id, motivo: "" })}
                  className="px-4 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location tracker */}
      <LocationTracker enabled={online} />

      {/* Cancel modal */}
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
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}