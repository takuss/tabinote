"use client";
import { useEffect, useState } from "react";
import { countRecordPhotosForTrip, RECORD_PHOTO_CHANGED_EVENT } from "@/app/lib/record-photo-storage";
export function useRecordPhotoCount(tripId: string) { const [count, setCount] = useState(0); useEffect(() => { let active = true; const load = () => { void countRecordPhotosForTrip(tripId).then((value) => { if (active) setCount(value); }).catch(() => { if (active) setCount(0); }); }; const changed = (event: Event) => { const detail = (event as CustomEvent<{tripId?:string}>).detail; if (!detail?.tripId || detail.tripId === tripId) load(); }; load(); addEventListener(RECORD_PHOTO_CHANGED_EVENT, changed); return () => { active = false; removeEventListener(RECORD_PHOTO_CHANGED_EVENT, changed); }; }, [tripId]); return count; }
