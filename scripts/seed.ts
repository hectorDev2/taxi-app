import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- DATA ----

const USERS = [
  { email: "admin@apptaxi.com", password: "admin123456", metadata: { role: "admin", full_name: "Admin Principal" } },
  { email: "operador1@apptaxi.com", password: "operador123456", metadata: { role: "operator", full_name: "Sofía Huamán" } },
  { email: "operador2@apptaxi.com", password: "operador123456", metadata: { role: "operator", full_name: "Miguel Quispe" } },
  { email: "carlos@apptaxi.com", password: "conductor123456", metadata: { role: "driver", full_name: "Carlos López", phone: "+5183991001" } },
  { email: "ana@apptaxi.com", password: "conductor123456", metadata: { role: "driver", full_name: "Ana Torres", phone: "+5183991002" } },
  { email: "pedro@apptaxi.com", password: "conductor123456", metadata: { role: "driver", full_name: "Pedro Sánchez", phone: "+5183991003" } },
  { email: "lucia@apptaxi.com", password: "conductor123456", metadata: { role: "driver", full_name: "Lucía Gutiérrez", phone: "+5183991004" } },
  { email: "jorge@apptaxi.com", password: "conductor123456", metadata: { role: "driver", full_name: "Jorge Ccahua", phone: "+5183991005" } },
  { email: "rosa@apptaxi.com", password: "conductor123456", metadata: { role: "driver", full_name: "Rosa Huillca", phone: "+5183991006" } },
  { email: "ricardo@apptaxi.com", password: "pasajero123456", metadata: { role: "passenger", full_name: "Ricardo Paredes", phone: "+5183992001" } },
  { email: "elena@apptaxi.com", password: "pasajero123456", metadata: { role: "passenger", full_name: "Elena Zúñiga", phone: "+5183992002" } },
  { email: "marco@apptaxi.com", password: "pasajero123456", metadata: { role: "passenger", full_name: "Marco Yépez", phone: "+5183992003" } },
  { email: "carmen@apptaxi.com", password: "pasajero123456", metadata: { role: "passenger", full_name: "Carmen Huamán", phone: "+5183992004" } },
] as const;

type UserMeta = { role: string; full_name: string; phone?: string };

const VEHICLES: { meta: UserMeta; brand: string; model: string; year: number; license_plate: string; color: string; seats: number; vehicle_type: string; code: string }[] = [
  { meta: { role: "driver", full_name: "Carlos López", phone: "+5183991001" }, brand: "Toyota", model: "Corolla", year: 2023, license_plate: "APX-123", color: "Blanco", seats: 4, vehicle_type: "passengers", code: "V-001" },
  { meta: { role: "driver", full_name: "Ana Torres", phone: "+5183991002" }, brand: "Nissan", model: "Versa", year: 2024, license_plate: "APY-456", color: "Negro", seats: 4, vehicle_type: "passengers", code: "V-002" },
  { meta: { role: "driver", full_name: "Pedro Sánchez", phone: "+5183991003" }, brand: "Hyundai", model: "Accent", year: 2023, license_plate: "APZ-789", color: "Azul", seats: 4, vehicle_type: "passengers", code: "V-003" },
  { meta: { role: "driver", full_name: "Lucía Gutiérrez", phone: "+5183991004" }, brand: "Kia", model: "Picanto", year: 2024, license_plate: "AQA-101", color: "Rojo", seats: 4, vehicle_type: "passengers", code: "V-004" },
  { meta: { role: "driver", full_name: "Jorge Ccahua", phone: "+5183991005" }, brand: "Toyota", model: "Hilux", year: 2022, license_plate: "AQB-202", color: "Plata", seats: 6, vehicle_type: "cargo_passengers", code: "V-005" },
  { meta: { role: "driver", full_name: "Rosa Huillca", phone: "+5183991006" }, brand: "Suzuki", model: "Swift", year: 2024, license_plate: "AQC-303", color: "Verde", seats: 4, vehicle_type: "passengers", code: "V-006" },
];

const TARIFFS = [
  { name: "Tarifa Diurna Estándar", base_fare: 6.00, cost_per_km: 2.50, cost_per_minute: 0.50, night_surcharge: 0, vehicle_type_surcharge: 0 },
  { name: "Tarifa Nocturna", base_fare: 8.00, cost_per_km: 3.50, cost_per_minute: 0.80, night_surcharge: 25, vehicle_type_surcharge: 20 },
];

