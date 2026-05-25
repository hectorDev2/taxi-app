"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  History,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { AppUser } from "@/lib/services/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AppUser["rol"][];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "operador", "conductor"] },
  { label: "Unidades", href: "/unidades", icon: Car, roles: ["admin", "operador"] },
  { label: "Solicitudes", href: "/solicitudes", icon: ClipboardList, roles: ["admin", "operador"] },
  { label: "Historial", href: "/historial", icon: History, roles: ["admin", "operador"] },
  { label: "Usuarios", href: "/usuarios", icon: Users, roles: ["admin"] },
  { label: "Configuración", href: "/configuracion", icon: Settings, roles: ["admin", "operador"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout().then(() => {
      window.location.href = "/";
    });
  };

  const items = navItems.filter((item) => user && item.roles.includes(user.rol));

  return (
    <aside className="w-[var(--sidebar-width)] bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-yellow-500">AppTaxi</h1>
        <p className="text-sm text-gray-500">Panel de Gestión</p>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900 truncate">{user?.nombres || "Usuario"}</p>
        <p className="text-xs text-gray-400 capitalize">{user?.rol || "—"}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-yellow-50 text-yellow-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
