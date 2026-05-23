import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: "admin@apptaxi.com",
    password: "admin123456",
    user_metadata: { role: "admin", full_name: "Admin Principal" },
  },
  {
    email: "operador@apptaxi.com",
    password: "operador123456",
    user_metadata: { role: "operator", full_name: "María García" },
  },
  {
    email: "carlos@apptaxi.com",
    password: "conductor123456",
    user_metadata: { role: "driver", full_name: "Carlos López", phone: "+51999123401" },
  },
  {
    email: "ana@apptaxi.com",
    password: "conductor123456",
    user_metadata: { role: "driver", full_name: "Ana Torres", phone: "+51999123402" },
  },
  {
    email: "pedro@apptaxi.com",
    password: "conductor123456",
    user_metadata: { role: "driver", full_name: "Pedro Sánchez", phone: "+51999123403" },
  },
];

async function seed() {
  const createdIds: string[] = [];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser(u);
    if (error) {
      if (error.message.includes("already exists")) {
        console.log(`~ ${u.email} ya existe, omitiendo`);
        continue;
      }
      console.error(`Error creating ${u.email}:`, error.message);
      continue;
    }
    await supabase.auth.admin.updateUserById(data.user.id, { email_confirm: true });
    createdIds.push(data.user.id);
    console.log(`✓ ${u.email} (${u.user_metadata.role})`);
  }

  // Give time for the trigger to create profiles
  await new Promise((r) => setTimeout(r, 1000));

  // Vehicles for drivers
  const drivers = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "driver");

  const vehicles = [
    { brand: "Toyota", model: "Corolla", year: 2023, license_plate: "ABC-123", color: "Blanco", seats: 4 },
    { brand: "Nissan", model: "Versa", year: 2024, license_plate: "DEF-456", color: "Negro", seats: 4 },
    { brand: "Hyundai", model: "Accent", year: 2023, license_plate: "GHI-789", color: "Azul", seats: 4 },
  ];

  if (drivers.data) {
    for (let i = 0; i < drivers.data.length && i < vehicles.length; i++) {
      const { error } = await supabase.from("vehicles").insert({
        ...vehicles[i],
        owner_id: drivers.data[i].id,
      });
      if (!error) console.log(`  → Vehículo: ${vehicles[i].brand} ${vehicles[i].model} (${vehicles[i].license_plate})`);
    }
  }

  // Set drivers as online with location
  const limaCenter = { lat: -12.0464, lng: -77.0428 };
  for (const id of drivers.data?.map((d) => d.id) ?? []) {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_online: true,
        current_latitude: limaCenter.lat + (Math.random() - 0.5) * 0.02,
        current_longitude: limaCenter.lng + (Math.random() - 0.5) * 0.02,
        last_location_update: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error) console.log(`  → Conductor ${id.slice(0, 8)} online en zona centro`);
  }

  // Sample pending trip from operator
  const operator = await supabase.from("profiles").select("id").eq("role", "operator").limit(1).single();
  if (operator.data) {
    const { error } = await supabase.from("trips").insert({
      passenger_id: operator.data.id,
      pickup_latitude: -12.045,
      pickup_longitude: -77.03,
      pickup_address: "Av. Larco 123, Miraflores",
      dropoff_latitude: -12.12,
      dropoff_longitude: -77.03,
      dropoff_address: "Av. Benavides 456, Surco",
      estimated_price: 25.00,
      status: "pending",
    });
    if (!error) console.log("  → Solicitud de prueba creada (pendiente)");
  }

  console.log("\n✅ Seed completado");
  console.log("Usuarios creados:");
  console.log("  admin@apptaxi.com / admin123456");
  console.log("  operador@apptaxi.com / operador123456");
  console.log("  carlos@apptaxi.com / conductor123456");
  console.log("  ana@apptaxi.com / conductor123456");
  console.log("  pedro@apptaxi.com / conductor123456");
}

seed().catch(console.error);
