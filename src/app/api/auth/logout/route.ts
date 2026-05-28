import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Revoke the server-side session
  await supabase.auth.signOut();

  // Also clear all Supabase cookies from the browser
  const response = NextResponse.json({ ok: true });

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase") || cookie.name.includes("auth")) {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  return response;
}