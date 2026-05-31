"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import type { RealtimePostgresChangesPayload } from "@supabase/realtime-js";
import { vehicleService } from "./vehicle-service";
import { tripService } from "./trip-service";

let tripsSub: ReturnType<typeof tripService.subscribe> | null = null;
const tripsListeners = new Set<(payload: RealtimePostgresChangesPayload<Tables<"trips">>) => void>();

function ensureTripsSubscription() {
  if (tripsSub) return;
  tripsSub = tripService.subscribe((payload) => {
    tripsListeners.forEach((fn) => fn(payload));
  });
}

export function useTripsRealtime(callback: (payload: RealtimePostgresChangesPayload<Tables<"trips">>) => void) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    ensureTripsSubscription();
    const fn = (payload: RealtimePostgresChangesPayload<Tables<"trips">>) => cb.current(payload);
    tripsListeners.add(fn);
    return () => {
      tripsListeners.delete(fn);
      if (tripsListeners.size === 0 && tripsSub) {
        tripsSub.unsubscribe();
        tripsSub = null;
      }
    };
  }, []);
}

let vehiclesSub: ReturnType<typeof vehicleService.subscribe> | null = null;
const vehiclesListeners = new Set<(payload: RealtimePostgresChangesPayload<Tables<"vehicles">>) => void>();

function ensureVehiclesSubscription() {
  if (vehiclesSub) return;
  vehiclesSub = vehicleService.subscribe((payload) => {
    vehiclesListeners.forEach((fn) => fn(payload));
  });
}

export function useVehiclesRealtime(callback: (payload: RealtimePostgresChangesPayload<Tables<"vehicles">>) => void) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    ensureVehiclesSubscription();
    const fn = (payload: RealtimePostgresChangesPayload<Tables<"vehicles">>) => cb.current(payload);
    vehiclesListeners.add(fn);
    return () => {
      vehiclesListeners.delete(fn);
      if (vehiclesListeners.size === 0 && vehiclesSub) {
        vehiclesSub.unsubscribe();
        vehiclesSub = null;
      }
    };
  }, []);
}

export function useDriverLocationRealtime(
  driverId: string | undefined,
  callback: (location: { lat: number; lng: number; updatedAt: string }) => void
) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    if (!driverId) return;
    const supabase = createClient();
    const sub = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${driverId}`,
        },
        (payload: RealtimePostgresChangesPayload<Pick<Tables<"profiles">, "current_latitude" | "current_longitude" | "last_location_update">>) => {
          // We only listen to UPDATE events, so payload.new is always the full row
          const p = payload.new as unknown as Pick<Tables<"profiles">, "current_latitude" | "current_longitude" | "last_location_update">;
          const { current_latitude, current_longitude, last_location_update } = p;
          if (current_latitude && current_longitude) {
            cb.current({
              lat: current_latitude,
              lng: current_longitude,
              updatedAt: last_location_update || new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [driverId]);
}
