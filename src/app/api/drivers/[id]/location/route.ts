import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: driverId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return NextResponse.json(
      { error: "Invalid request body: latitude and longitude are required numbers" },
      { status: 400 }
    );
  }

  const { latitude, longitude } = body;

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: "Coordinates out of valid range" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isSelf = user.id === driverId;

  if (!isAdmin && !isSelf) {
    return NextResponse.json(
      { error: "Forbidden: cannot update another driver's location" },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      current_latitude: latitude,
      current_longitude: longitude,
      last_location_update: now,
    })
    .eq("id", driverId);

  if (updateError) {
    console.error("Location update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }

  // Also update driver location on the active trip so the panel can track it
  await supabase
    .from("trips")
    .update({
      driver_current_latitude: latitude,
      driver_current_longitude: longitude,
      driver_location_updated_at: now,
    })
    .eq("driver_id", driverId)
    .in("status", ["accepted", "arrived", "in_progress"]);

  return NextResponse.json({ success: true }, { status: 200 });
}