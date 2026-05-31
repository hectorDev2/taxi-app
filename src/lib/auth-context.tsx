"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/services/types";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  resetPassword: async () => null,
});

function mapSessionToUsuario(session: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; role?: string; phone?: string };
  phone?: string;
}): AppUser {
  const roleMap: Record<string, AppUser["rol"]> = {
    admin: "admin",
    operator: "operador",
    driver: "conductor",
  };
  return {
    id: session.id,
    supabase_id: session.id,
    nombres: session.user_metadata?.full_name ?? "",
    email: session.email ?? "",
    telefono: session.user_metadata?.phone ?? session.phone ?? "",
    rol: roleMap[session.user_metadata?.role ?? ""] ?? "operador",
    estado: "activo",
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) {
        setUser(mapSessionToUsuario(session.user as any));
        setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session?.user && event === "SIGNED_IN") {
        setUser(mapSessionToUsuario(session.user as any));
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    if (data.session?.user) {
      setUser(mapSessionToUsuario(data.session.user as any));
    }
    return true;
  }, [supabase]);

  const logout = useCallback(async () => {
    // Intenta revocar la sesión en el server
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    // Limpia localStorage
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("sb-") || k.startsWith("supabase-"));
    keys.forEach((k) => localStorage.removeItem(k));
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    return error?.message || null;
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
