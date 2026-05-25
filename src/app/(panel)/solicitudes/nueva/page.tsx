"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, MapPinned } from "lucide-react";
import { tripService } from "@/lib/services/trip-service";
import { vehicleService } from "@/lib/services/vehicle-service";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import MapboxMap from "@/components/map";

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [pickupLat, setPickupLat] = useState(-13.6348);
  const [pickupLng, setPickupLng] = useState(-72.8800);
  const [form, setForm] = useState({
    nombre_pasajero: "",
    telefono_pasajero: "",
    punto_recojo_texto: "",
    punto_destino_texto: "",
    tipo_servicio: "pasajeros",
    asignar_ahora: false,
    unidad_id: "",
  });

  useEffect(() => {
    vehicleService.nearestUnits(pickupLat, pickupLng)
      .then(setUnidades)
      .catch(() => {});
  }, [pickupLat, pickupLng]);

  const handleMapClick = (lng: number, lat: number) => {
    setPickupLng(lng);
    setPickupLat(lat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const sol = await tripService.create({
        passenger_name: form.nombre_pasajero,
        passenger_phone: form.telefono_pasajero,
        pickup_address: form.punto_recojo_texto,
        pickup_latitude: pickupLat,
        pickup_longitude: pickupLng,
        dropoff_address: form.punto_destino_texto || undefined,
        service_type: form.tipo_servicio === "carga_pasajeros" ? "cargo_passengers" : "passengers",
        channel: "phone",
        operator_id: user.supabase_id || user.id,
      });

      if (form.asignar_ahora && form.unidad_id && sol) {
        const unidad = unidades.find((u) => u.id === form.unidad_id);
        await tripService.assign(sol.id, form.unidad_id, unidad?.conductor_id || user.id, user.supabase_id || user.id);
      }

      toast("Solicitud creada exitosamente");
      router.push("/solicitudes");
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const unidadesLibres = unidades.filter((u: any) => {
    if (form.tipo_servicio === "carga_pasajeros") return u.tipo_unidad === "carga_pasajeros";
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-200 bg-white">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Nueva Solicitud</h2>
      </div>

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datos del Pasajero</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del pasajero</label>
              <input
                type="text"
                value={form.nombre_pasajero}
                onChange={(e) => setForm({ ...form, nombre_pasajero: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                placeholder="Ej: Carlos Mendoza"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del pasajero</label>
              <input
                type="tel"
                value={form.telefono_pasajero}
                onChange={(e) => setForm({ ...form, telefono_pasajero: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                placeholder="Ej: 987654321"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Punto de Recojo</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / Referencia</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.punto_recojo_texto}
                  onChange={(e) => setForm({ ...form, punto_recojo_texto: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  placeholder="Ej: Av. Arequipa 123, Cercado de Lima"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
              <div className="relative">
                <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.punto_destino_texto}
                  onChange={(e) => setForm({ ...form, punto_destino_texto: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  placeholder="Ej: Av. Benavides 456, Surco"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Haz clic en el mapa para ajustar el punto de recojo</p>
              <MapboxMap
                height="250px"
                interactive
                onClick={handleMapClick}
                markers={[{ lat: pickupLat, lng: pickupLng, color: "#eab308", label: "Recojo", type: "person" }]}
                center={[pickupLng, pickupLat]}
                zoom={14}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tipo de Servicio</h3>

            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${form.tipo_servicio === "pasajeros" ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="pasajeros"
                  checked={form.tipo_servicio === "pasajeros"}
                  onChange={() => setForm({ ...form, tipo_servicio: "pasajeros" })}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Pasajeros</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${form.tipo_servicio === "carga_pasajeros" ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="carga_pasajeros"
                  checked={form.tipo_servicio === "carga_pasajeros"}
                  onChange={() => setForm({ ...form, tipo_servicio: "carga_pasajeros" })}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Carga + Pasajeros</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Asignación</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">Asignar ahora</span>
                <input
                  type="checkbox"
                  checked={form.asignar_ahora}
                  onChange={(e) => setForm({ ...form, asignar_ahora: e.target.checked })}
                  className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
                />
              </label>
            </div>

            {form.asignar_ahora && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar unidad</label>
                <select
                  value={form.unidad_id}
                  onChange={(e) => setForm({ ...form, unidad_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  required={form.asignar_ahora}
                >
                  <option value="">Seleccione una unidad libre</option>
                  {unidadesLibres.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.codigo} - {u.placa} ({u.tipo_unidad === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}) {u.distancia < 1 ? `${(u.distancia * 1000).toFixed(0)}m` : `${u.distancia.toFixed(1)}km`} {u.conductor_asignado ? `- ${u.conductor_asignado}` : ""}
                    </option>
                  ))}
                </select>
                {unidadesLibres.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No hay unidades libres disponibles para este tipo de servicio</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              {saving ? "Creando..." : "Crear Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
