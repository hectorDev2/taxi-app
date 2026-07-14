"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { Car, Plus, Edit2, Trash2, User } from "lucide-react";
import { vehicleService } from "@/lib/services/vehicle-service";
import { profileService } from "@/lib/services/profile-service";
import { useVehiclesRealtime } from "@/lib/services/realtime";
import { useToast } from "@/components/toast";
import MapboxMap from "@/components/map";
import Pagination from "@/components/pagination";
import { SkeletonCard, SkeletonTable, SkeletonMap } from "@/components/skeleton";
import { VEHICLE_STATUS_BADGE, VEHICLE_STATUS_ICON } from "@/lib/constants";
import Modal from "@/components/modal";
import usePagination from "@/hooks/usePagination";

interface VehicleForm {
  codigo: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  tipo_unidad: "pasajeros" | "carga_pasajeros";
  capacidad: string;
  conductor_id: string;
}

const emptyForm: VehicleForm = {
  codigo: "", placa: "", marca: "", modelo: "", anio: "",
  tipo_unidad: "pasajeros", capacidad: "4", conductor_id: "",
};

export default function UnidadesPage() {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [marcadores, setMarcadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conductores, setConductores] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const cargarDatos = () => {
    Promise.all([
      vehicleService.list().catch(() => []),
      vehicleService.getUbicaciones().catch(() => []),
    ]).then(([list, ubicaciones]) => {
      setUnidades(list as any[]);
      const markers = (ubicaciones as any[]).map((u: any) => ({
        lat: u.latitud, lng: u.longitud,
        color: "#22c55e",
        label: u.codigo || `Unidad ${u.unidad_id?.slice(0, 4)}`,
        type: "taxi" as const,
      }));
      setMarcadores(markers);
      setLoading(false);
    });
  };

  useEffect(() => { cargarDatos(); }, []);

  useVehiclesRealtime(cargarDatos);

  useEffect(() => {
    profileService.list().then((list) => {
      setConductores(list.filter((u) => u.rol === "conductor"));
    }).catch(() => {});
  }, []);

  const abrirNuevo = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const abrirEditar = (u: any) => {
    setEditId(u.id);
    setForm({
      codigo: u.codigo || "",
      placa: u.placa || "",
      marca: u.marca || "",
      modelo: u.modelo || "",
      anio: u.anio ? String(u.anio) : "",
      tipo_unidad: u.tipo_unidad,
      capacidad: String(u.capacidad || 4),
      conductor_id: u.conductor_id || "",
    });
    setShowModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await vehicleService.update(editId, {
          codigo: form.codigo,
          placa: form.placa,
          marca: form.marca || undefined,
          modelo: form.modelo || undefined,
          anio: form.anio ? Number(form.anio) : undefined,
          tipo_unidad: form.tipo_unidad,
          capacidad: Number(form.capacidad),
          conductor_id: form.conductor_id,
        });
        toast("Unidad actualizada");
      } else {
        await vehicleService.create({
          codigo: form.codigo,
          placa: form.placa,
          marca: form.marca || undefined,
          modelo: form.modelo || undefined,
          anio: form.anio ? Number(form.anio) : undefined,
          tipo_unidad: form.tipo_unidad,
          capacidad: Number(form.capacidad),
          conductor_id: form.conductor_id,
        });
        toast("Unidad creada");
      }
      setShowModal(false);
      cargarDatos();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: string, codigo: string) => {
    if (!window.confirm(`¿Eliminar unidad ${codigo}?`)) return;
    try {
      await vehicleService.delete(id);
      toast(`Unidad ${codigo} eliminada`);
      cargarDatos();
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const filtradas = unidades.filter((u) => {
    if (filtroEstado && u.estado_actual !== filtroEstado) return false;
    if (filtroTipo && u.tipo_unidad !== filtroTipo) return false;
    return true;
  });

  const { pagina, setPagina, totalPaginas, paginadas, reset } = usePagination(filtradas, 10);
  useEffect(() => { reset(); }, [filtroEstado, filtroTipo]);

  return (
    <div>
      <Header title="Unidades" />

      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : ([
            { label: "Libres", filter: "libre", color: "bg-green-500" },
            { label: "Asignadas", filter: "asignado", color: "bg-yellow-500" },
            { label: "Ocupadas", filter: "ocupado", color: "bg-blue-500" },
            { label: "F. Servicio", filter: "fuera_servicio", color: "bg-red-500" },
          ].map((item) => (
            <div key={item.filter} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{unidades.filter((u) => u.estado_actual === item.filter).length}</p>
            </div>
          )))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mapa de Flota</h3>
          {loading ? <SkeletonMap /> : <MapboxMap height="300px" markers={marcadores} />}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            >
              <option value="">Todos los estados</option>
              {Object.keys(VEHICLE_STATUS_BADGE).map((k) => (
                <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="pasajeros">Pasajeros</option>
              <option value="carga_pasajeros">Carga + Pasajeros</option>
            </select>
          </div>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Unidad
          </button>
        </div>

        {loading ? <SkeletonTable rows={6} /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Unidad</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Placa</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Marca / Modelo</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Capacidad</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Conductor</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No se encontraron unidades</td></tr>
              ) : (paginadas.map((u) => {
                const Icon = VEHICLE_STATUS_ICON[u.estado_actual] || VEHICLE_STATUS_ICON.libre;
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.placa}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.marca ? `${u.marca} ${u.modelo || ""}`.trim() : "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.tipo_unidad === "pasajeros" ? "Pasajeros" : "Carga + Pasajeros"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.capacidad} asientos</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${VEHICLE_STATUS_BADGE[u.estado_actual] || ""}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {u.estado_actual.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.conductor_asignado || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEditar(u)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => eliminar(u.id, u.codigo)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
          <Pagination currentPage={pagina} totalPages={totalPaginas} totalItems={unidades.length} filteredItems={filtradas.length} onPageChange={setPagina} />
        </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Editar Unidad" : "Nueva Unidad"} maxWidth="lg">
        <form onSubmit={guardar} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Ej: U-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
              <input type="text" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Ej: ABC-123" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input type="text" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Ej: Toyota" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input type="text" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Ej: Corolla" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="2024" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input type="number" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Unidad</label>
            <select value={form.tipo_unidad} onChange={(e) => setForm({ ...form, tipo_unidad: e.target.value as VehicleForm["tipo_unidad"] })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none">
              <option value="pasajeros">Pasajeros</option>
              <option value="carga_pasajeros">Carga + Pasajeros</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conductor asignado</label>
            <select value={form.conductor_id} onChange={(e) => setForm({ ...form, conductor_id: e.target.value })} required={!editId} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none">
              <option value="">Seleccione un conductor</option>
              {conductores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombres} ({c.email})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 text-sm font-medium rounded-lg transition-colors">
              {saving ? "Guardando..." : editId ? "Guardar Cambios" : "Crear Unidad"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
