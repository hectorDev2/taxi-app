"use client";

import { AlertCircle } from "lucide-react";

interface SolicitudesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SolicitudesError({ error, reset }: SolicitudesErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-gray-500">
      <div className="bg-yellow-100 p-4 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-yellow-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Algo salió mal
      </h2>
      <p className="text-sm mb-6 text-gray-400 max-w-md text-center">
        {error.message || "Ocurrió un error al cargar las solicitudes. Intentá de nuevo."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
      >
        Reintentar
      </button>
      {error.digest && (
        <p className="mt-4 text-xs text-gray-300">
          Código: {error.digest}
        </p>
      )}
    </div>
  );
}
