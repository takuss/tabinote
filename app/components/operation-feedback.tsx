"use client";
import { useEffect, useRef, useState } from "react";
import { SCHEDULES_CHANGED_EVENT } from "@/app/lib/schedules";
import { TRANSPORTS_CHANGED_EVENT } from "@/app/lib/transports";
import { RESERVATIONS_CHANGED_EVENT } from "@/app/lib/reservations";
import { RECORDS_CHANGED_EVENT } from "@/app/lib/records";
import { COVER_PHOTO_CHANGED_EVENT } from "@/app/lib/cover-photo-storage";
import { RECORD_PHOTO_CHANGED_EVENT } from "@/app/lib/record-photo-storage";

const events = [SCHEDULES_CHANGED_EVENT, TRANSPORTS_CHANGED_EVENT, RESERVATIONS_CHANGED_EVENT, RECORDS_CHANGED_EVENT, COVER_PHOTO_CHANGED_EVENT, RECORD_PHOTO_CHANGED_EVENT];
export default function OperationFeedback() {
  const [visible, setVisible] = useState(false); const timer = useRef<number | null>(null);
  useEffect(() => { const show = () => { setVisible(true); if (timer.current) clearTimeout(timer.current); timer.current = window.setTimeout(() => setVisible(false), 2400); }; for (const event of events) addEventListener(event, show); return () => { for (const event of events) removeEventListener(event, show); if (timer.current) clearTimeout(timer.current); }; }, []);
  return visible ? <div role="status" aria-live="polite" className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-1/2 z-[80] -translate-x-1/2 rounded-full bg-stone-900 px-4 py-3 text-sm font-bold text-white shadow-lg md:bottom-6">✓ 変更を反映しました</div> : null;
}
