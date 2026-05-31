"use client";

import { AlertCircle } from "lucide-react";

interface DriverDashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DriverDashboardError({ error, reset }: DriverDashboardErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="bg-red-100 p-4 rounded-full mb-4 inline-block">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm mb-6 text-gray-400">
          {error.message || "Ocurrió un error al cargar el dashboard. Intentá de nuevo."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Reintentar
        </button>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-300">
            Código: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
