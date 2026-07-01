import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PANEL_ROUTES = [
  "/dashboard",
  "/solicitudes",
  "/unidades",
  "/usuarios",
  "/historial",
  "/configuracion",
  "/seguimiento",
];

function redirect(request: NextRequest, pathname: string, base: NextResponse): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const res = NextResponse.redirect(url);
  // Copiar cookies de sesión actualizadas al redirect para no perder el refresh token
  base.cookies.getAll().forEach(({ name, value }) => res.cookies.set(name, value));
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pasar RSC y assets sin tocarlos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const role = user?.user_metadata?.role as string | undefined;
  const isDriver = role === "driver";


  const isPanelRoute = PANEL_ROUTES.some((r) => pathname.startsWith(r));
  const isDriverDashboard = pathname.startsWith("/driver/dashboard");
  const isDriverLogin = pathname === "/driver";
  const isMainLogin = pathname === "/";

  // — Sin sesión —
  if (!user) {
    if (isDriverDashboard) return redirect(request, "/driver", supabaseResponse);
    if (isPanelRoute) return redirect(request, "/", supabaseResponse);
    return supabaseResponse;
  }

  // — Con sesión —

  // Páginas de login → redirigir al destino según rol
  if (isMainLogin || isDriverLogin) {
    return redirect(request, isDriver ? "/driver/dashboard" : "/dashboard", supabaseResponse);
  }

  // Conductor intentando entrar al panel
  if (isDriver && isPanelRoute) {
    return redirect(request, "/driver/dashboard", supabaseResponse);
  }

  // No conductor intentando entrar al dashboard del conductor
  if (!isDriver && isDriverDashboard) {
    return redirect(request, "/dashboard", supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
