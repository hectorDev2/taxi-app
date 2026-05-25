"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { vehicleService } from "./vehicle-service";
import { tripService } from "./trip-service";

let tripsSub: ReturnType<typeof tripService.subscribe> | null = null;
const tripsListeners = new Set<(payload: any) => void>();

function ensureTripsSubscription() {
  if (tripsSub) return;
  tripsSub = tripService.subscribe((payload) => {
    tripsListeners.forEach((fn) => fn(payload));
  });
}

export function useTripsRealtime(callback: (payload: any) => void) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    ensureTripsSubscription();
    const fn = (payload: any) => cb.current(payload);
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
const vehiclesListeners = new Set<(payload: any) => void>();

function ensureVehiclesSubscription() {
  if (vehiclesSub) return;
  vehiclesSub = vehicleService.subscribe((payload) => {
    vehiclesListeners.forEach((fn) => fn(payload));
  });
}

export function useVehiclesRealtime(callback: (payload: any) => void) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    ensureVehiclesSubscription();
    const fn = (payload: any) => cb.current(payload);
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
        (payload: any) => {
          const { current_latitude, current_longitude, last_location_update } = payload.new;
          if (current_latitude && current_longitude) {
            cb.current({
              lat: current_latitude,
              lng: current_longitude,
              updatedAt: last_location_update,
            });
          }
        }
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [driverId]);
}
