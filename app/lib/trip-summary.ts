import { sortRecords, summarizeExpenses, type TripRecord } from "@/app/lib/records";
import { sortReservations, type Reservation } from "@/app/lib/reservations";
import { sortSchedules, type Schedule } from "@/app/lib/schedules";
import type { Trip } from "@/app/lib/trips";

export type TripDaySummary = {
  date: string;
  schedules: Schedule[];
  reservations: Reservation[];
  records: TripRecord[];
  expenseTotal: number;
};

export const MAX_SUMMARY_DAYS = 3_660;

function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day, timestamp };
}

function toDateString(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTripDuration(startDate: string, endDate: string) {
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);
  if (!start || !end || end.timestamp < start.timestamp) return { days: 0, nights: 0 };
  const nights = Math.round((end.timestamp - start.timestamp) / 86_400_000);
  return { days: nights + 1, nights };
}

export function getTripDates(startDate: string, endDate: string) {
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);
  if (!start || !end || end.timestamp < start.timestamp) return [];
  const dates: string[] = [];
  for (
    let current = start.timestamp;
    current <= end.timestamp && dates.length < MAX_SUMMARY_DAYS;
    current += 86_400_000
  ) {
    dates.push(toDateString(current));
  }
  return dates;
}

export function countUniqueVisitedPlaces(records: TripRecord[]) {
  return new Set(records.map((record) => record.place.trim()).filter(Boolean)).size;
}

export function getExpenseBreakdown(records: TripRecord[]) {
  const summary = summarizeExpenses(records);
  return {
    total: summary.total,
    count: summary.count,
    categories: summary.byCategory.map(({ category, amount }) => ({
      category,
      amount,
      percentage: summary.total > 0 ? Math.round((amount / summary.total) * 100) : 0,
    })),
  };
}

export function groupTripByDay(
  trip: Trip,
  schedules: Schedule[],
  reservations: Reservation[],
  records: TripRecord[],
): TripDaySummary[] {
  const sortedSchedules = sortSchedules(schedules);
  const sortedReservations = sortReservations(reservations);
  const sortedRecords = sortRecords(records);
  const schedulesByDate = groupByDate(sortedSchedules, (schedule) => schedule.date);
  const reservationsByDate = groupByDate(
    sortedReservations,
    (reservation) => reservation.startAt.slice(0, 10),
  );
  const recordsByDate = groupByDate(sortedRecords, (record) => record.date);
  return getTripDates(trip.startDate, trip.endDate).map((date) => {
    const dayRecords = recordsByDate.get(date) ?? [];
    return {
      date,
      schedules: schedulesByDate.get(date) ?? [],
      reservations: reservationsByDate.get(date) ?? [],
      records: dayRecords,
      expenseTotal: dayRecords.reduce((sum, record) => sum + (record.amount ?? 0), 0),
    };
  });
}

function groupByDate<T>(items: T[], getDate: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const date = getDate(item);
    const group = grouped.get(date);
    if (group) group.push(item);
    else grouped.set(date, [item]);
  }
  return grouped;
}

export function buildTripSummary(
  trip: Trip,
  schedules: Schedule[],
  reservations: Reservation[],
  records: TripRecord[],
) {
  return {
    duration: getTripDuration(trip.startDate, trip.endDate),
    counts: {
      schedules: schedules.length,
      reservations: reservations.length,
      records: records.length,
      places: countUniqueVisitedPlaces(records),
    },
    days: groupTripByDay(trip, schedules, reservations, records),
    expenses: getExpenseBreakdown(records),
    records: sortRecords(records),
  };
}
