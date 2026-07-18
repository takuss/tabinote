import { deleteReservationsForTrip } from "@/app/lib/reservations";
import { deleteRecordsForTrip } from "@/app/lib/records";
import { deleteSchedulesForTrip } from "@/app/lib/schedules";
import { deleteTransportsForTrip } from "@/app/lib/transports";
import { canParseStorageText, MAX_STORED_ITEMS } from "@/app/lib/storage-safety";

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  memo: string;
  createdAt: string;
};

export const TRIPS_STORAGE_KEY = "tabinote.trips";

function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== "object") return false;

  const trip = value as Record<string, unknown>;
  return (
    typeof trip.id === "string" &&
    typeof trip.title === "string" &&
    typeof trip.destination === "string" &&
    typeof trip.startDate === "string" &&
    typeof trip.endDate === "string" &&
    typeof trip.memo === "string" &&
    typeof trip.createdAt === "string"
  );
}

let cachedTripsSource: string | null | undefined;
let cachedTrips: Trip[] = [];

export function parseTrips(saved: string | null): Trip[] {
  if (saved === cachedTripsSource) return cachedTrips;
  cachedTripsSource = saved;
  try {
    if (!canParseStorageText(saved)) return (cachedTrips = []);
    const parsed: unknown = JSON.parse(saved);
    cachedTrips = Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_ITEMS).filter(isTrip) : [];
  } catch {
    cachedTrips = [];
  }
  return cachedTrips;
}

export function loadTrips(): Trip[] {
  try { return parseTrips(window.localStorage.getItem(TRIPS_STORAGE_KEY)); }
  catch { return []; }
}

export function saveTrip(trip: Trip) {
  const trips = loadTrips();
  if (trips.some((savedTrip) => savedTrip.id === trip.id)) {
    throw new Error("Trip ID already exists");
  }
  window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify([trip, ...trips]));
}

export function updateTrip(id: string, trip: Trip) {
  const trips = loadTrips();
  const index = trips.findIndex((savedTrip) => savedTrip.id === id);
  if (index === -1) return false;

  const updatedTrips = trips.map((savedTrip) => (savedTrip.id === id ? trip : savedTrip));
  window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(updatedTrips));
  return true;
}

export function deleteTrip(id: string) {
  const trips = loadTrips();
  const remainingTrips = trips.filter((trip) => trip.id !== id);
  if (remainingTrips.length === trips.length) return false;

  window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(remainingTrips));
  deleteSchedulesForTrip(id);
  deleteTransportsForTrip(id);
  deleteReservationsForTrip(id);
  deleteRecordsForTrip(id);
  return true;
}

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: string, includeYear: boolean) {
  return new Intl.DateTimeFormat("ja-JP", {
    ...(includeYear ? { year: "numeric" as const } : {}),
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(parseDate(date));
}

export function formatTripDate(date: string) {
  return formatDate(date, true);
}

export function formatTripDateRange(startDate: string, endDate: string) {
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  const start = formatDate(startDate, true);
  const end = formatDate(endDate, !sameYear);
  return startDate === endDate ? start : `${start} — ${end}`;
}

export function getTripStatus(trip: Trip) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseDate(trip.startDate);
  const end = parseDate(trip.endDate);

  if (today < start) {
    return {
      label: "旅行前",
      className: "border-teal-200 bg-teal-50 text-teal-800",
    };
  }
  if (today <= end) {
    return {
      label: "旅行中",
      className: "border-teal-700 bg-teal-700 text-white",
    };
  }
  return {
    label: "旅行済み",
    className: "border-stone-300 bg-stone-100 text-stone-600",
  };
}

export type TripExperience = "plan" | "today" | "memories";
export function getTripExperience(trip: Trip, now = new Date()): TripExperience {
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (local < trip.startDate) return "plan";
  if (local <= trip.endDate) return "today";
  return "memories";
}
export function getTripExperiencePath(trip: Trip, experience = getTripExperience(trip)) {
  return experience === "today" ? `/trips/${trip.id}/today` : experience === "memories" ? `/trips/${trip.id}/summary` : `/trips/${trip.id}`;
}
