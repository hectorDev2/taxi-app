"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const UPDATE_INTERVAL_MS = 10_000;

interface LocationTrackerProps {
  enabled?: boolean;
}

export default function LocationTracker({ enabled = true }: LocationTrackerProps) {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !user || user.rol !== "conductor") return;

    let watchId: number | null = null;

    async function updateLocation() {
      if (!user?.supabase_id) return;

      if (!navigator.geolocation) {
        setError("Geolocalización no disponible");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLastLocation({ lat: latitude, lng: longitude });
          setError(null);

          try {
            const res = await fetch(`/api/drivers/${user.supabase_id}/location`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude, longitude }),
            });

            if (!res.ok) {
              console.warn("Location update failed:", res.status);
            }
          } catch (e) {
            console.error("Location update error:", e);
          }
        },
        (err) => {
          setError(`GPS error: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
      );
    }

    // Initial update
    updateLocation();

    // Watch position continuously
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLastLocation({ lat: latitude, lng: longitude });
        setError(null);
      },
      (err) => {
        setError(`GPS watch error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
    );

    // Periodic server update every UPDATE_INTERVAL_MS
    intervalRef.current = setInterval(updateLocation, UPDATE_INTERVAL_MS);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsTracking(false);
    };
  }, [enabled, user]);

  if (!user || user.rol !== "conductor" || !enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-full text-xs shadow-lg">
      <div className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : lastLocation ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
      <span className="text-gray-300">
        {error ? "GPS error" : lastLocation ? `GPS: ${lastLocation.lat.toFixed(4)}, ${lastLocation.lng.toFixed(4)}` : "Obteniendo GPS..."}
      </span>
    </div>
  );
}