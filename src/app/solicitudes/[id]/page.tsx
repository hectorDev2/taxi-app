"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Car, Clock, User } from "lucide-react";
import { api } from "@/lib/mock-api";

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
  const [sol, setSol] = useState<any>(null);
  const [conductor, setConductor] = useState<any>(null);
  const [unidad, setUnidad] = useState<any>(null);

  useEffect(() => {
    const id = Number(params.id);
    api.solicitudes.getById(id).then((s) => {
      setSol(s);
      if (s?.conductor_id) {
        api.conductores.list().then((list) => {
          const c = list.find((cond) => cond.user_id === s.conductor_id);
          setConductor(c);
        });
      }
      if (s?.unidad_id) {
        api.unidades.getById(s.unidad_id).then(setUnidad);
      }
    });
  }, [params.id]);

  if (!sol) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Cargando...
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
            <div className="flex items-start gap-2 mb-4">
              <MapPin className="w-4 h-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-gray-900">{sol.punto_recojo_texto}</p>
            </div>
            <div className="bg-gray-100 rounded-lg h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Mapa (requiere Google Maps)
            </div>
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

          {sol.estado === "pendiente" && (
            <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors">
              Asignar Unidad
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
