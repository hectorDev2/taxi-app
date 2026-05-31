"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, Square } from "lucide-react";

interface Driver {
  id: string;
  full_name: string | null;
}

function randomAround(base: number, range: number) {
  return base + (Math.random() - 0.5) * range;
}

function generatePositions(drivers: Driver[]) {
  return drivers.map((d) => ({
    id: d.id,
    name: d.full_name,
    lat: randomAround(-13.63, 0.15),
    lng: randomAround(-72.88, 0.15),
    step: { lat: 0, lng: 0 },
  }));
}

const CUSCO_CENTER = { lat: -13.63, lng: -72.88 };

export default function SimuladorUbicaciones() {
  const [activo, setActivo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driversRef = useRef<
    { id: string; lat: number; lng: number; step: { lat: number; lng: number } }[]
  >([]);

  useEffect(() => {
    if (!activo) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    const supabase = createClient();

    const init = async () => {
      const { data: drivers } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "driver");

      if (!drivers || drivers.length === 0) {
        console.warn("No hay conductores para simular");
        return;
      }

      driversRef.current = generatePositions(drivers);
    };

    init();

    intervalRef.current = setInterval(async () => {
      const drivers = driversRef.current;
      if (drivers.length === 0) return;

      for (const d of drivers) {
        d.step.lat += (Math.random() - 0.5) * 0.003;
        d.step.lng += (Math.random() - 0.5) * 0.003;
        d.step.lat *= 0.7;
        d.step.lng *= 0.7;

        const lat = CUSCO_CENTER.lat + d.step.lat;
        const lng = CUSCO_CENTER.lng + d.step.lng;

        await fetch(`/api/drivers/${d.id}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        }).catch(() => {});
      }
    }, 20_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activo]);

  return (
    <button
      type="button"
      onClick={() => setActivo(!activo)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        activo
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {activo ? (
        <>
          <Square className="w-3 h-3" />
          Simulando...
        </>
      ) : (
        <>
          <Play className="w-3 h-3" />
          Simular movimiento
        </>
      )}
    </button>
  );
}
