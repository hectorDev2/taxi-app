import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/solicitudes",
  "/unidades",
  "/usuarios",
  "/historial",
  "/configuracion",
  "/driver",
  "/driver/dashboard",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  const isDriver = role === "driver";

  // Authenticated user on login pages → redirect by role
  if (user && (pathname === "/" || pathname === "/driver")) {
    const url = request.nextUrl.clone();
    url.pathname = isDriver ? "/driver/dashboard" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user on protected route → redirect to login
  if (!user && pathname !== "/" && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.startsWith("/driver") ? "/driver" : "/";
      return NextResponse.redirect(url);
    }
  }

  // Conductor trying to access panel → send to driver dashboard
  if (user && isDriver && !pathname.startsWith("/driver") && !pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/driver/dashboard";
    return NextResponse.redirect(url);
  }

  // Non-conductor trying to access driver section → send to panel
  if (user && !isDriver && pathname.startsWith("/driver")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
