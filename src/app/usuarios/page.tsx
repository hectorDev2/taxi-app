"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { UserPlus, Edit2, Trash2, X } from "lucide-react";
import { api } from "@/lib/mock-api";
import { useToast } from "@/components/toast";
import { SkeletonTable } from "@/components/skeleton";
import Pagination from "@/components/pagination";

const rolStyle: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  operador: "bg-blue-100 text-blue-700",
  conductor: "bg-green-100 text-green-700",
};

const roles = ["admin", "operador", "conductor"] as const;

interface UserForm {
  nombres: string;
  email: string;
  telefono: string;
  rol: "admin" | "operador" | "conductor";
  estado: "activo" | "inactivo";
}

const emptyForm: UserForm = { nombres: "", email: "", telefono: "", rol: "operador", estado: "activo" };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const cargar = () => api.usuarios.list().then((list) => { setUsuarios(list); setLoading(false); });
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const abrirEditar = (u: any) => {
    setEditId(u.id);
    setForm({ nombres: u.nombres, email: u.email, telefono: u.telefono, rol: u.rol, estado: u.estado });
    setShowModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await api.usuarios.update(editId, form);
      toast(`Usuario "${form.nombres}" actualizado`);
    } else {
      await api.usuarios.create(form);
      toast(`Usuario "${form.nombres}" creado`);
    }
    setShowModal(false);
    cargar();
  };

  const eliminar = async (id: number, nombre: string) => {
    await api.usuarios.delete(id);
    toast(`Usuario "${nombre}" eliminado`);
    cargar();
  };

  const filtrados = usuarios.filter((u) => {
    if (filtroRol && u.rol !== filtroRol) return false;
    if (filtroEstado && u.estado !== filtroEstado) return false;
    return true;
  });

  useEffect(() => { setPagina(1); }, [filtroRol, filtroEstado]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const paginadas = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div>
      <Header title="Usuarios" />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            >
              <option value="">Todos los roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <button onClick={abrirNuevo} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
            <UserPlus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>

        {loading ? <SkeletonTable rows={6} /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nombres</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Teléfono</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Rol</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Creado</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No se encontraron usuarios</td></tr>
              ) : (paginadas.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.nombres}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{u.telefono}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${rolStyle[u.rol] || ""}`}>{u.rol}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${u.estado === "activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{u.created_at}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirEditar(u)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => eliminar(u.id, u.nombres)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
          <Pagination currentPage={pagina} totalPages={totalPaginas} totalItems={usuarios.length} filteredItems={filtrados.length} onPageChange={setPagina} />
        </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{editId ? "Editar Usuario" : "Nuevo Usuario"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                <input type="text" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as UserForm["rol"] })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none">
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as UserForm["estado"] })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors">
                  {editId ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
