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
  Radar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { AppUser } from "@/lib/services/types";
import { useState } from "react";

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
  { label: "Seguimiento", href: "/seguimiento", icon: Radar, roles: ["admin", "operador"] },
  { label: "Historial", href: "/historial", icon: History, roles: ["admin", "operador"] },
  { label: "Usuarios", href: "/usuarios", icon: Users, roles: ["admin"] },
  { label: "Configuración", href: "/configuracion", icon: Settings, roles: ["admin", "operador"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout().then(() => {
      window.location.href = "/";
    });
  };

  const items = navItems.filter((item) => user && item.roles.includes(user.rol));

  return (
    <aside className={`${collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"} bg-white/90 backdrop-blur-xl border-r border-gray-200/60 flex flex-col h-screen transition-all duration-300 relative`}>
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2" : "px-6"} h-16 border-b border-gray-100`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md shadow-yellow-200">
            <Car className="w-5 h-5 text-gray-900" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md shadow-yellow-200">
              <Car className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 tracking-tight">AppTaxi</h1>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Panel de Gestión</p>
            </div>
          </div>
        )}
      </div>

      {/* User info */}
      <div className={`${collapsed ? "px-2 py-3 flex justify-center" : "px-4 py-3"} border-b border-gray-100`}>
        {collapsed ? (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">{(user?.nombres || "U")[0]}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-xs font-bold">{(user?.nombres || "U")[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.nombres || "Usuario"}</p>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                user?.rol === "admin" ? "text-yellow-600" :
                user?.rol === "operador" ? "text-blue-600" :
                "text-green-600"
              }`}>{user?.rol || "—"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center rounded-xl text-sm font-bold transition-all duration-200",
                collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 shadow-md shadow-yellow-200/50"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={clsx(collapsed ? "w-5 h-5" : "w-5 h-5 shrink-0")} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all z-10"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logout */}
      <div className={`${collapsed ? "px-2 py-3" : "px-3 py-3"} border-t border-gray-100`}>
        <button
          onClick={handleLogout}
          className={clsx(
            "flex items-center rounded-xl text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 w-full",
            collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
