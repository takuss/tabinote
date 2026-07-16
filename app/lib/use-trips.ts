"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseTrips, TRIPS_STORAGE_KEY } from "@/app/lib/trips";

function subscribeToTrips(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === TRIPS_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getTripsSnapshot() {
  try {
    return window.localStorage.getItem(TRIPS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerTripsSnapshot(): string | null {
  return null;
}

export function useTrips() {
  const savedTrips = useSyncExternalStore<string | null>(
    subscribeToTrips,
    getTripsSnapshot,
    getServerTripsSnapshot,
  );
  const trips = useMemo(() => parseTrips(savedTrips), [savedTrips]);

  return { trips, isLoaded: savedTrips !== null };
}
