"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

const UPDATE_INTERVAL_MS = 120_000; // 2 minutos

interface LocationTrackerProps {
  enabled?: boolean;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export default function LocationTracker({ enabled = true, onLocationUpdate }: LocationTrackerProps) {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSentRef = useRef<number>(0);

  const updateServer = useCallback(async (latitude: number, longitude: number) => {
    if (!user?.supabase_id) return;
    const now = Date.now();
    if (now - lastSentRef.current < 3_000) return;
    lastSentRef.current = now;
    try {
      const res = await fetch(`/api/drivers/${user.supabase_id}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!res.ok) console.warn("Location update failed:", res.status);
    } catch (e) {
      console.error("Location update error:", e);
    }
  }, [user?.supabase_id]);

  const onPosition = useCallback((latitude: number, longitude: number) => {
    lastLocationRef.current = { lat: latitude, lng: longitude };
    setLastLocation({ lat: latitude, lng: longitude });
    setError(null);
    onLocationUpdate?.(latitude, longitude);
    updateServer(latitude, longitude);
  }, [onLocationUpdate, updateServer]);

  useEffect(() => {
    if (!enabled || !user || user.rol !== "conductor") return;

    let watchId: number | null = null;

    const sendLastKnown = () => {
      const loc = lastLocationRef.current;
      if (loc) updateServer(loc.lat, loc.lng);
    };

    if (!navigator.geolocation) {
      setError("Geolocalización no disponible");
      return;
    }

    sendLastKnown();

    watchId = navigator.geolocation.watchPosition(
      (position) => onPosition(position.coords.latitude, position.coords.longitude),
      (err) => setError(`GPS error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
    );

    intervalRef.current = setInterval(sendLastKnown, UPDATE_INTERVAL_MS);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, user, onPosition, updateServer]);

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