// Abancay locations
const LOCATIONS = {
  plazaArmas: { lat: -13.6348, lng: -72.8800, addr: "Plaza de Armas, Abancay" },
  avDiazBarcenas: { lat: -13.6363, lng: -72.8777, addr: "Av. Díaz Bárcenas 250, Abancay" },
  avCastilla: { lat: -13.6353, lng: -72.8824, addr: "Av. Ramón Castilla 180, Abancay" },
  avPeru: { lat: -13.6391, lng: -72.8775, addr: "Av. Perú 410, Abancay" },
  mercado: { lat: -13.6378, lng: -72.8808, addr: "Jr. Puno 120, Abancay" },
  hospital: { lat: -13.6401, lng: -72.8769, addr: "Av. Perú s/n, Hospital Regional, Abancay" },
  universidad: { lat: -13.6297, lng: -72.8721, addr: "Ciudad Universitaria UNAMBA, Abancay" },
  terminal: { lat: -13.6318, lng: -72.8844, addr: "Terminal Terrestre, Abancay" },
  parqueMicaela: { lat: -13.6364, lng: -72.8814, addr: "Parque Micaela Bastidas, Abancay" },
  saneamiento: { lat: -13.6335, lng: -72.8785, addr: "EMSAPA, Av. Ramón Castilla, Abancay" },
};

interface TripSeed {
  passenger: UserMeta;
  driver?: UserMeta;
  operator?: UserMeta;
  status: string;
  pickup: keyof typeof LOCATIONS;
  dropoff: keyof typeof LOCATIONS;
  service_type: string;
  channel: string;
  estimated_price: number;
  final_price?: number;
  code: string;
  hoursAgo: number;
  // for completed trips
  duration_minutes?: number;
  cancel_reason?: string;
  cancelled_by?: string;
  payment_method?: string;
  rating?: number;
  rating_comment?: string;
}

