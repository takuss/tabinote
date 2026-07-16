"use client";
import { useMemo, useSyncExternalStore } from "react";
import { parseRecords, RECORDS_CHANGED_EVENT, RECORDS_STORAGE_KEY } from "@/app/lib/records";
function subscribe(onChange: () => void) { const onStorage = (event: StorageEvent) => { if (event.key === RECORDS_STORAGE_KEY) onChange(); }; window.addEventListener("storage", onStorage); window.addEventListener(RECORDS_CHANGED_EVENT, onChange); return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(RECORDS_CHANGED_EVENT, onChange); }; }
function getSnapshot() { try { return window.localStorage.getItem(RECORDS_STORAGE_KEY) ?? ""; } catch { return ""; } }
function getServerSnapshot(): string | null { return null; }
export function useRecords(tripId?: string) { const saved = useSyncExternalStore<string | null>(subscribe, getSnapshot, getServerSnapshot); const records = useMemo(() => { const all = parseRecords(saved); return tripId ? all.filter((item) => item.tripId === tripId) : all; }, [saved, tripId]); return { records, isLoaded: saved !== null }; }
