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

export function loadTrips(): Trip[] {
  try {
    const saved = window.localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isTrip) : [];
  } catch {
    return [];
  }
}

export function saveTrip(trip: Trip) {
  const trips = loadTrips();
  window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify([trip, ...trips]));
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
      label: "計画中",
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
