"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseSchedules,
  SCHEDULES_CHANGED_EVENT,
  SCHEDULES_STORAGE_KEY,
} from "@/app/lib/schedules";

function subscribe(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SCHEDULES_STORAGE_KEY) onStoreChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(SCHEDULES_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SCHEDULES_CHANGED_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(SCHEDULES_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string | null {
  return null;
}

export function useSchedules(tripId?: string) {
  const saved = useSyncExternalStore<string | null>(subscribe, getSnapshot, getServerSnapshot);
  const schedules = useMemo(() => {
    const all = parseSchedules(saved);
    return tripId ? all.filter((schedule) => schedule.tripId === tripId) : all;
  }, [saved, tripId]);
  return { schedules, isLoaded: saved !== null };
}
