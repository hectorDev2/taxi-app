"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import { UserPlus, Edit2, Trash2 } from "lucide-react";
import { api } from "@/lib/mock-api";
import { useToast } from "@/components/toast";
import { SkeletonTable } from "@/components/skeleton";

const rolStyle: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  operador: "bg-blue-100 text-blue-700",
  conductor: "bg-green-100 text-green-700",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const { toast } = useToast();

  const cargar = () => api.usuarios.list().then((list) => { setUsuarios(list); setLoading(false); });
  useEffect(() => { cargar(); }, []);

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
              <option value="admin">Admin</option>
              <option value="operador">Operador</option>
              <option value="conductor">Conductor</option>
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
          <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
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
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No se encontraron usuarios</td></tr>
              ) : (filtrados.map((u) => (
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
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
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
          <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
            {filtrados.length} de {usuarios.length} usuarios
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
