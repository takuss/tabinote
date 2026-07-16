"use client";
import { useMemo, useSyncExternalStore } from "react";
import { parseReservations, RESERVATIONS_CHANGED_EVENT, RESERVATIONS_STORAGE_KEY } from "@/app/lib/reservations";

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === RESERVATIONS_STORAGE_KEY) onChange(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(RESERVATIONS_CHANGED_EVENT, onChange);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(RESERVATIONS_CHANGED_EVENT, onChange); };
}
function getSnapshot() { try { return window.localStorage.getItem(RESERVATIONS_STORAGE_KEY) ?? ""; } catch { return ""; } }
function getServerSnapshot(): string | null { return null; }

export function useReservations(tripId?: string) {
  const saved = useSyncExternalStore<string | null>(subscribe, getSnapshot, getServerSnapshot);
  const reservations = useMemo(() => {
    const all = parseReservations(saved);
    return tripId ? all.filter((item) => item.tripId === tripId) : all;
  }, [saved, tripId]);
  return { reservations, isLoaded: saved !== null };
}
