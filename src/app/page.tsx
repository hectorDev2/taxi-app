"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, resetPassword } = useAuth();

  const DEV_USERS = process.env.NODE_ENV === "development" ? [
    { label: "Admin", email: "admin@apptaxi.com", password: "admin123456", gradient: "from-purple-500 to-violet-500" },
    { label: "Operador", email: "operador1@apptaxi.com", password: "operador123456", gradient: "from-blue-500 to-cyan-500" },
    { label: "Carlos (conductor)", email: "carlos@apptaxi.com", password: "conductor123456", gradient: "from-green-500 to-emerald-500" },
    { label: "Ana (conductora)", email: "ana@apptaxi.com", password: "conductor123456", gradient: "from-green-500 to-emerald-500" },
  ] : [];
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const loggedUser = await login(email, password);
    setLoading(false);
    if (loggedUser) {
      toast("Inicio de sesión exitoso");
      window.location.href = loggedUser.rol === "conductor" ? "/driver/dashboard" : "/dashboard";
    } else {
      setError("Credenciales incorrectas");
      toast("Credenciales incorrectas", "error");
    }
  };

  const handleReset = async () => {
    if (!email) {
      toast("Ingresa tu correo primero", "error");
      return;
    }
    setResetting(true);
    const err = await resetPassword(email);
    setResetting(false);
    if (err) {
      toast(err, "error");
    } else {
      toast("Revisa tu correo para restablecer la contraseña");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white" />
      </div>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-yellow-200/50 w-full max-w-md p-8 mx-4 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-4 rounded-2xl shadow-lg shadow-yellow-200 mb-4">
            <Car className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">AppTaxi</h1>
          <p className="text-sm font-medium text-gray-400 mt-0.5">Panel de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none text-sm bg-white/80 backdrop-blur transition-all"
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none text-sm bg-white/80 backdrop-blur transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar contraseña"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 hover:underline disabled:text-gray-400 transition-colors"
            >
              {resetting ? "Enviando..." : "¿Olvidaste tu contraseña?"}
            </button>
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 disabled:from-gray-300 disabled:to-gray-300 text-gray-900 font-extrabold py-3 rounded-xl shadow-lg shadow-yellow-200/50 transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : "Iniciar sesión"}
          </button>
        </form>

        {DEV_USERS.length > 0 && (
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-400 text-center mb-4 uppercase tracking-wider">⚡ Acceso rápido (dev)</p>
            <div className="grid grid-cols-2 gap-2.5">
              {DEV_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.password); }}
                  className={`text-xs font-bold px-3 py-2.5 rounded-xl text-white shadow-sm transition-all duration-200 active:scale-[0.97] bg-gradient-to-r ${u.gradient}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
