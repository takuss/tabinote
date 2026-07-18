"use client";
import { useMemo, useSyncExternalStore } from "react";
import { parseTransports, TRANSPORTS_CHANGED_EVENT, TRANSPORTS_STORAGE_KEY } from "@/app/lib/transports";
function subscribe(change: () => void) { const storage = (e: StorageEvent) => { if (e.key === TRANSPORTS_STORAGE_KEY) change(); }; addEventListener("storage", storage); addEventListener(TRANSPORTS_CHANGED_EVENT, change); return () => { removeEventListener("storage", storage); removeEventListener(TRANSPORTS_CHANGED_EVENT, change); }; }
function snapshot() { try { return localStorage.getItem(TRANSPORTS_STORAGE_KEY) ?? ""; } catch { return ""; } }
export function useTransports(tripId?: string) { const saved = useSyncExternalStore<string | null>(subscribe, snapshot, () => null); const transports = useMemo(() => { const all = parseTransports(saved); return tripId ? all.filter((x) => x.tripId === tripId) : all; }, [saved, tripId]); return { transports, isLoaded: saved !== null }; }
