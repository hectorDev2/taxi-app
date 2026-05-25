"use client";

import { useState } from "react";
import { Car, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast("Inicio de sesión exitoso");
      window.location.href = "/dashboard";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-yellow-400 p-4 rounded-full mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AppTaxi</h1>
          <p className="text-sm text-gray-500">Panel de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline disabled:text-gray-400"
            >
              {resetting ? "Enviando..." : "¿Olvidaste tu contraseña?"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
