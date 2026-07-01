"use client";

import { useState } from "react";
import { Car, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/toast";
import { driverLogin } from "./actions";

export default function DriverLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const DEV_CONDUCTORES = process.env.NODE_ENV === "development" ? [
    { label: "Carlos", email: "carlos@apptaxi.com" },
    { label: "Ana", email: "ana@apptaxi.com" },
    { label: "Pedro", email: "pedro@apptaxi.com" },
  ] : [];

  const doLogin = async (emailVal: string, passwordVal: string) => {
    setError("");
    setLoading(true);
    const err = await driverLogin(emailVal, passwordVal);
    setLoading(false);
    if (err) {
      setError(err);
      toast(err, "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-500 p-4 rounded-full mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AppTaxi</h1>
          <p className="text-sm text-gray-500">App Conductor</p>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              placeholder="conductor@apptaxi.com"
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
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
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

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {DEV_CONDUCTORES.length > 0 && (
          <div className="mt-6 pt-5 border-t border-dashed border-white/30">
            <p className="text-xs text-white/60 text-center mb-3">⚡ Acceso rápido (solo dev)</p>
            <div className="flex gap-2">
              {DEV_CONDUCTORES.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword("conductor123456"); doLogin(c.email, "conductor123456"); }}
                  className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}