"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Car, Clock, User, X, Navigation, AlertTriangle } from "lucide-react";
import { api } from "@/lib/mock-api";
import MapboxMap, { fetchRoute } from "@/components/map";
import { SkeletonLine, SkeletonMap } from "@/components/skeleton";
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

export default function DetalleSolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sol, setSol] = useState<any>(null);
  const [conductor, setConductor] = useState<any>(null);
  const [unidad, setUnidad] = useState<any>(null);
  const [showAsignar, setShowAsignar] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [ruta, setRuta] = useState<[number, number][] | null>(null);
  const [marcadorUnidad, setMarcadorUnidad] = useState<{ lat: number; lng: number; color: string; label: string } | null>(null);
  const [unidadesCercanas, setUnidadesCercanas] = useState<any[]>([]);

  const cargar = () => {
    const id = Number(params.id);
    api.solicitudes.getById(id).then((s) => {
      setSol(s);
      if (s?.conductor_id) {
        api.conductores.list().then((list) => {
          const c = list.find((cond) => cond.user_id === s.conductor_id);
          setConductor(c);
        });
      }
      if (s?.unidad_id) api.unidades.getById(s.unidad_id).then(setUnidad);
    });
  };

  useEffect(() => { cargar(); }, [params.id]);

  useEffect(() => {
    if (sol?.unidad_id && sol?.latitud_recojo && sol?.longitud_recojo) {
      (async () => {
        const ubi = await api.unidades.getUbicacion(sol.unidad_id);
        if (ubi) {
          setMarcadorUnidad({ lat: ubi.latitud, lng: ubi.longitud, color: "#3b82f6", label: "Unidad" });
          const pts = await fetchRoute([ubi.longitud, ubi.latitud], [sol.longitud_recojo, sol.latitud_recojo]);
          setRuta(pts);
        }
      })();
    }
  }, [sol?.unidad_id]);

  const abrirAsignar = () => {
    setShowAsignar(true);
    api.unidades.nearestUnits(sol.latitud_recojo, sol.longitud_recojo, sol.tipo_servicio).then(setUnidadesCercanas);
  };

  const asignarUnidad = async (unidadId: number) => {
    const u = unidadesCercanas.find((u) => u.id === unidadId);
    const conductores = await api.conductores.list();
    const c = conductores.find((c) => c.unidad_id === unidadId);
    const usuarios = await api.usuarios.list();
    const conductorUser = usuarios.find((usr) => usr.id === c?.user_id);
    await api.solicitudes.assign(sol.id, unidadId, conductorUser?.id || 1, user?.id || 2);
    setShowAsignar(false);
    toast(`Unidad ${u.codigo} asignada a ${sol.codigo}`);
    cargar();
  };

  const cancelarSolicitud = async () => {
    if (!motivoCancelacion) return;
    await api.solicitudes.cancel(sol.id, motivoCancelacion, "operador");
    setShowCancelar(false);
    setMotivoCancelacion("");
    toast(`Solicitud ${sol.codigo} cancelada`);
    cargar();
  };

  if (!sol) {
    return (
      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <SkeletonLine width="120px" />
          <SkeletonLine width="200px" />
          <SkeletonLine width="160px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
            <SkeletonLine width="100px" />
            <SkeletonLine width="250px" />
            <SkeletonLine width="180px" />
            <SkeletonMap />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
            <SkeletonLine width="80px" />
            <SkeletonLine width="150px" />
            <SkeletonLine width="120px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-200 bg-white">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{sol.codigo}</h2>
          <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge[sol.estado] || ""}`}>
            {sol.estado.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Punto de Recojo</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-900">{sol.punto_recojo_texto}</p>
            </div>
            <MapboxMap height="250px" markers={[
              { lat: sol.latitud_recojo, lng: sol.longitud_recojo, color: "#eab308", label: "Punto de recojo" },
              ...unidad && marcadorUnidad ? [marcadorUnidad] : [],
            ]} routes={ruta ? [{ points: ruta, color: "#eab308" }] : []} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Unidad Asignada</h3>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{unidad.codigo} - {unidad.placa}</p>
                <p className="text-xs text-gray-500">{unidad.tipo_unidad === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"} · {unidad.capacidad} asientos</p>
              </div>
            </div>
          )}

          {conductor && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Conductor</h3>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{conductor.nombres || "Sin nombre"}</p>
                  <p className="text-xs text-gray-500">DNI: {conductor.dni} · Lic: {conductor.licencia}</p>
                </div>
              </div>
            </div>
          )}

          {(sol.estado === "pendiente" || sol.estado === "asignada" || sol.estado === "aceptada") && (
            <div className="space-y-2">
              {sol.estado === "pendiente" && (
                <button onClick={abrirAsignar} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors">
                  Asignar Unidad
                </button>
              )}
              <button onClick={() => setShowCancelar(true)} className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-lg transition-colors text-sm">
                Cancelar Solicitud
              </button>
            </div>
          )}
        </div>
      </div>

      {showCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
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
                ¿Estás seguro de cancelar <strong>{sol.codigo}</strong>? Se liberará la unidad asignada.
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
                  disabled={!motivoCancelacion}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAsignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Asignar Unidad</h3>
              <button onClick={() => setShowAsignar(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Unidades libres más cercanas al punto de recojo ({sol.punto_recojo_texto})
              </p>

              {unidadesCercanas.length === 0 ? (
                <p className="text-sm text-red-500">No hay unidades libres disponibles para este tipo de servicio</p>
              ) : (
                <div className="space-y-3">
                  {unidadesCercanas.map((u, i) => (
                    <div key={u.id} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? "border-yellow-400 bg-yellow-50" : "border-gray-200"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-400 text-gray-900" : "bg-gray-100 text-gray-600"}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.codigo} - {u.placa}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {u.distancia < 1 ? `${(u.distancia * 1000).toFixed(0)} m` : `${u.distancia.toFixed(1)} km`} · {u.tipo_unidad === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}
                            {u.conductor_asignado ? ` · ${u.conductor_asignado}` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => asignarUnidad(u.id)}
                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                      >
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
