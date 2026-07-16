import { canParseStorageText, MAX_STORED_ITEMS } from "@/app/lib/storage-safety";

export const SCHEDULE_TYPES = ["移動", "観光", "食事", "宿泊", "買い物", "その他"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export type Schedule = {
  id: string;
  tripId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  place: string;
  memo: string;
  type: ScheduleType;
  createdAt: string;
  updatedAt: string;
};

export const SCHEDULES_STORAGE_KEY = "tabinote.schedules";
export const SCHEDULES_CHANGED_EVENT = "tabinote:schedules-changed";

function isSchedule(value: unknown): value is Schedule {
  if (!value || typeof value !== "object") return false;
  const schedule = value as Record<string, unknown>;
  return (
    typeof schedule.id === "string" &&
    typeof schedule.tripId === "string" &&
    typeof schedule.date === "string" &&
    typeof schedule.startTime === "string" &&
    typeof schedule.endTime === "string" &&
    typeof schedule.title === "string" &&
    typeof schedule.place === "string" &&
    typeof schedule.memo === "string" &&
    typeof schedule.type === "string" &&
    SCHEDULE_TYPES.includes(schedule.type as ScheduleType) &&
    typeof schedule.createdAt === "string" &&
    typeof schedule.updatedAt === "string"
  );
}

let cachedSchedulesSource: string | null | undefined;
let cachedSchedules: Schedule[] = [];

export function parseSchedules(saved: string | null): Schedule[] {
  if (saved === cachedSchedulesSource) return cachedSchedules;
  cachedSchedulesSource = saved;
  try {
    if (!canParseStorageText(saved)) return (cachedSchedules = []);
    const parsed: unknown = JSON.parse(saved);
    cachedSchedules = Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_ITEMS).filter(isSchedule) : [];
  } catch {
    cachedSchedules = [];
  }
  return cachedSchedules;
}

export function loadSchedules() {
  try { return parseSchedules(window.localStorage.getItem(SCHEDULES_STORAGE_KEY)); }
  catch { return []; }
}

function writeSchedules(schedules: Schedule[]) {
  window.localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  window.dispatchEvent(new Event(SCHEDULES_CHANGED_EVENT));
}

export function saveSchedule(schedule: Schedule) {
  const schedules = loadSchedules();
  if (schedules.some((item) => item.id === schedule.id)) {
    throw new Error("Schedule ID already exists");
  }
  writeSchedules([...schedules, schedule]);
}

export function updateSchedule(id: string, schedule: Schedule) {
  const schedules = loadSchedules();
  if (!schedules.some((item) => item.id === id)) return false;
  writeSchedules(schedules.map((item) => (item.id === id ? schedule : item)));
  return true;
}

export function deleteSchedule(id: string) {
  const schedules = loadSchedules();
  const remaining = schedules.filter((item) => item.id !== id);
  if (remaining.length === schedules.length) return false;
  writeSchedules(remaining);
  return true;
}

export function deleteSchedulesForTrip(tripId: string) {
  const schedules = loadSchedules();
  const remaining = schedules.filter((item) => item.tripId !== tripId);
  if (remaining.length !== schedules.length) writeSchedules(remaining);
}

export function createScheduleId() {
  const existingIds = new Set(loadSchedules().map((schedule) => schedule.id));
  let id = globalThis.crypto.randomUUID();
  while (existingIds.has(id)) id = globalThis.crypto.randomUUID();
  return id;
}

export function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}
