"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { vehicleService } from "./vehicle-service";
import { tripService } from "./trip-service";

export function useTripsRealtime(callback: (payload: any) => void) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    const sub = tripService.subscribe((payload) => {
      cb.current(payload);
    });
    return () => { sub.unsubscribe(); };
  }, []);
}

export function useVehiclesRealtime(callback: (payload: any) => void) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    const sub = vehicleService.subscribe((payload) => {
      cb.current(payload);
    });
    return () => { sub.unsubscribe(); };
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