const TRIPS: TripSeed[] = [
  // 1. Pending — created by operator via phone
  {
    passenger: { role: "passenger", full_name: "Carmen Huamán", phone: "+5183992004" },
    operator: { role: "operator", full_name: "Sofía Huamán" },
    status: "pending",
    pickup: "avCastilla",
    dropoff: "hospital",
    service_type: "passengers",
    channel: "phone",
    estimated_price: 8.50,
    code: "AB-0001",
    hoursAgo: 1,
  },
  // 2. Pending — created via app
  {
    passenger: { role: "passenger", full_name: "Marco Yépez", phone: "+5183992003" },
    status: "pending",
    pickup: "plazaArmas",
    dropoff: "universidad",
    service_type: "passengers",
    channel: "app",
    estimated_price: 12.00,
    code: "AB-0002",
    hoursAgo: 0.5,
  },
  // 3. Accepted — driver assigned, heading to pickup
  {
    passenger: { role: "passenger", full_name: "Ricardo Paredes", phone: "+5183992001" },
    driver: { role: "driver", full_name: "Carlos López", phone: "+5183991001" },
    status: "accepted",
    pickup: "avDiazBarcenas",
    dropoff: "terminal",
    service_type: "passengers",
    channel: "app",
    estimated_price: 10.00,
    code: "AB-0003",
    hoursAgo: 0.75,
  },
  // 4. Arrived — driver waiting at pickup
  {
    passenger: { role: "passenger", full_name: "Elena Zúñiga", phone: "+5183992002" },
    driver: { role: "driver", full_name: "Ana Torres", phone: "+5183991002" },
    status: "arrived",
    pickup: "parqueMicaela",
    dropoff: "mercado",
    service_type: "passengers",
    channel: "app",
    estimated_price: 6.00,
    code: "AB-0004",
    hoursAgo: 0.5,
  },
  // 5. In progress — en route to destination
  {
    passenger: { role: "passenger", full_name: "Ricardo Paredes", phone: "+5183992001" },
    driver: { role: "driver", full_name: "Pedro Sánchez", phone: "+5183991003" },
    status: "in_progress",
    pickup: "avPeru",
    dropoff: "saneamiento",
    service_type: "passengers",
    channel: "phone",
    estimated_price: 7.00,
    code: "AB-0005",
    hoursAgo: 0.25,
  },
  // 6. Completed (today) — with payment + rating
  {
    passenger: { role: "passenger", full_name: "Marco Yépez", phone: "+5183992003" },
    driver: { role: "driver", full_name: "Lucía Gutiérrez", phone: "+5183991004" },
    status: "completed",
    pickup: "terminal",
    dropoff: "avCastilla",
    service_type: "passengers",
    channel: "app",
    estimated_price: 9.00,
    final_price: 9.50,
    code: "AB-0006",
    hoursAgo: 3,
    duration_minutes: 18,
    payment_method: "mercadopago",
    rating: 5,
    rating_comment: "Buen servicio, llegó rápido",
  },
  // 7. Completed (yesterday) — cash payment + rating
  {
    passenger: { role: "passenger", full_name: "Carmen Huamán", phone: "+5183992004" },
    driver: { role: "driver", full_name: "Jorge Ccahua", phone: "+5183991005" },
    status: "completed",
    pickup: "universidad",
    dropoff: "plazaArmas",
    service_type: "cargo_passengers",
    channel: "phone",
    estimated_price: 15.00,
    final_price: 16.00,
    code: "AB-0007",
    hoursAgo: 24,
    duration_minutes: 25,
    payment_method: "cash",
    rating: 4,
    rating_comment: "Todo bien, llevó mis bultos",
  },
  // 8. Cancelled by passenger
  {
    passenger: { role: "passenger", full_name: "Elena Zúñiga", phone: "+5183992002" },
    status: "cancelled",
    pickup: "saneamiento",
    dropoff: "avDiazBarcenas",
    service_type: "passengers",
    channel: "walkin",
    estimated_price: 5.50,
    code: "AB-0008",
    hoursAgo: 5,
    cancel_reason: "Cambié de opinión",
    cancelled_by: "passenger",
  },
  // 9. Cancelled by driver (after accepting)
  {
    passenger: { role: "passenger", full_name: "Ricardo Paredes", phone: "+5183992001" },
    driver: { role: "driver", full_name: "Rosa Huillca", phone: "+5183991006" },
    status: "cancelled",
    pickup: "mercado",
    dropoff: "avPeru",
    service_type: "passengers",
    channel: "app",
    estimated_price: 6.50,
    code: "AB-0009",
    hoursAgo: 2,
    cancel_reason: "Vehículo en mantenimiento",
    cancelled_by: "driver",
  },
];

// ---- HELPERS ----

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function minutesAfter(start: string, min: number): string {
  return new Date(new Date(start).getTime() + min * 60000).toISOString();
}

// ---- SEED ----

