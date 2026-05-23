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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!(await isAdmin(user.id)))
    return NextResponse.json(mapProfile(profile));

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  return NextResponse.json(mapProfile(profile, authUser?.user?.email || undefined));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await isAdmin(user.id)))
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const supabase = await createClient();

  const dbUpdates: Record<string, unknown> = {};
  if (body.nombres) dbUpdates.full_name = body.nombres;
  if (body.telefono) dbUpdates.phone = body.telefono;
  if (body.rol) dbUpdates.role = ROLE_MAP_REVERSE[body.rol as AppRole];
  if (body.estado) dbUpdates.is_verified = body.estado === "activo";

  const { data } = await supabase
    .from("profiles")
    .update(dbUpdates as any)
    .eq("id", id)
    .select()
    .single();

  if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(mapProfile(data));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await isAdmin(user.id)))
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
