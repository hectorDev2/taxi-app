# AppTaxi — Panel de Gestión + App Conductor

Plataforma de gestión operativa para empresas de taxis y call centers. Permite visualizar unidades en tiempo real, asignar servicios, registrar la operación diaria, y tracking GPS en tiempo real.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **UI:** Tailwind CSS 4 + Lucide React
- **Mapa:** Mapbox GL JS
- **Backend:** Supabase (PostgreSQL + Realtime + Auth)
- **Auth:** Supabase Auth via `@supabase/ssr`
- **Lenguaje:** TypeScript

## Requisitos

- Node.js 20+
- npm 10+
- Cuenta de Supabase (proyecto existente en `bxlfgwuoqslmrzhebipi.supabase.co`)
- Token de Mapbox (configurar en `.env.local`)

## Instalación

```bash
npm install
cp .env.local.example .env.local
# Editar .env.local con valores de Supabase y Mapbox
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://bxlfgwuoqslmrzhebipi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=tu_mapbox_token
```

## URLs de la aplicación

| URL | Descripción |
|-----|-------------|
| `/` | Login (admin/operador) |
| `/dashboard` | Panel admin/operador |
| `/solicitudes` | Listado de solicitudes |
| `/solicitudes/nueva` | Crear nueva solicitud |
| `/unidades` | Gestión de flota |
| `/usuarios` | Gestión de usuarios |
| `/historial` | Reportes de servicios |
| `/configuracion` | Tarifas y preferencias |
| `/driver` | Login conductor |
| `/driver/dashboard` | App del conductor |

## Usuarios de prueba

| Email | Rol | Notas |
|-------|-----|-------|
| admin@apptaxi.com | Admin | Acceso total |
| maria@apptaxi.com | Operador | Puede crear y asignar solicitudes |
| carlos@apptaxi.com | Operador | Puede crear y asignar solicitudes |
| conductor@apptaxi.com | Conductor | Login en `/driver` |

## Funcionalidades implementadas

### Autenticación y sesión
- Login con roles diferenciados (admin, operador, conductor)
- Protección de rutas via middleware (`src/proxy.ts`)
- Persistencia de sesión con Supabase SSR
- Roles: `admin`, `operador`, `conductor`

### Dashboard admin/operador (`/dashboard`)
- Indicadores en tiempo real (unidades libres, ocupadas, servicios hoy)
- Mapa de unidades con ubicación real (no simulado)
- Suscripción realtime a cambios en trips y vehicles
- Últimas solicitudes con estado

### Gestión de Solicitudes
- Creación de solicitud con tipo de servicio (pasajeros / carga + pasajeros)
- Mapa interactivo para seleccionar punto de recojo
- Asignación de unidad inmediata
- Estados: `pendiente` → `asignada` → `aceptada` → `conductor_llego` → `servicio_iniciado` → `completado` / `cancelada`
- Detalle con mapa, datos del pasajero, unidad y conductor
- Búsqueda y filtros por estado

### App Conductor (`/driver/dashboard`)
- Dashboard dedicado para conductores
- Lista de viajes asignados
- Transiciones de estado: Aceptar → Llegué al recojo → Iniciar servicio → Completar
- Mapa con ubicación actual, punto de recojo y destino
- Toggle online/offline
- **LocationTracker**: GPS real que actualiza posición cada 10s via `POST /api/drivers/{id}/location`

### Realtime
- Supabase Realtime (postgres_changes) para trips y vehicles
- `useTripsRealtime`, `useVehiclesRealtime`, `useDriverLocationRealtime` en `src/lib/services/realtime.ts`
- Mapa se actualiza cuando el conductor actualiza su ubicación

### API Routes
- `POST /api/auth/logout` — logout con revocación de sesión
- `GET/POST /api/profiles` — CRUD de perfiles
- `GET/PUT /api/profiles/[id]` — leer/actualizar perfil individual
- `POST /api/drivers/[id]/location` — actualizar ubicación GPS del conductor

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Login admin/operador
│   ├── driver/
│   │   ├── page.tsx               # Login conductor
│   │   └── dashboard/page.tsx      # Dashboard conductor
│   ├── (panel)/                    # Panel admin/operador
│   │   ├── dashboard/page.tsx
│   │   ├── solicitudes/
│   │   ├── unidades/
│   │   ├── usuarios/
│   │   ├── historial/
│   │   └── configuracion/
│   └── api/
│       ├── auth/logout/
│       ├── profiles/
│       └── drivers/[id]/location/  # GPS update endpoint
├── components/
│   ├── map.tsx                     # Mapa Mapbox
│   ├── location-tracker.tsx         # GPS tracker para driver
│   ├── sidebar.tsx, header.tsx
│   ├── toast.tsx, skeleton.tsx
│   └── error-boundary.tsx
├── lib/
│   ├── auth-context.tsx             # Auth context + useAuth hook
│   ├── supabase/
│   │   ├── client.ts               # Browser client (createBrowserClient)
│   │   ├── server.ts               # Server client (createServerClient)
│   │   └── admin.ts                 # Admin client
│   └── services/
│       ├── trip-service.ts         # CRUD trips + realtime
│       ├── vehicle-service.ts       # CRUD vehicles + realtime
│       ├── profile-service.ts
│       ├── tariff-service.ts
│       ├── realtime.ts             # Hooks: useTripsRealtime, useVehiclesRealtime, useDriverLocationRealtime
│       └── types.ts                # AppTrip, AppVehicle, AppUser
└── proxy.ts                        # Auth middleware
supabase/
└── migrations/
    ├── 20260522231002_initial_schema.sql   # Schema inicial
    └── 20260529_fix_rls_operator_trips.sql # RLS para operadores
```

## Known issues / limitaciones del MVP

- **No driver mobile app** — Conductor usa web dashboard. Sin GPS background ni notificaciones push.
- **No passenger self-booking** — Todas las solicitudes las crea el operador.
- **No push notifications** — El conductor no recibe alertas cuando le asignan un viaje.
- **No pricing integration** — Tarifa no se calcula automáticamente al completar.
- **No payment flow** — Tabla `payments` existe pero no hay flujo de pago.
- **Logout API rota** — El endpoint `/api/auth/logout` no existe aún, solo limpia localStorage.
- **Toggle online/offline no persiste** — El botón de estado online existe pero no escribe `is_online` en la DB.
- **`libres` stat incorrecto** — `trip-service.ts` calcula mal restando solo ocupados, no verifica conductor asignado.

## Migraciones de base de datos

```bash
# Aplicar migraciones al proyecto linked
supabase db push

# Ver migraciones aplicadas
supabase migration list
```

## Desarrolladores

Para correr el proyecto:

```bash
npm install
npm run dev
```

Para aplicar migraciones de Supabase (requiere `supabase login`):

```bash
supabase db push
```

El proyecto usa Supabase hosted (`bxlfgwuoqslmrzhebipi.supabase.co`). Para desarrollo local, configurar `SUPABASE_DB_PASSWORD` y usar `--local` flag.