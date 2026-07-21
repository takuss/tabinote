import type { Trip } from "@/app/lib/trips";

export function getQuickInitialDate(trip: Trip, preferredDate?: string) {
  if (preferredDate && preferredDate >= trip.startDate && preferredDate <= trip.endDate) return preferredDate;
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  return today >= trip.startDate && today <= trip.endDate ? today : trip.startDate;
}
