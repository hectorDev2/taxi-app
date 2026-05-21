export interface Usuario {
  id: number;
  nombres: string;
  email: string;
  telefono: string;
  rol: "admin" | "operador" | "conductor";
  estado: "activo" | "inactivo";
  created_at: string;
}

export interface Conductor {
  id: number;
  user_id: number;
  dni: string;
  licencia: string;
  unidad_id: number;
  turno: "diurno" | "nocturno";
  telefono: string;
  observaciones: string;
}

export interface Unidad {
  id: number;
  codigo: string;
  placa: string;
  tipo_unidad: "pasajeros" | "carga_pasajeros";
  capacidad: number;
  estado_actual: "libre" | "asignado" | "esperando_pasajero" | "ocupado" | "fuera_servicio" | "desconectado";
  activa: boolean;
  conductor_asignado?: string;
}

export interface UbicacionUnidad {
  id: number;
  unidad_id: number;
  latitud: number;
  longitud: number;
  velocidad: number;
  fecha_hora: string;
}

export interface Solicitud {
  id: number;
  codigo: string;
  canal_origen: "telefono" | "app" | "presencial";
  nombre_pasajero: string;
  telefono_pasajero: string;
  punto_recojo_texto: string;
  latitud_recojo: number;
  longitud_recojo: number;
  tipo_servicio: "pasajeros" | "carga_pasajeros";
  estado: "pendiente" | "asignada" | "aceptada" | "conductor_llego" | "servicio_iniciado" | "servicio_completado" | "cancelada";
  operador_id: number;
  conductor_id?: number;
  unidad_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Asignacion {
  id: number;
  solicitud_id: number;
  unidad_id: number;
  conductor_id: number;
  operador_id: number;
  fecha_asignacion: string;
  fecha_aceptacion?: string;
  fecha_llegada?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: string;
}

export interface TarifaConfig {
  id: number;
  nombre: string;
  tarifa_base: number;
  costo_por_km: number;
  costo_por_minuto: number;
  recargo_nocturno: number;
  recargo_tipo_unidad: number;
  vigente_desde: string;
}

export interface ServicioHistorial {
  id: number;
  solicitud_id: number;
  tarifa_sugerida: number;
  tarifa_final?: number;
  distancia_estimada_km: number;
  duracion_estimada_min: number;
  distancia_real_km?: number;
  duracion_real_min?: number;
  estado_final: string;
}

export interface Cancelacion {
  id: number;
  solicitud_id: number;
  motivo: string;
  registrado_por: "pasajero" | "operador" | "conductor";
  fecha_hora: string;
}

const now = new Date();
const today = now.toISOString().split("T")[0];

export const usuarios: Usuario[] = [
  { id: 1, nombres: "Fritz Arone", email: "admin@apptaxi.com", telefono: "999000111", rol: "admin", estado: "activo", created_at: "2026-01-15" },
  { id: 2, nombres: "María López", email: "maria@apptaxi.com", telefono: "999000222", rol: "operador", estado: "activo", created_at: "2026-02-01" },
  { id: 3, nombres: "Carlos Ruiz", email: "carlos@apptaxi.com", telefono: "999000333", rol: "operador", estado: "activo", created_at: "2026-02-01" },
  { id: 4, nombres: "Juan Pérez", email: "juan@conductor.com", telefono: "999000444", rol: "conductor", estado: "activo", created_at: "2026-01-20" },
  { id: 5, nombres: "Pedro García", email: "pedro@conductor.com", telefono: "999000555", rol: "conductor", estado: "activo", created_at: "2026-01-20" },
  { id: 6, nombres: "Ana Torres", email: "ana@conductor.com", telefono: "999000666", rol: "conductor", estado: "activo", created_at: "2026-02-10" },
  { id: 7, nombres: "Luis Mendoza", email: "luis@conductor.com", telefono: "999000777", rol: "conductor", estado: "inactivo", created_at: "2026-02-10" },
  { id: 8, nombres: "Rosa Flores", email: "rosa@conductor.com", telefono: "999000888", rol: "conductor", estado: "activo", created_at: "2026-03-01" },
];

export const conductores: Conductor[] = [
  { id: 1, user_id: 4, dni: "12345678", licencia: "L-001", unidad_id: 1, turno: "diurno", telefono: "999000444", observaciones: "" },
  { id: 2, user_id: 5, dni: "23456789", licencia: "L-002", unidad_id: 2, turno: "diurno", telefono: "999000555", observaciones: "Disponible fines de semana" },
  { id: 3, user_id: 6, dni: "34567890", licencia: "L-003", unidad_id: 3, turno: "nocturno", telefono: "999000666", observaciones: "" },
  { id: 4, user_id: 7, dni: "45678901", licencia: "L-004", unidad_id: 4, turno: "diurno", telefono: "999000777", observaciones: "De vacaciones" },
  { id: 5, user_id: 8, dni: "56789012", licencia: "L-005", unidad_id: 5, turno: "nocturno", telefono: "999000888", observaciones: "" },
];

export const unidades: Unidad[] = [
  { id: 1, codigo: "U-001", placa: "ABC-123", tipo_unidad: "pasajeros", capacidad: 4, estado_actual: "libre", activa: true, conductor_asignado: "Juan Pérez" },
  { id: 2, codigo: "U-002", placa: "DEF-456", tipo_unidad: "carga_pasajeros", capacidad: 6, estado_actual: "ocupado", activa: true, conductor_asignado: "Pedro García" },
  { id: 3, codigo: "U-003", placa: "GHI-789", tipo_unidad: "pasajeros", capacidad: 4, estado_actual: "libre", activa: true, conductor_asignado: "Ana Torres" },
  { id: 4, codigo: "U-004", placa: "JKL-012", tipo_unidad: "pasajeros", capacidad: 4, estado_actual: "fuera_servicio", activa: false, conductor_asignado: "Luis Mendoza" },
  { id: 5, codigo: "U-005", placa: "MNO-345", tipo_unidad: "carga_pasajeros", capacidad: 6, estado_actual: "libre", activa: true, conductor_asignado: "Rosa Flores" },
  { id: 6, codigo: "U-006", placa: "PQR-678", tipo_unidad: "pasajeros", capacidad: 4, estado_actual: "asignado", activa: true },
  { id: 7, codigo: "U-007", placa: "STU-901", tipo_unidad: "pasajeros", capacidad: 4, estado_actual: "desconectado", activa: true },
  { id: 8, codigo: "U-008", placa: "VWX-234", tipo_unidad: "carga_pasajeros", capacidad: 6, estado_actual: "libre", activa: true },
];

export const ubicaciones: UbicacionUnidad[] = [
  { id: 1, unidad_id: 1, latitud: -12.0464, longitud: -77.0428, velocidad: 0, fecha_hora: `${today}T10:30:00` },
  { id: 2, unidad_id: 2, latitud: -12.0564, longitud: -77.0528, velocidad: 35, fecha_hora: `${today}T10:30:00` },
  { id: 3, unidad_id: 3, latitud: -12.0364, longitud: -77.0328, velocidad: 0, fecha_hora: `${today}T10:30:00` },
  { id: 4, unidad_id: 5, latitud: -12.0664, longitud: -77.0628, velocidad: 0, fecha_hora: `${today}T10:30:00` },
  { id: 5, unidad_id: 6, latitud: -12.0264, longitud: -77.0228, velocidad: 20, fecha_hora: `${today}T10:30:00` },
  { id: 6, unidad_id: 8, latitud: -12.0764, longitud: -77.0728, velocidad: 0, fecha_hora: `${today}T10:30:00` },
];

export const solicitudes: Solicitud[] = [
  {
    id: 1, codigo: "S-001", canal_origen: "telefono",
    nombre_pasajero: "Carlos Mendoza", telefono_pasajero: "987654321",
    punto_recojo_texto: "Av. Arequipa 123, Cercado de Lima",
    latitud_recojo: -12.0464, longitud_recojo: -77.0428,
    tipo_servicio: "pasajeros", estado: "pendiente",
    operador_id: 2, created_at: `${today}T08:30:00`, updated_at: `${today}T08:30:00`,
  },
  {
    id: 2, codigo: "S-002", canal_origen: "telefono",
    nombre_pasajero: "Ana López", telefono_pasajero: "987654322",
    punto_recojo_texto: "Jr. La Unión 456, Lima",
    latitud_recojo: -12.0510, longitud_recojo: -77.0380,
    tipo_servicio: "pasajeros", estado: "asignada",
    operador_id: 2, conductor_id: 2, unidad_id: 2,
    created_at: `${today}T09:00:00`, updated_at: `${today}T09:05:00`,
  },
  {
    id: 3, codigo: "S-003", canal_origen: "telefono",
    nombre_pasajero: "Pedro García", telefono_pasajero: "987654323",
    punto_recojo_texto: "Calle Real 789, San Martín de Porres",
    latitud_recojo: -12.0364, longitud_recojo: -77.0328,
    tipo_servicio: "carga_pasajeros", estado: "servicio_completado",
    operador_id: 3, conductor_id: 3, unidad_id: 3,
    created_at: `${today}T07:00:00`, updated_at: `${today}T08:15:00`,
  },
  {
    id: 4, codigo: "S-004", canal_origen: "presencial",
    nombre_pasajero: "Lucía Torres", telefono_pasajero: "987654324",
    punto_recojo_texto: "Av. Brasil 321, Jesús María",
    latitud_recojo: -12.0564, longitud_recojo: -77.0528,
    tipo_servicio: "pasajeros", estado: "cancelada",
    operador_id: 3,
    created_at: `${today}T09:30:00`, updated_at: `${today}T09:45:00`,
  },
  {
    id: 5, codigo: "S-005", canal_origen: "telefono",
    nombre_pasajero: "Miguel Ángel Ruiz", telefono_pasajero: "987654325",
    punto_recojo_texto: "Av. La Marina 2400, San Miguel",
    latitud_recojo: -12.0610, longitud_recojo: -77.0480,
    tipo_servicio: "pasajeros", estado: "aceptada",
    operador_id: 2, conductor_id: 1, unidad_id: 1,
    created_at: `${today}T10:00:00`, updated_at: `${today}T10:02:00`,
  },
  {
    id: 6, codigo: "S-006", canal_origen: "telefono",
    nombre_pasajero: "Sofía Castillo", telefono_pasajero: "987654326",
    punto_recojo_texto: "Calle Los Olivos 150, San Isidro",
    latitud_recojo: -12.0664, longitud_recojo: -77.0628,
    tipo_servicio: "pasajeros", estado: "pendiente",
    operador_id: 2,
    created_at: `${today}T10:15:00`, updated_at: `${today}T10:15:00`,
  },
  {
    id: 7, codigo: "S-007", canal_origen: "app",
    nombre_pasajero: "Diego Ramos", telefono_pasajero: "987654327",
    punto_recojo_texto: "Av. Universitaria 500, Pueblo Libre",
    latitud_recojo: -12.0710, longitud_recojo: -77.0580,
    tipo_servicio: "carga_pasajeros", estado: "servicio_iniciado",
    operador_id: 3, conductor_id: 5, unidad_id: 5,
    created_at: `${today}T10:00:00`, updated_at: `${today}T10:20:00`,
  },
  {
    id: 8, codigo: "S-008", canal_origen: "telefono",
    nombre_pasajero: "Carmen Vega", telefono_pasajero: "987654328",
    punto_recojo_texto: "Jr. Las Flores 320, Lince",
    latitud_recojo: -12.0764, longitud_recojo: -77.0728,
    tipo_servicio: "pasajeros", estado: "conductor_llego",
    operador_id: 2, conductor_id: 1, unidad_id: 1,
    created_at: `${today}T10:10:00`, updated_at: `${today}T10:25:00`,
  },
  {
    id: 9, codigo: "S-009", canal_origen: "telefono",
    nombre_pasajero: "Anónimo", telefono_pasajero: "",
    punto_recojo_texto: "Av. La Molina 1000, La Molina",
    latitud_recojo: -12.0810, longitud_recojo: -76.9480,
    tipo_servicio: "pasajeros", estado: "servicio_completado",
    operador_id: 2, conductor_id: 3, unidad_id: 3,
    created_at: "2026-05-18T14:00:00", updated_at: "2026-05-18T14:45:00",
  },
  {
    id: 10, codigo: "S-010", canal_origen: "presencial",
    nombre_pasajero: "Roberto Sánchez", telefono_pasajero: "987654329",
    punto_recojo_texto: "Calle Los Sauces 200, Surco",
    latitud_recojo: -12.0910, longitud_recojo: -76.9680,
    tipo_servicio: "pasajeros", estado: "cancelada",
    operador_id: 3,
    created_at: "2026-05-18T16:00:00", updated_at: "2026-05-18T16:10:00",
  },
];

export const asignaciones: Asignacion[] = [
  { id: 1, solicitud_id: 2, unidad_id: 2, conductor_id: 2, operador_id: 2, fecha_asignacion: `${today}T09:05:00`, estado: "asignada" },
  { id: 2, solicitud_id: 3, unidad_id: 3, conductor_id: 3, operador_id: 3, fecha_asignacion: `${today}T07:05:00`, fecha_aceptacion: `${today}T07:06:00`, fecha_llegada: `${today}T07:20:00`, fecha_inicio: `${today}T07:25:00`, fecha_fin: `${today}T08:15:00`, estado: "completado" },
  { id: 3, solicitud_id: 5, unidad_id: 1, conductor_id: 1, operador_id: 2, fecha_asignacion: `${today}T10:02:00`, fecha_aceptacion: `${today}T10:03:00`, estado: "aceptada" },
  { id: 4, solicitud_id: 7, unidad_id: 5, conductor_id: 5, operador_id: 3, fecha_asignacion: `${today}T10:05:00`, fecha_aceptacion: `${today}T10:06:00`, fecha_llegada: `${today}T10:15:00`, fecha_inicio: `${today}T10:20:00`, estado: "en_curso" },
  { id: 5, solicitud_id: 8, unidad_id: 1, conductor_id: 1, operador_id: 2, fecha_asignacion: `${today}T10:12:00`, fecha_aceptacion: `${today}T10:13:00`, fecha_llegada: `${today}T10:25:00`, estado: "conductor_llego" },
];

export const tarifasConfig: TarifaConfig[] = [
  { id: 1, nombre: "Tarifa Diurna Estándar", tarifa_base: 5.00, costo_por_km: 2.50, costo_por_minuto: 0.50, recargo_nocturno: 25, recargo_tipo_unidad: 20, vigente_desde: "2026-01-01" },
];

export const serviciosHistorial: ServicioHistorial[] = [
  { id: 1, solicitud_id: 3, tarifa_sugerida: 22.00, tarifa_final: 22.00, distancia_estimada_km: 5.5, duracion_estimada_min: 25, distancia_real_km: 6.0, duracion_real_min: 50, estado_final: "completado" },
  { id: 2, solicitud_id: 9, tarifa_sugerida: 18.50, tarifa_final: 20.00, distancia_estimada_km: 4.0, duracion_estimada_min: 20, distancia_real_km: 4.5, duracion_real_min: 45, estado_final: "completado" },
  { id: 3, solicitud_id: 5, tarifa_sugerida: 15.00, distancia_estimada_km: 3.2, duracion_estimada_min: 15, estado_final: "cancelada" },
  { id: 4, solicitud_id: 1, tarifa_sugerida: 28.50, tarifa_final: 28.50, distancia_estimada_km: 7.0, duracion_estimada_min: 30, distancia_real_km: 7.5, duracion_real_min: 35, estado_final: "completado" },
  { id: 5, solicitud_id: 2, tarifa_sugerida: 12.00, distancia_estimada_km: 2.0, duracion_estimada_min: 10, estado_final: "cancelada" },
  { id: 6, solicitud_id: 10, tarifa_sugerida: 35.00, tarifa_final: 35.00, distancia_estimada_km: 9.0, duracion_estimada_min: 40, distancia_real_km: 8.8, duracion_real_min: 42, estado_final: "completado" },
];

export const cancelaciones: Cancelacion[] = [
  { id: 1, solicitud_id: 4, motivo: "Pasajero canceló por demora", registrado_por: "pasajero", fecha_hora: `${today}T09:45:00` },
  { id: 2, solicitud_id: 10, motivo: "No se encontró unidad disponible", registrado_por: "operador", fecha_hora: "2026-05-18T16:10:00" },
];

export function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcularTarifa(tipo: string, distanciaKm: number, duracionMin: number, esNocturno: boolean): number {
  const cfg = tarifasConfig[0];
  let total = cfg.tarifa_base + (distanciaKm * cfg.costo_por_km) + (duracionMin * cfg.costo_por_minuto);
  if (esNocturno) total += total * (cfg.recargo_nocturno / 100);
  if (tipo === "carga_pasajeros") total += total * (cfg.recargo_tipo_unidad / 100);
  return Math.round(total * 100) / 100;
}
