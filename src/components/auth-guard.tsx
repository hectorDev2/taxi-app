"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { AppUser } from "@/lib/services/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: AppUser["rol"][];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      router.push("/dashboard");
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return null;

  return <>{children}</>;
}
