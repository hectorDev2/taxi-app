# AppTaxi - Panel de Gestión

Plataforma de gestión operativa para empresas de taxis y call centers. Permite visualizar unidades en tiempo real, asignar servicios y registrar la operación diaria.

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS 4 + Lucide React
- **Mapa:** Mapbox GL
- **Estado:** React Context + mock API local
- **Lenguaje:** TypeScript

## Requisitos

- Node.js 20+
- npm 10+
- Token de Mapbox (configurar en `.env.local`)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Usuarios de prueba

| Email | Rol |
|---|---|
| admin@apptaxi.com | Admin |
| maria@apptaxi.com | Operador |
| carlos@apptaxi.com | Operador |

(Cualquier contraseña)

## Funcionalidades implementadas

### Autenticación y sesión
- Login con roles (admin, operador, conductor)
- Persistencia de sesión en localStorage
- Protección de rutas (redirección a login)
- Cierre de sesión

### Dashboard
- Indicadores en tiempo real (libres, ocupados, servicios hoy, fuera servicio)
- Mapa de unidades con Mapbox
- Últimas solicitudes con estado

### Gestión de Unidades
- Mapa de flota con todas las unidades
- Tabla con código, placa, tipo, capacidad, estado y conductor
- Filtros por estado y tipo de vehículo
- Contadores por estado

### Solicitudes
- Creación de solicitud con tipo de servicio y selección de unidad
- Asignación de unidad desde detalle (modal con unidades más cercanas ordenadas por distancia)
- **Trazado de ruta** entre la unidad asignada y el punto de recojo (curva simulada + auto-zoom)
- **Cancelación** con selección de motivo y liberación automática de la unidad
- Flujo completo de estados: pendiente → asignada → aceptada → llegó → iniciado → completado
- Detalle con mapa del punto de recojo, datos del pasajero, unidad y conductor
- Búsqueda por código/pasajero/dirección/teléfono
- Filtro por estado
- Filtros funcionales en todas las tablas (búsqueda, estado, fecha, rol)
- Notificaciones toast en acciones principales (crear, asignar, cancelar, eliminar)
- Skeleton loaders mientras cargan los datos

### Historial
- Listado de servicios completados y cancelados
- Tarifa sugerida, distancia y duración
- Búsqueda por código/pasajero
- Filtros por estado y fecha

### Usuarios
- Listado con roles y estados
- Filtros por rol y estado
- Eliminación con confirmación y toast

### Configuración
- Parámetros de tarifa (base, km, minuto, recargos)
- Tipos de unidad
- Preferencias generales (frecuencia GPS, retención de datos)

## Mapbox

El mapa requiere un token de Mapbox. Crear `.env.local` en la raíz:

```
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_aqui
```

## Mock Data

El frontend consume una API simulada (`src/lib/mock-api.ts`) con datos de ejemplo en `src/lib/mock-data.ts`:
- 8 usuarios, 5 conductores, 8 unidades, 6 ubicaciones
- 10 solicitudes en distintos estados
- 2 servicios en historial con tarifas calculadas
- Tarifario configurable

No requiere backend ni base de datos para funcionar.

## Estructura del proyecto

```
src/
├── app/
│   ├── dashboard/              # Dashboard con indicadores y mapa
│   ├── unidades/               # Gestión de flota
│   ├── solicitudes/            # CRUD + detalle de solicitudes
│   │   ├── nueva/              # Formulario de creación
│   │   └── [id]/               # Detalle de solicitud
│   ├── historial/              # Reportes de servicios
│   ├── usuarios/               # Gestión de usuarios
│   └── configuracion/          # Tarifas y preferencias
├── components/
│   ├── sidebar.tsx             # Navegación lateral
│   ├── header.tsx              # Encabezado de página
│   ├── auth-guard.tsx          # Protección de rutas
│   ├── map.tsx                 # Mapa Mapbox
│   ├── toast.tsx               # Sistema de notificaciones
│   └── skeleton.tsx            # Skeleton loaders
└── lib/
    ├── mock-data.ts            # Datos de ejemplo + utilidades
    ├── mock-api.ts             # API simulada
    └── auth-context.tsx        # Contexto de autenticación
```

## Licencia

Uso interno del proyecto AppTaxi.
