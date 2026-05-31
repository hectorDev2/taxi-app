"use client";

import { AlertCircle } from "lucide-react";

interface DriverLoginErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DriverLoginError({ error, reset }: DriverLoginErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Algo salió mal
          </h2>
          <p className="text-sm mb-6 text-gray-400 max-w-sm">
            {error.message || "Ocurrió un error inesperado. Intentá de nuevo."}
          </p>
          <button
            onClick={reset}
            className="w-full px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
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
    </div>
  );
}
