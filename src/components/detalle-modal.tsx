"use client";

import { useEffect, useState } from "react";
import { X, Phone, Car, Clock, User, AlertTriangle } from "lucide-react";
import { tripService } from "@/lib/services/trip-service";
import { vehicleService } from "@/lib/services/vehicle-service";
import { profileService } from "@/lib/services/profile-service";
import { useTripsRealtime, useDriverLocationRealtime } from "@/lib/services/realtime";
import MapboxMap, { fetchRoute } from "@/components/map";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  asignada: "bg-blue-100 text-blue-700",
  aceptada: "bg-indigo-100 text-indigo-700",
  conductor_llego: "bg-orange-100 text-orange-700",
  servicio_iniciado: "bg-purple-100 text-purple-700",
  servicio_completado: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

export default function DetalleModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sol, setSol] = useState<any>(null);
  const [conductor, setConductor] = useState<any>(null);
  const [unidad, setUnidad] = useState<any>(null);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [asignando, setAsignando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [ruta, setRuta] = useState<[number, number][] | null>(null);
  const [marcadorUnidad, setMarcadorUnidad] = useState<{ lat: number; lng: number; color: string; label: string; type: string } | null>(null);
  const [unidadesCercanas, setUnidadesCercanas] = useState<any[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);

  const cargar = () => {
    tripService.getById(id)
      .then((s) => {
        setSol(s);
        if (s?.conductor_id) {
          profileService.list()
            .then((list) => {
              const c = list.find((p) => p.supabase_id === s.conductor_id);
              setConductor(c || null);
            })
            .catch(() => {});
        }
        if (s?.unidad_id) {
          vehicleService.getById(s.unidad_id).then(setUnidad).catch(() => {});
        }
      })
      .catch(() => {});
  };

  useEffect(() => { cargar(); }, [id]);

  useTripsRealtime((payload) => {
    if (payload.new?.id === id) cargar();
  });

  useDriverLocationRealtime(sol?.conductor_id, (location) => {
    setMarcadorUnidad({ lat: location.lat, lng: location.lng, color: "#3b82f6", label: "Unidad", type: "taxi" });
    if (sol?.longitud_recojo && sol?.latitud_recojo) {
      fetchRoute([location.lng, location.lat], [sol.longitud_recojo, sol.latitud_recojo])
        .then((pts) => setRuta(pts))
        .catch(() => {});
    }
  });

  useEffect(() => {
    if (sol?.unidad_id && sol?.latitud_recojo && sol?.longitud_recojo) {
      (async () => {
        const ubi = await vehicleService.getUbicacion(sol.unidad_id).catch(() => null);
        if (ubi) {
          setMarcadorUnidad({ lat: ubi.latitud, lng: ubi.longitud, color: "#3b82f6", label: "Unidad", type: "taxi" });
          const pts = await fetchRoute([ubi.longitud, ubi.latitud], [sol.longitud_recojo, sol.latitud_recojo]);
          setRuta(pts);
        }
      })();
    }
  }, [sol?.unidad_id]);

  // Auto-cargar unidades disponibles para viajes pendientes
  useEffect(() => {
    if (sol?.estado === "pendiente" && sol?.latitud_recojo) {
      setCargandoUnidades(true);
      vehicleService.nearestUnits(sol.latitud_recojo, sol.longitud_recojo, sol.tipo_servicio)
        .then(setUnidadesCercanas)
        .catch(() => {})
        .finally(() => setCargandoUnidades(false));
    }
  }, [sol?.id, sol?.estado]);

  const asignarUnidad = async (unidadId: string) => {
    const u = unidadesCercanas.find((u) => u.id === unidadId);
    if (!u || !user) return;
    setAsignando(unidadId);
    try {
      await tripService.assign(sol.id, unidadId, u.conductor_id || user.id, user.supabase_id || user.id);
      setShowAsignar(false);
      toast(`Unidad ${u.codigo} asignada a ${sol.codigo}`);
      cargar();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setAsignando(null);
    }
  };

  const cancelarSolicitud = async () => {
    if (!motivoCancelacion) return;
    setCancelando(true);
    try {
      await tripService.cancel(sol.id, motivoCancelacion, "operator");
      setShowCancelar(false);
      setMotivoCancelacion("");
      toast(`Solicitud ${sol.codigo} cancelada`);
      cargar();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 bg-black/40 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{sol?.codigo || "Cargando..."}</h2>
              {sol && (
                <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge[sol.estado] || ""}`}>
                  {sol.estado.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!sol ? (
          <div className="p-8 text-center text-gray-400">Cargando solicitud...</div>
        ) : (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos del Pasajero</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Nombre</p>
                    <p className="text-sm font-medium text-gray-900">{sol.nombre_pasajero}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {sol.telefono_pasajero || "No registrado"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Canal de origen</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{sol.canal_origen}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Recorrido</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 mt-1 rounded-full bg-yellow-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Punto de recojo</p>
                      <p className="text-sm text-gray-900">{sol.punto_recojo_texto}</p>
                    </div>
                  </div>
                  {sol.punto_destino_texto && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 mt-1 rounded-full bg-red-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Destino</p>
                        <p className="text-sm text-gray-900">{sol.punto_destino_texto}</p>
                      </div>
                    </div>
                  )}
                </div>
                <MapboxMap
                  height="300px"
                  markers={[
                    // Unidades disponibles
                    ...unidadesCercanas
                      .filter((u) => u.latitud && u.longitud)
                      .map((u) => ({
                        lat: u.latitud,
                        lng: u.longitud,
                        color: "#22c55e",
                        label: u.codigo || "",
                        type: "taxi" as const,
                        popupHtml: `<div style="font-size:13px;line-height:1.5">
                          <strong>${u.codigo || ""}</strong>${u.placa ? ` · ${u.placa}` : ""}<br>
                          ${u.conductor_asignado || ""}<br>
                          ${u.distancia < 1 ? `${(u.distancia * 1000).toFixed(0)} m` : `${u.distancia.toFixed(1)} km`}
                          ${u.tipo_unidad === "pasajeros" ? " · Pasajeros" : " · Carga + Pasajeros"}
                        </div>`,
                        onClick: () => {
                          if (u.id) asignarUnidad(u.id);
                        },
                      })),
                    // Unidad asignada
                    ...(marcadorUnidad ? [{
                      ...marcadorUnidad,
                      type: "taxi" as const,
                      popupHtml: `<div style="font-size:13px"><strong>${marcadorUnidad.label}</strong></div>`,
                    }] : []),
                    // Punto de recojo
                    { lat: sol.latitud_recojo, lng: sol.longitud_recojo, color: "#eab308", label: "Punto de recojo", type: "person" },
                    // Destino
                    ...(sol.latitud_destino && sol.longitud_destino
                      ? [{ lat: sol.latitud_destino, lng: sol.longitud_destino, color: "#ef4444", label: "Destino", type: "destino" as const }]
                      : []),
                  ]}
                  routes={ruta ? [{ points: ruta, color: "#3b82f6" }] : []}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Servicio</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{sol.tipo_servicio === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Creado: {new Date(sol.created_at).toLocaleString("es-PE")}</span>
                  </div>
                </div>
              </div>

              {unidad && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Unidad Asignada</h3>
                  <p className="text-sm font-medium text-gray-900">{unidad.codigo} - {unidad.placa}</p>
                  <p className="text-xs text-gray-500 mt-1">{unidad.tipo_unidad === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"} · {unidad.capacidad} asientos</p>
                </div>
              )}

              {conductor && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Conductor</h3>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{conductor.nombres || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500">{conductor.email || conductor.telefono ? `${conductor.email} · ${conductor.telefono}` : ""}</p>
                    </div>
                  </div>
                </div>
              )}

              {sol.estado !== "servicio_completado" && sol.estado !== "cancelada" && (
                <div className="space-y-2">
                  {sol.estado === "pendiente" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Unidades Disponibles</h3>
                      {cargandoUnidades ? (
                        <p className="text-xs text-gray-400 text-center py-4">Buscando unidades...</p>
                      ) : unidadesCercanas.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No hay unidades libres cerca</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {unidadesCercanas.map((u, i) => (
                            <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{u.codigo ?? `V-${u.id?.slice(0, 4).toUpperCase()}`}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {u.conductor_asignado ? `${u.conductor_asignado} · ` : ""}
                                  {u.distancia < 1 ? `${(u.distancia * 1000).toFixed(0)} m` : `${u.distancia.toFixed(1)} km`}
                                  {u.placa ? ` · ${u.placa}` : ""}
                                </p>
                              </div>
                              <button
                                onClick={() => asignarUnidad(u.id)}
                                disabled={asignando === u.id}
                                className="ml-2 shrink-0 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 text-xs font-semibold rounded-lg transition-colors"
                              >
                                {asignando === u.id ? "..." : "Asignar"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {sol.estado === "servicio_iniciado" && (
                    <button
                      onClick={async () => {
                        try {
                          await tripService.updateStatus(sol.id, "servicio_completado", user?.supabase_id);
                          toast(`Viaje ${sol.codigo} completado`);
                          cargar();
                        } catch (e: any) {
                          toast(e.message, "error");
                        }
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
                    >
                      Completar Viaje
                    </button>
                  )}
                  <button onClick={() => setShowCancelar(true)} className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-lg transition-colors text-sm">
                    Cancelar Solicitud
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showCancelar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowCancelar(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-800">Cancelar Solicitud</h3>
                </div>
                <button onClick={() => setShowCancelar(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  ¿Estás seguro de cancelar <strong>{sol.codigo}</strong>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cancelación</label>
                  <select
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none"
                  >
                    <option value="">Seleccione un motivo</option>
                    <option value="Pasajero canceló">Pasajero canceló</option>
                    <option value="No se encontró unidad disponible">No se encontró unidad disponible</option>
                    <option value="Conductor no disponible">Conductor no disponible</option>
                    <option value="Dirección incorrecta">Dirección incorrecta</option>
                    <option value="Servicio duplicado">Servicio duplicado</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowCancelar(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Volver
                  </button>
                  <button
                    onClick={cancelarSolicitud}
                    disabled={!motivoCancelacion || cancelando}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {cancelando ? "Cancelando..." : "Confirmar Cancelación"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
