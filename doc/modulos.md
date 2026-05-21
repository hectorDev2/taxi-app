# Taxi App — Módulos del Sistema

> Documentación generada el 2026-05-21.
> Stack: Next.js 16.2.6 (App Router) + TypeScript + Tailwind v4 + Mapbox GL + React Context.

---

## 1. Módulos Implementados

### 1.1 Autenticación y Sesión
| Archivo | Ruta |
|---|---|
| `src/lib/auth-context.tsx` | Contexto de autenticación |
| `src/components/auth-guard.tsx` | Protección de rutas |
| `src/app/page.tsx` | Login page (`/`) |

- Login con email/contraseña
- 3 roles: `admin`, `operador`, `conductor`
- Sesión persistida en `localStorage`
- Logout con limpieza de sesión

### 1.2 Dashboard
| Archivo | Ruta |
|---|---|
| `src/app/dashboard/page.tsx` | Dashboard principal |
| `src/app/dashboard/layout.tsx` | Layout con sidebar |

- 4 KPIs: unidades libres, ocupadas, servicios hoy, fuera de servicio
- Mapa con ubicación de unidades
- Últimas 5 solicitudes con badges de estado

### 1.3 Gestión de Flota (Unidades)
| Archivo | Ruta |
|---|---|
| `src/app/unidades/page.tsx` | CRUD de unidades |

- Tabla con código, patente, tipo, capacidad, estado, conductor
- Mapa con marcadores de todas las unidades
- Contadores por estado
- Filtros: estado, tipo de vehículo
- 6 estados: `libre`, `asignado`, `esperando_pasajero`, `ocupado`, `fuera_servicio`, `desconectado`

### 1.4 Gestión de Solicitudes
| Archivo | Ruta |
|---|---|
| `src/app/solicitudes/page.tsx` | Listado con filtros |
| `src/app/solicitudes/nueva/page.tsx` | Formulario de creación |
| `src/app/solicitudes/[id]/page.tsx` | Detalle y asignación |

- Listado con búsqueda por código/pasajero/dirección/teléfono
- Filtros por estado
- Creación con datos de pasajero, tipo de servicio, asignación opcional
- Detalle con mapa, timeline, cancelación (con motivo), asignación de unidad
- 7 estados: `pendiente`, `asignada`, `aceptada`, `conductor_llego`, `servicio_iniciado`, `servicio_completado`, `cancelada`
- 3 canales: `telefono`, `app`, `presencial`

### 1.5 Historial de Servicios
| Archivo | Ruta |
|---|---|
| `src/app/historial/page.tsx` | Historial |

- Lista servicios completados y cancelados
- Muestra tarifa, distancia, duración
- Filtros: estado, fecha, búsqueda
- Botón de exportar (UI únicamente)

### 1.6 Gestión de Usuarios
| Archivo | Ruta |
|---|---|
| `src/app/usuarios/page.tsx` | CRUD de usuarios |

- Tabla: nombre, email, teléfono, rol, estado, fecha creación
- Filtros: rol, estado
- Eliminar con confirmación toast
- Botones de nuevo/editar (UI únicamente, sin lógica)

### 1.7 Configuración
| Archivo | Ruta |
|---|---|
| `src/app/configuracion/page.tsx` | Ajustes del sistema |

- Tarifas: base, costo por km, costo por minuto, recargo nocturno %, recargo por tipo vehículo
- Tipos de unidad: Pasajeros (4 asientos), Carga+Pasajeros (6 asientos)
- Preferencias generales: frecuencia GPS, retención de ubicaciones
- Botón guardar (UI únicamente, sin lógica)

### 1.8 Mapas
| Archivo | Ruta |
|---|---|
| `src/components/map.tsx` | Componente Mapbox GL |

- Mapbox GL con estilo Streets v12
- Marcadores con colores personalizados
- Rutas desde Mapbox Directions API
- Auto-zoom a límites de ruta
- Controles de navegación
- Helper `fetchRoute()` exportado

### 1.9 Sistema de Notificaciones (Toast)
| Archivo | Ruta |
|---|---|
| `src/components/toast.tsx` | Toast via React Context |

- Variantes: success (verde), error (rojo)
- Auto-dismiss 3.5s
- Dismiss manual con botón
- Animación slide-up

### 1.10 Capa de Datos Mock
| Archivo | Ruta |
|---|---|
| `src/lib/mock-data.ts` | Tipos + datos semilla |
| `src/lib/mock-api.ts` | API simulada |

- 8 interfaces: Usuario, Conductor, Unidad, UbicacionUnidad, Solicitud, Asignacion, TarifaConfig, ServicioHistorial, Cancelacion
- Seed data: 8 usuarios, 5 conductores, 8 unidades, 6 ubicaciones, 10 solicitudes, 2 historiales
- Delay simulado de 200ms
- CRUD para usuarios y solicitudes
- Cálculo de distancia (Haversine)
- Cálculo de tarifas con recargos
- Unidades más cercanas ordenadas por distancia

