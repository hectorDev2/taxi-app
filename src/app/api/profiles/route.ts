import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole, AppUser } from "@/lib/services/types";
import { ROLE_MAP, ROLE_MAP_REVERSE } from "@/lib/services/types";
import type { Tables } from "@/lib/database.types";

type ProfileRow = Tables<"profiles">;

function mapProfile(row: ProfileRow, email?: string): AppUser {
  return {
    id: row.id,
    supabase_id: row.id,
    nombres: row.full_name || "",
    email: email || "",
    telefono: row.phone || "",
    rol: ROLE_MAP[row.role] || "operador",
    estado: row.is_verified ? "activo" : "inactivo",
    created_at: row.created_at,
  };
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return profile?.role === "admin";
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const { searchParams } = new URL(request.url);
  const exportCsv = searchParams.get("export") === "csv";

  if (!(await isAdmin(user.id))) {
    const users = (profiles || []).map((p) => mapProfile(p));
    if (exportCsv) return exportCsvResponse(users);
    return NextResponse.json(users);
  }

  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const emailMap = new Map(
    (authUsers?.users || []).map((u: { id: string; email?: string }) => [u.id, u.email])
  );
  const users = (profiles || []).map((p) =>
    mapProfile(p, emailMap.get(p.id) || undefined)
  );

  if (exportCsv) return exportCsvResponse(users);
  return NextResponse.json(users);
}

function exportCsvResponse(users: AppUser[]) {
  const header = "Nombres,Email,Teléfono,Rol,Estado,Creado";
  const rows = users.map(
    (u) => `${u.nombres},${u.email},${u.telefono},${u.rol},${u.estado},${u.created_at}`
  );
  return new NextResponse([header, ...rows].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await isAdmin(user.id)))
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

  const body = await request.json();
  const dbRole = ROLE_MAP_REVERSE[body.rol as AppRole];

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.nombres,
      phone: body.telefono || "",
      role: dbRole,
    },
  });

  if (authError || !authData?.user)
    return NextResponse.json({ error: authError?.message || "Error al crear usuario" }, { status: 400 });

  return NextResponse.json(
    mapProfile({
      id: authData.user.id,
      full_name: body.nombres,
      phone: body.telefono || "",
      role: dbRole,
      is_verified: true,
      created_at: new Date().toISOString(),
    } as any, body.email),
    { status: 201 }
  );
}
