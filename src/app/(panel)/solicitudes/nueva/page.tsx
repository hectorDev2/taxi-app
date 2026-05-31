"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, MapPinned } from "lucide-react";
import { tripService } from "@/lib/services/trip-service";
import { vehicleService } from "@/lib/services/vehicle-service";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";
import MapboxMap, { fetchRoute } from "@/components/map";

const API = `https://api.mapbox.com/geocoding/v5/mapbox.places`;
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  if (!TOKEN) return "";
  try {
    const res = await fetch(
      `${API}/${lng},${lat}.json?access_token=${TOKEN}&language=es&limit=1`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || "";
  } catch {
    return "";
  }
}

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function validatePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length !== 9) return "El número debe tener exactamente 9 dígitos";
  if (!digits.startsWith("9")) return "El número debe comenzar con 9";
  return "";
}

async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  if (!TOKEN || query.length < 3) return [];
  try {
    const res = await fetch(
      `${API}/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=pe&language=es&limit=5`
    );
    const data = await res.json();
    return (data.features || []).map((f: any) => ({
      id: f.id,
      place_name: f.place_name,
      center: f.center as [number, number],
    }));
  } catch {
    return [];
  }
}

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);

  const [pickupLat, setPickupLat] = useState(-13.6348);
  const [pickupLng, setPickupLng] = useState(-72.88);
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);

  const [modoMapa, setModoMapa] = useState<"recojo" | "destino">("recojo");

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  const [form, setForm] = useState({
    nombre_pasajero: "",
    telefono_pasajero: "",
    punto_recojo_texto: "",
    punto_destino_texto: "",
    tipo_servicio: "pasajeros",
    asignar_ahora: false,
    unidad_id: "",
  });

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [pickupFocus, setPickupFocus] = useState(false);
  const [destFocus, setDestFocus] = useState(false);
  const [pickupQuery, setPickupQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [telefonoError, setTelefonoError] = useState("");

  useEffect(() => {
    if (pickupQuery.length < 3) {
      setPickupSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const s = await fetchSuggestions(pickupQuery);
      setPickupSuggestions(s);
    }, 300);
    return () => clearTimeout(t);
  }, [pickupQuery]);

  useEffect(() => {
    if (destQuery.length < 3) {
      setDestSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const s = await fetchSuggestions(destQuery);
      setDestSuggestions(s);
    }, 300);
    return () => clearTimeout(t);
  }, [destQuery]);

  useEffect(() => {
    vehicleService
      .nearestUnits(pickupLat, pickupLng)
      .then(setUnidades)
      .catch(() => {});
  }, [pickupLat, pickupLng]);

  useEffect(() => {
    if (pickupLat && pickupLng && destLat !== null && destLng !== null) {
      fetchRoute([pickupLng, pickupLat], [destLng, destLat])
        .then(setRouteCoords)
        .catch(() => setRouteCoords([]));
    } else {
      setRouteCoords([]);
    }
  }, [pickupLat, pickupLng, destLat, destLng]);

  const handleMapClick = useCallback(
    async (lng: number, lat: number) => {
      if (modoMapa === "recojo") {
        setPickupLng(lng);
        setPickupLat(lat);
        const addr = await reverseGeocode(lng, lat);
        setForm((prev) => ({ ...prev, punto_recojo_texto: addr }));
      } else {
        setDestLng(lng);
        setDestLat(lat);
        const addr = await reverseGeocode(lng, lat);
        setForm((prev) => ({ ...prev, punto_destino_texto: addr }));
      }
    },
    [modoMapa]
  );

  const handlePickupDrag = useCallback(
    async (lng: number, lat: number) => {
      setPickupLng(lng);
      setPickupLat(lat);
      const addr = await reverseGeocode(lng, lat);
      setForm((prev) => ({ ...prev, punto_recojo_texto: addr }));
    },
    []
  );

  const handleDestDrag = useCallback(
    async (lng: number, lat: number) => {
      setDestLng(lng);
      setDestLat(lat);
      const addr = await reverseGeocode(lng, lat);
      setForm((prev) => ({ ...prev, punto_destino_texto: addr }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const telefonodigits = form.telefono_pasajero.replace(/\D/g, "");
      const phoneErr = validatePhone(form.telefono_pasajero);
      if (phoneErr) {
        setTelefonoError(phoneErr);
        setSaving(false);
        return;
      }

      const sol = await tripService.create({
        passenger_name: form.nombre_pasajero,
        passenger_phone: telefonodigits,
        pickup_address: form.punto_recojo_texto,
        pickup_latitude: pickupLat,
        pickup_longitude: pickupLng,
        dropoff_address: form.punto_destino_texto || undefined,
        dropoff_latitude: destLat ?? undefined,
        dropoff_longitude: destLng ?? undefined,
        service_type:
          form.tipo_servicio === "carga_pasajeros"
            ? "cargo_passengers"
            : "passengers",
        channel: "phone",
        operator_id: user.supabase_id || user.id,
      });

      if (form.asignar_ahora && form.unidad_id && sol) {
        const unidad = unidades.find((u) => u.id === form.unidad_id);
        await tripService.assign(
          sol.id,
          form.unidad_id,
          unidad?.conductor_id || user.id,
          user.supabase_id || user.id
        );
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
    if (form.tipo_servicio === "carga_pasajeros")
      return u.tipo_unidad === "carga_pasajeros";
    return true;
  });

  const markers = useMemo(() => {
    const arr: any[] = [
      {
        lat: pickupLat,
        lng: pickupLng,
        type: "pickup",
        color: "#eab308",
        label: "Recojo",
        draggable: true,
        onDragEnd: handlePickupDrag,
      },
    ];
    if (destLat !== null && destLng !== null) {
      arr.push({
        lat: destLat,
        lng: destLng,
        type: "destino",
        color: "#ef4444",
        label: "Destino",
        draggable: true,
        onDragEnd: handleDestDrag,
      });
    }
    return arr;
  }, [pickupLat, pickupLng, destLat, destLng, handlePickupDrag, handleDestDrag]);

  return (
    <div>
      <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-200 bg-white">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          Nueva Solicitud
        </h2>
      </div>

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Datos del Pasajero
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del pasajero
              </label>
              <input
                type="text"
                value={form.nombre_pasajero}
                onChange={(e) =>
                  setForm({ ...form, nombre_pasajero: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                placeholder="Ej: Carlos Mendoza"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono del pasajero
              </label>
              <input
                type="tel"
                value={form.telefono_pasajero}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setForm({ ...form, telefono_pasajero: formatted });
                  if (telefonoError) setTelefonoError("");
                }}
                onBlur={() => {
                  if (form.telefono_pasajero) {
                    setTelefonoError(validatePhone(form.telefono_pasajero));
                  }
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none ${
                  telefonoError
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Ej: 987 654 321"
              />
              {telefonoError && (
                <p className="text-xs text-red-500 mt-1">{telefonoError}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Punto de Recojo
            </h3>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección / Referencia
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.punto_recojo_texto}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, punto_recojo_texto: val }));
                    setPickupQuery(val);
                  }}
                  onFocus={() => setPickupFocus(true)}
                  onBlur={() =>
                    setTimeout(() => setPickupFocus(false), 200)
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  placeholder="Ej: Av. Arequipa 123, Cercado de Lima"
                  required
                />
              </div>
              {pickupFocus && pickupSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {pickupSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={async () => {
                        setForm((prev) => ({
                          ...prev,
                          punto_recojo_texto: s.place_name,
                        }));
                        setPickupLng(s.center[0]);
                        setPickupLat(s.center[1]);
                        setPickupSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 border-b border-gray-100 last:border-b-0"
                    >
                      {s.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino
              </label>
              <div className="relative">
                <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.punto_destino_texto}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, punto_destino_texto: val }));
                    setDestQuery(val);
                  }}
                  onFocus={() => setDestFocus(true)}
                  onBlur={() =>
                    setTimeout(() => setDestFocus(false), 200)
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  placeholder="Ej: Av. Benavides 456, Surco"
                />
              </div>
              {destFocus && destSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {destSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={async () => {
                        setForm((prev) => ({
                          ...prev,
                          punto_destino_texto: s.place_name,
                        }));
                        setDestLng(s.center[0]);
                        setDestLat(s.center[1]);
                        setDestSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 border-b border-gray-100 last:border-b-0"
                    >
                      {s.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">
                  {modoMapa === "recojo"
                    ? "Haz clic en el mapa para ajustar el punto de recojo"
                    : "Haz clic en el mapa para ajustar el destino"}
                </p>
                <div className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModoMapa("recojo")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      modoMapa === "recojo"
                        ? "bg-yellow-400 border-yellow-400 text-gray-900"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Recojo
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoMapa("destino")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      modoMapa === "destino"
                        ? "bg-red-500 border-red-500 text-white"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Destino
                  </button>
                </div>
              </div>
              <MapboxMap
                height="300px"
                interactive
                onClick={handleMapClick}
                markers={markers}
                routes={
                  routeCoords.length > 0
                    ? [{ points: routeCoords, color: "#eab308" }]
                    : []
                }
                center={
                  destLat !== null && destLng !== null
                    ? [
                        (pickupLng + destLng) / 2,
                        (pickupLat + destLat) / 2,
                      ]
                    : [pickupLng, pickupLat]
                }
                zoom={13}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Tipo de Servicio
            </h3>

            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  form.tipo_servicio === "pasajeros"
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="pasajeros"
                  checked={form.tipo_servicio === "pasajeros"}
                  onChange={() =>
                    setForm({ ...form, tipo_servicio: "pasajeros" })
                  }
                  className="sr-only"
                />
                <span className="text-sm font-medium">Pasajeros</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  form.tipo_servicio === "carga_pasajeros"
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="carga_pasajeros"
                  checked={form.tipo_servicio === "carga_pasajeros"}
                  onChange={() =>
                    setForm({ ...form, tipo_servicio: "carga_pasajeros" })
                  }
                  className="sr-only"
                />
                <span className="text-sm font-medium">Carga + Pasajeros</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Asignación
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">Asignar ahora</span>
                <input
                  type="checkbox"
                  checked={form.asignar_ahora}
                  onChange={(e) =>
                    setForm({ ...form, asignar_ahora: e.target.checked })
                  }
                  className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
                />
              </label>
            </div>

            {form.asignar_ahora && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar unidad
                </label>
                <select
                  value={form.unidad_id}
                  onChange={(e) =>
                    setForm({ ...form, unidad_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                  required={form.asignar_ahora}
                >
                  <option value="">Seleccione una unidad libre</option>
                  {unidadesLibres.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.codigo} - {u.placa} (
                      {u.tipo_unidad === "pasajeros"
                        ? "Pasajeros"
                        : "Carga + Pasajeros"}
                      ){" "}
                      {u.distancia < 1
                        ? `${(u.distancia * 1000).toFixed(0)}m`
                        : `${u.distancia.toFixed(1)}km`}{" "}
                      {u.conductor_asignado
                        ? `- ${u.conductor_asignado}`
                        : ""}
                    </option>
                  ))}
                </select>
                {unidadesLibres.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No hay unidades libres disponibles para este tipo de
                    servicio
                  </p>
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