### 1.11 UI Compartida
| Archivo | Ruta |
|---|---|
| `src/components/sidebar.tsx` | Sidebar de navegación |
| `src/components/header.tsx` | Encabezado de página |
| `src/components/skeleton.tsx` | Skeletons (Card, Table, Map, Line) |

---

## 2. Tech Stack

| Categoría | Elección |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Lenguaje | TypeScript 5 (strict) |
| UI | Tailwind CSS v4 |
| Iconos | Lucide React |
| Mapas | Mapbox GL JS v3.24 |
| Estado | React Context (sin librería externa) |
| Fuentes | Geist (next/font/google) |
| Linting | ESLint 9 + eslint-config-next |
| Path alias | `@/` → `./src/*` |

---

## 3. Arquitectura

```
React Context (AuthContext, ToastContext)
         |
    ┌────┴────┐
    |  Pages  |  (App Router, 9 rutas)
    └────┬────┘
         |
    ┌────┼────────────┐
    |    |            |
Components      Mock API      Mock Data
(sidebar,     (mock-api.ts)  (mock-data.ts)
 map, toast,      |              |
 skeleton,        |       Types + Seed Data
 header,          |
 auth-guard)  Simulated 200ms delay
              (no real backend)
```

---

## 4. Módulos Faltantes o Parciales

### 4.1 Críticos

| Módulo | Estado | Detalle |
|---|---|---|
| Backend real / API | ❌ Ausente | Todo es mock client-side con `setTimeout`. Sin base de datos, sin persistencia real. |
| API Routes (`src/app/api/`) | ❌ Ausente | Cero route handlers de Next.js |
| Tiempo real (WebSocket/SSE) | ❌ Ausente | Sin Socket.io, SSE, ni live tracking. Datos estáticos. |
| App conductor (mobile) | ❌ Ausente | No hay interfaz para conductores. El rol `conductor` existe en datos pero no tiene UI. |
| App pasajero (mobile/web) | ❌ Ausente | No hay app de pasajeros. El canal `app` existe como dato. |
| Pagos | ❌ Ausente | Sin procesamiento de pagos, facturación, ni recibos. |
| Notificaciones push | ❌ Ausente | Sin FCM, APNS, ni Web Push. |
| GPS tracking real-time | ❌ Ausente | Ubicaciones son datos semilla estáticos. |
| Flujo aceptación conductor | ❌ Ausente | El operador asigna pero no hay accept/reject del conductor. |
| Ciclo de vida del viaje | ⚠️ Parcial | Estados existen pero transiciones son manuales vía API mock. |

### 4.2 Funcionalidades pendientes

| Feature | Archivo | Estado |
|---|---|---|
| Geo-search / autocomplete | `solicitudes/nueva/page.tsx` | ❌ Campo dirección texto plano, sin Mapbox Geocoding |
| Programar viaje futuro | `solicitudes/nueva/page.tsx` | ❌ Sin date/time picker |
| Ubicación conductor en vivo | `solicitudes/[id]/page.tsx` | ❌ Marcador sin actualización en tiempo real |
| Auditoría de operaciones | todas las páginas | ❌ Sin trail de quién hizo qué y cuándo |

### 4.3 Funcionalidades completadas (antes fantasma)

| Feature | Archivo | Ahora |
|---|---|---|
| Crear/Editar usuario | `usuarios/page.tsx` | ✅ Modal con formulario completo |
| Exportar historial CSV | `historial/page.tsx` | ✅ Genera y descarga CSV real |
| Guardar configuración | `configuracion/page.tsx` | ✅ Conectado a api.tarifas.update() |
| Control de acceso por rol | `sidebar.tsx` / `auth-guard.tsx` | ✅ Sidebar filtra por rol, AuthGuard soporta allowedRoles |
| Paginación | todas las tablas | ✅ Componente Pagination reutilizable |
| i18n / multi-idioma | toda la app | Solo español, hardcodeado |
| Dark mode | toda la app | Solo tema claro |

### 4.3 Módulos inexistentes (esperables en producción)

- Reportes y analítica (sin gráficos, sin exportación real)
- Puntuación de conductores (rating de pasajeros)
- Negociación de tarifa / pricing dinámico
- Mantenimiento de vehículos (scheduler de mantenimiento)
- Gestión de turnos (datos de turno existen, sin UI)
- Zonas / geocercas (sin zonas operativas)
- Emergencia / SOS (sin botón de pánico)
- Multi-tenant (una sola empresa)
- Soporte offline (sin service workers, sin IndexedDB)
- Testing (sin Jest, Vitest, Playwright, ni Cypress)

---

## 5. Resumen de Rutas

| Ruta | Página | Estado |
|---|---|---|
| `/` | Login | ✅ |
| `/dashboard` | Dashboard | ✅ |
| `/solicitudes` | Listado solicitudes | ✅ |
| `/solicitudes/nueva` | Nueva solicitud | ✅ |
| `/solicitudes/[id]` | Detalle solicitud | ✅ |
| `/unidades` | Gestión flota | ✅ |
| `/usuarios` | Gestión usuarios | ✅ |
| `/historial` | Historial servicios | ✅ |
| `/configuracion` | Configuración | ✅ |

Sin implementar: rutas de API, app conductor, app pasajero, reportes.
