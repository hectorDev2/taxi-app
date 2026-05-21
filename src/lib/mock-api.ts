import {
  usuarios, conductores, unidades, ubicaciones,
  solicitudes, asignaciones, tarifasConfig,
  serviciosHistorial, cancelaciones,
  calcularTarifa, distanciaKm,
  type Usuario, type Unidad, type Solicitud, type Cancelacion, type TarifaConfig,
  type UbicacionUnidad,
} from "./mock-data";

function delay<T>(data: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(data), 200));
}

function genId(items: { id: number }[]): number {
  return Math.max(...items.map((i) => i.id), 0) + 1;
}

export const api = {
  auth: {
    login(email: string, password: string) {
      const user = usuarios.find((u) => u.email === email && u.estado === "activo");
      if (!user) return delay(null as unknown as Usuario);
      return delay(user);
    },
    getProfile(userId: number) {
      return delay(usuarios.find((u) => u.id === userId) || null);
    },
  },

  unidades: {
    list() {
      return delay([...unidades]);
    },
    getById(id: number) {
      return delay(unidades.find((u) => u.id === id) || null);
    },
    update(id: number, data: Partial<Unidad>) {
      const idx = unidades.findIndex((u) => u.id === id);
      if (idx === -1) return delay(null);
      unidades[idx] = { ...unidades[idx], ...data };
      return delay(unidades[idx]);
    },
    getUbicaciones() {
      return delay([...ubicaciones]);
    },
    getUbicacion(unidadId: number) {
      return delay(ubicaciones.find((u) => u.unidad_id === unidadId) || null);
    },
    nearestUnits(lat: number, lng: number, tipo?: string) {
      const libres = unidades.filter((u) => u.estado_actual === "libre" && u.activa);
      const disponibles = tipo ? libres.filter((u) => u.tipo_unidad === tipo || tipo !== "carga_pasajeros") : libres;
      const conDistancia = disponibles
        .map((u) => {
          const ubi = ubicaciones.find((ub) => ub.unidad_id === u.id);
          return { ...u, distancia: ubi ? distanciaKm(lat, lng, ubi.latitud, ubi.longitud) : 999 };
        })
        .sort((a, b) => a.distancia - b.distancia);
      return delay(conDistancia);
    },
  },

  solicitudes: {
    list() {
      return delay([...solicitudes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    },
    getById(id: number) {
      return delay(solicitudes.find((s) => s.id === id) || null);
    },
    create(data: Partial<Solicitud>) {
      const newSolicitud: Solicitud = {
        id: genId(solicitudes),
        codigo: `S-${String(genId(solicitudes)).padStart(3, "0")}`,
        canal_origen: "telefono",
        nombre_pasajero: "",
        telefono_pasajero: "",
        punto_recojo_texto: "",
        latitud_recojo: 0,
        longitud_recojo: 0,
        tipo_servicio: "pasajeros",
        estado: "pendiente",
        operador_id: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      };
      solicitudes.push(newSolicitud);
      return delay(newSolicitud);
    },
    assign(solicitudId: number, unidadId: number, conductorId: number, operadorId: number) {
      const sol = solicitudes.find((s) => s.id === solicitudId);
      const uni = unidades.find((u) => u.id === unidadId);
      if (!sol || !uni) return delay(null);
      sol.estado = "asignada";
      sol.unidad_id = unidadId;
      sol.conductor_id = conductorId;
      sol.updated_at = new Date().toISOString();
      uni.estado_actual = "asignado";
      asignaciones.push({
        id: genId(asignaciones),
        solicitud_id: solicitudId,
        unidad_id: unidadId,
        conductor_id: conductorId,
        operador_id: operadorId,
        fecha_asignacion: new Date().toISOString(),
        estado: "asignada",
      });
      return delay(sol);
    },
    updateStatus(solicitudId: number, estado: Solicitud["estado"]) {
      const sol = solicitudes.find((s) => s.id === solicitudId);
      if (!sol) return delay(null);
      sol.estado = estado;
      sol.updated_at = new Date().toISOString();
      return delay(sol);
    },
    cancel(solicitudId: number, motivo: string, registradoPor: Cancelacion["registrado_por"]) {
      const sol = solicitudes.find((s) => s.id === solicitudId);
      if (!sol) return delay(null);
      sol.estado = "cancelada";
      sol.updated_at = new Date().toISOString();
      const uni = unidades.find((u) => u.id === sol.unidad_id);
      if (uni) uni.estado_actual = "libre";
      cancelaciones.push({
        id: genId(cancelaciones),
        solicitud_id: solicitudId,
        motivo,
        registrado_por: registradoPor,
        fecha_hora: new Date().toISOString(),
      });
      return delay(sol);
    },
    getHistorial() {
      return delay([...serviciosHistorial]);
    },
    exportHistorialCSV() {
      const header = "Código,Fecha,Pasajero,Origen,Tarifa,Distancia,Duración,Estado";
      const rows = serviciosHistorial.map((h) => {
        const sol = solicitudes.find((s) => s.id === h.solicitud_id);
        return `${sol?.codigo || ""},${sol?.created_at?.split("T")[0] || ""},"${sol?.nombre_pasajero || ""}","${sol?.punto_recojo_texto || ""}",${h.tarifa_final ?? h.tarifa_sugerida},${h.distancia_real_km ?? h.distancia_estimada_km} km,${h.duracion_real_min ?? h.duracion_estimada_min} min,${h.estado_final}`;
      });
      return delay([header, ...rows].join("\n"));
    },
    getEstadisticas() {
      const libres = unidades.filter((u) => u.estado_actual === "libre").length;
      const ocupadas = unidades.filter((u) => u.estado_actual === "ocupado" || u.estado_actual === "asignado").length;
      const fueraServicio = unidades.filter((u) => u.estado_actual === "fuera_servicio").length;
      const desconectadas = unidades.filter((u) => u.estado_actual === "desconectado").length;
      const hoy = new Date().toISOString().split("T")[0];
      const serviciosHoy = solicitudes.filter((s) => s.created_at.startsWith(hoy)).length;
      return delay({ libres, ocupadas, fueraServicio, desconectadas, serviciosHoy, total: unidades.length });
    },
  },

  usuarios: {
    list() {
      return delay([...usuarios]);
    },
    getById(id: number) {
      return delay(usuarios.find((u) => u.id === id) || null);
    },
    create(data: Partial<Usuario>) {
      const nuevo: Usuario = { id: genId(usuarios), created_at: new Date().toISOString().split("T")[0], ...data } as Usuario;
      usuarios.push(nuevo);
      return delay(nuevo);
    },
    update(id: number, data: Partial<Usuario>) {
      const idx = usuarios.findIndex((u) => u.id === id);
      if (idx === -1) return delay(null);
      usuarios[idx] = { ...usuarios[idx], ...data };
      return delay(usuarios[idx]);
    },
    delete(id: number) {
      const idx = usuarios.findIndex((u) => u.id === id);
      if (idx === -1) return delay(false);
      usuarios.splice(idx, 1);
      return delay(true);
    },
    exportCSV() {
      const header = "Nombres,Email,Teléfono,Rol,Estado,Creado";
      const rows = usuarios.map((u) => `${u.nombres},${u.email},${u.telefono},${u.rol},${u.estado},${u.created_at}`);
      return delay([header, ...rows].join("\n"));
    },
  },

  tarifas: {
    get() {
      return delay([...tarifasConfig]);
    },
    update(id: number, data: Partial<TarifaConfig>) {
      const idx = tarifasConfig.findIndex((t) => t.id === id);
      if (idx === -1) return delay(null);
      tarifasConfig[idx] = { ...tarifasConfig[idx], ...data };
      return delay(tarifasConfig[idx]);
    },
    calcular(tipo: string, distancia: number, duracion: number, nocturno: boolean) {
      return delay(calcularTarifa(tipo, distancia, duracion, nocturno));
    },
  },

  conductores: {
    list() {
      return delay([...conductores]);
    },
  },

  cancelaciones: {
    list() {
      return delay([...cancelaciones]);
    },
  },
};