async function seed() {
  console.log("🌱 Seed — Taxi App (Abancay, Apurímac)\n");

  // ── Phase 1: Users ──
  console.log("── Usuarios ──");

  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      user_metadata: u.metadata,
    });
    if (error) {
      if (error.message.includes("already exists")) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = (list?.users as Array<{ email: string }> | undefined)?.find((x) => x.email === u.email);
        if (existing) {
          console.log(`~ ${u.email} ya existe, omitiendo`);
        }
        continue;
      }
      console.error(`✗ ${u.email}: ${error.message}`);
      continue;
    }
    if (data?.user) {
      await supabase.auth.admin.updateUserById(data.user.id, { email_confirm: true });
      console.log(`✓ ${u.email} (${u.metadata.role})`);
    }
  }

  // Wait for trigger to create profiles
  await sleep(1500);

  // ── Phase 2: Map profiles ──
  const { data: allProfiles } = await supabase.from("profiles").select("id, role, full_name, phone");

  const getProfileId = (meta: UserMeta) =>
    allProfiles?.find((p) => p.full_name === meta.full_name && p.role === meta.role)?.id;

  // ── Phase 3: Vehicles ──
  console.log("\n── Vehículos ──");
  const vehicleMap = new Map<string, string>(); // driver full_name -> vehicle id

  for (const v of VEHICLES) {
    const ownerId = getProfileId(v.meta);
    if (!ownerId) {
      console.log(`~ Conductor "${v.meta.full_name}" no encontrado, omitiendo vehículo`);
      continue;
    }

    const { data: existing } = await supabase.from("vehicles").select("id").eq("license_plate", v.license_plate).maybeSingle();
    if (existing) {
      vehicleMap.set(v.meta.full_name!, existing.id);
      console.log(`~ ${v.license_plate} ya existe`);
      continue;
    }

    const { data, error } = await supabase.from("vehicles").insert({
      owner_id: ownerId,
      brand: v.brand,
      model: v.model,
      year: v.year,
      license_plate: v.license_plate,
      color: v.color,
      seats: v.seats,
      vehicle_type: v.vehicle_type as "passengers" | "cargo_passengers",
      code: v.code,
      is_active: true,
    }).select("id").single();

    if (error) {
      console.error(`✗ ${v.brand} ${v.model}: ${error.message}`);
    } else {
      vehicleMap.set(v.meta.full_name!, data.id);
      console.log(`✓ ${v.brand} ${v.model} (${v.license_plate}) → ${v.meta.full_name}`);
    }
  }

  // ── Phase 4: Set drivers online ──
  console.log("\n── Conductores online ──");
  const driverProfiles = allProfiles?.filter((p) => p.role === "driver") ?? [];

  for (const d of driverProfiles) {
    const locs = Object.values(LOCATIONS);
    const loc = locs[Math.floor(Math.random() * locs.length)];
    const jitter = () => (Math.random() - 0.5) * 0.005;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_online: true,
        current_latitude: loc.lat + jitter(),
        current_longitude: loc.lng + jitter(),
        last_location_update: new Date().toISOString(),
      })
      .eq("id", d.id);

    if (!error) console.log(`✓ ${d.full_name} — online en Abancay`);
  }

  // ── Phase 5: Trips ──
  console.log("\n── Viajes ──");

  for (const t of TRIPS) {
    const passengerId = getProfileId(t.passenger);
    if (!passengerId) {
      console.log(`~ Pasajero "${t.passenger.full_name}" no encontrado, omitiendo viaje ${t.code}`);
      continue;
    }

    const driverId = t.driver ? getProfileId(t.driver) : null;
    const operatorProfile = t.operator ? getProfileId(t.operator) : null;
    const vehicleId = t.driver ? vehicleMap.get(t.driver.full_name!) : null;

    const requestedAt = hoursAgo(t.hoursAgo);
    const acceptedAt = t.driver && t.status !== "pending" ? minutesAfter(requestedAt, 2) : null;

    const arrivedStatuses = ["arrived", "in_progress", "completed"];
    const arrivedAt = arrivedStatuses.includes(t.status) && acceptedAt ? minutesAfter(acceptedAt, 5) : null;

    const startedStatuses = ["in_progress", "completed"];
    const startedAt = startedStatuses.includes(t.status) && arrivedAt ? minutesAfter(arrivedAt, 3) : null;

    const completedAt = t.status === "completed" && startedAt && t.duration_minutes
      ? minutesAfter(startedAt, t.duration_minutes)
      : null;

    const cancelledAt = t.status === "cancelled" && startedAt
      ? minutesAfter(startedAt, 2)
      : t.status === "cancelled" && arrivedAt
        ? minutesAfter(arrivedAt, 2)
        : t.status === "cancelled" && acceptedAt
          ? minutesAfter(acceptedAt, 3)
          : t.status === "cancelled"
            ? minutesAfter(requestedAt, 5)
            : null;

    const pickup = LOCATIONS[t.pickup];
    const dropoff = LOCATIONS[t.dropoff];

    const { data: existingTrip } = await supabase.from("trips").select("id").eq("code", t.code).maybeSingle();
    if (existingTrip) {
      console.log(`~ ${t.code} ya existe, omitiendo`);
      continue;
    }

    const { data: trip, error } = await supabase.from("trips").insert({
      code: t.code,
      passenger_id: passengerId,
      driver_id: driverId,
      operator_id: operatorProfile,
      vehicle_id: vehicleId,
      status: t.status,
      pickup_latitude: pickup.lat,
      pickup_longitude: pickup.lng,
      pickup_address: pickup.addr,
      dropoff_latitude: dropoff.lat,
      dropoff_longitude: dropoff.lng,
      dropoff_address: dropoff.addr,
      estimated_price: t.estimated_price,
      final_price: t.final_price ?? null,
      service_type: t.service_type as "passengers" | "cargo_passengers",
      channel: t.channel as "phone" | "app" | "walkin",
      passenger_name: t.passenger.full_name,
      passenger_phone: t.passenger.phone,
      requested_at: requestedAt,
      accepted_at: acceptedAt,
      arrived_at: arrivedAt,
      started_at: startedAt,
      completed_at: completedAt,
      cancelled_at: cancelledAt,
      cancel_reason: t.cancel_reason ?? null,
      cancelled_by: t.cancelled_by as "passenger" | "driver" | "system" | null ?? null,
    }).select("id").single();

    if (error) {
      console.error(`✗ ${t.code}: ${error.message}`);
      continue;
    }

    console.log(`✓ ${t.code} — ${t.status} | ${pickup.addr} → ${dropoff.addr}`);

    // ── Phase 5b: Trip status history ──
    const history: { trip_id: string; status: string; changed_at: string; changed_by?: string | null }[] = [
      { trip_id: trip.id, status: "pending", changed_at: requestedAt, changed_by: operatorProfile ?? null },
    ];

    if (acceptedAt) {
      history.push({ trip_id: trip.id, status: "accepted", changed_at: acceptedAt, changed_by: driverId ?? null });
    }
    if (arrivedAt) {
      history.push({ trip_id: trip.id, status: "arrived", changed_at: arrivedAt, changed_by: driverId ?? null });
    }
    if (startedAt) {
      history.push({ trip_id: trip.id, status: "in_progress", changed_at: startedAt, changed_by: driverId ?? null });
    }
    if (completedAt) {
      history.push({ trip_id: trip.id, status: "completed", changed_at: completedAt, changed_by: driverId ?? null });
    }
    if (cancelledAt) {
      const cancellerId = t.cancelled_by === "driver" ? driverId : t.cancelled_by === "passenger" ? passengerId : null;
      history.push({ trip_id: trip.id, status: "cancelled", changed_at: cancelledAt, changed_by: cancellerId ?? null });
    }

    const { error: histErr } = await supabase.from("trip_status_history").insert(history);
    if (histErr) console.error(`  ⚠ historial: ${histErr.message}`);

    // ── Phase 5c: Payment for completed ──
    if (t.status === "completed" && t.final_price && t.payment_method) {
      const { error: payErr } = await supabase.from("payments").insert({
        trip_id: trip.id,
        amount: t.final_price,
        method: t.payment_method as "cash" | "card" | "mercadopago" | "other",
        status: "completed",
        paid_at: completedAt,
        currency: "PEN",
      });
      if (payErr) console.error(`  ⚠ pago: ${payErr.message}`);
    }

    // ── Phase 5d: Rating for completed ──
    if (t.status === "completed" && t.rating && driverId) {
      const { error: rateErr } = await supabase.from("ratings").insert({
        trip_id: trip.id,
        passenger_id: passengerId,
        driver_id: driverId,
        rating: t.rating,
        comment: t.rating_comment ?? null,
      });
      if (rateErr) console.error(`  ⚠ rating: ${rateErr.message}`);
    }
  }

  // ── Phase 6: Tariffs ──
  console.log("\n── Tarifas ──");
  for (const tf of TARIFFS) {
    const { data: existing } = await supabase.from("tariff_config").select("id").eq("name", tf.name).maybeSingle();
    if (existing) {
      console.log(`~ ${tf.name} ya existe, omitiendo`);
      continue;
    }
    const { error } = await supabase.from("tariff_config").insert(tf);
    if (error) {
      console.error(`✗ ${tf.name}: ${error.message}`);
    } else {
      console.log(`✓ ${tf.name}`);
    }
  }

  // ── Done ──
  console.log("\n✅ Seed completado");
  console.log("───────");
  console.log("Admin:    admin@apptaxi.com / admin123456");
  console.log("Operador: operador1@apptaxi.com / operador123456");
  console.log("Operador: operador2@apptaxi.com / operador123456");
  console.log("Conductor: cualquiera de los 6 / conductor123456");
  console.log("Pasajero: cualquiera de los 4 / pasajero123456");
  console.log("───────");
  console.log("Ubicación: Abancay, Apurímac");
  console.log(`Viajes:    ${TRIPS.length} creados (${TRIPS.filter(t => t.status === 'completed').length} completados, ${TRIPS.filter(t => t.status === 'cancelled').length} cancelados, varios activos)`);
}

seed().catch(console.error);
