"use client";

import Modal from "@/components/modal";

interface CancelTripModalProps {
  open: boolean;
  motivo: string;
  onMotivoChange: (motivo: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
}

export default function CancelTripModal({
  open,
  motivo,
  onMotivoChange,
  onClose,
  onConfirm,
  confirmText = "Confirmar Cancelación",
}: CancelTripModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Cancelar Viaje" maxWidth="sm">
      <div className="p-6 space-y-4">
        <select
          value={motivo}
          onChange={(e) => onMotivoChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none text-sm"
        >
          <option value="">Motivo de cancelación</option>
          <option value="Pasajero canceló">Pasajero canceló</option>
          <option value="Vehículo en mantenimiento">Vehículo en mantenimiento</option>
          <option value="Tráfico / demora">Tráfico / demora</option>
          <option value="Dirección incorrecta">Dirección incorrecta</option>
          <option value="Otro">Otro</option>
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={!motivo}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
