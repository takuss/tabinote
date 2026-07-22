import { canParseStorageText, MAX_STORED_ITEMS } from "@/app/lib/storage-safety";
import { createRecordId, deleteRecord, saveRecord, type ExpenseCategory, type RecordType, type TripRecord } from "@/app/lib/records";

export const RESERVATION_TYPES = ["宿泊", "新幹線・鉄道", "飛行機", "高速バス", "レンタカー", "フェリー", "飲食店", "施設・チケット", "その他"] as const;
export type ReservationType = (typeof RESERVATION_TYPES)[number];

export type Reservation = {
  id: string; tripId: string; type: ReservationType; name: string;
  startAt: string; endAt: string; provider: string; confirmationNumber: string;
  reservedBy: string; amount: number | null; url: string; phone: string; memo: string;
  createdAt: string; updatedAt: string;
};

export type ReservationValues = Omit<Reservation, "id" | "tripId" | "amount" | "createdAt" | "updatedAt"> & { amount: string };
export type ReservationErrors = Partial<Record<"type" | "name" | "startAt" | "endAt" | "amount" | "url", string>>;
export const RESERVATIONS_STORAGE_KEY = "tabinote.reservations";
export const RESERVATIONS_CHANGED_EVENT = "tabinote:reservations-changed";

function isReservation(value: unknown): value is Reservation {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.tripId === "string" &&
    typeof item.type === "string" && RESERVATION_TYPES.includes(item.type as ReservationType) &&
    typeof item.name === "string" && typeof item.startAt === "string" &&
    typeof item.endAt === "string" && typeof item.provider === "string" &&
    typeof item.confirmationNumber === "string" && typeof item.reservedBy === "string" &&
    (item.amount === null || (typeof item.amount === "number" && Number.isFinite(item.amount))) &&
    typeof item.url === "string" && typeof item.phone === "string" && typeof item.memo === "string" &&
    typeof item.createdAt === "string" && typeof item.updatedAt === "string";
}

let cachedReservationsSource: string | null | undefined;
let cachedReservations: Reservation[] = [];

export function parseReservations(saved: string | null): Reservation[] {
  if (saved === cachedReservationsSource) return cachedReservations;
  cachedReservationsSource = saved;
  try {
    if (!canParseStorageText(saved)) return (cachedReservations = []);
    const parsed: unknown = JSON.parse(saved);
    cachedReservations = Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_ITEMS).filter(isReservation) : [];
  } catch { cachedReservations = []; }
  return cachedReservations;
}

export function loadReservations() { try { return parseReservations(window.localStorage.getItem(RESERVATIONS_STORAGE_KEY)); } catch { return []; } }
function writeReservations(items: Reservation[]) {
  window.localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(RESERVATIONS_CHANGED_EVENT));
}
export function saveReservation(item: Reservation) {
  const items = loadReservations();
  if (items.some((saved) => saved.id === item.id)) throw new Error("Reservation ID already exists");
  writeReservations([...items, item]);
}

function expenseDetailsForReservation(type: ReservationType): { category: ExpenseCategory; recordType: RecordType } {
  if (type === "宿泊") return { category: "宿泊", recordType: "宿泊" };
  if (["新幹線・鉄道", "飛行機", "高速バス", "レンタカー", "フェリー"].includes(type)) {
    return { category: "交通", recordType: "移動" };
  }
  if (type === "飲食店") return { category: "食事", recordType: "食事" };
  if (type === "施設・チケット") return { category: "観光・チケット", recordType: "観光" };
  return { category: "その他", recordType: "その他" };
}

export function saveReservationWithExpense(item: Reservation, addToExpenses: boolean) {
  saveReservation(item);
  if (!addToExpenses || item.amount === null) return;

  const { category, recordType } = expenseDetailsForReservation(item.type);
  const expenseId = createRecordId();
  const expense: TripRecord = {
    id: expenseId,
    tripId: item.tripId,
    date: item.startAt.slice(0, 10),
    time: item.startAt.includes("T") ? item.startAt.slice(11, 16) : "",
    title: `${item.name}（予約）`,
    place: "",
    type: recordType,
    memo: `予約「${item.name}」の費用`,
    amount: item.amount,
    expenseCategory: category,
    paymentMethod: "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  try {
    saveRecord(expense);
  } catch (error) {
    deleteRecord(expenseId);
    deleteReservation(item.id);
    throw error;
  }
}
export function updateReservation(id: string, item: Reservation) {
  const items = loadReservations();
  if (!items.some((saved) => saved.id === id)) return false;
  writeReservations(items.map((saved) => saved.id === id ? item : saved));
  return true;
}
export function deleteReservation(id: string) {
  const items = loadReservations();
  const remaining = items.filter((item) => item.id !== id);
  if (remaining.length === items.length) return false;
  writeReservations(remaining); return true;
}
export function deleteReservationsForTrip(tripId: string) {
  const items = loadReservations();
  const remaining = items.filter((item) => item.tripId !== tripId);
  if (remaining.length !== items.length) writeReservations(remaining);
}
export function createReservationId() {
  const ids = new Set(loadReservations().map((item) => item.id));
  let id = globalThis.crypto.randomUUID();
  while (ids.has(id)) id = globalThis.crypto.randomUUID();
  return id;
}

export function validateReservationValues(values: ReservationValues): ReservationErrors {
  const errors: ReservationErrors = {};
  if (!RESERVATION_TYPES.includes(values.type as ReservationType)) errors.type = "予約種別を選択してください。";
  if (!values.name) errors.name = "名称を入力してください。";
  if (!values.startAt) errors.startAt = "利用開始日時を入力してください。";
  if (values.startAt && values.endAt && values.endAt < values.startAt) errors.endAt = "利用終了日時は利用開始日時以降を指定してください。";
  if (values.amount && (!Number.isFinite(Number(values.amount)) || Number(values.amount) < 0)) errors.amount = "金額は0以上の数値で入力してください。";
  if (values.url) {
    try {
      const url = new URL(values.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch { errors.url = "http:// または https:// から始まるURLを入力してください。"; }
  }
  return errors;
}

export function isReservationOutsideTrip(startAt: string, endAt: string, tripStart: string, tripEnd: string) {
  const startDate = startAt.slice(0, 10);
  const endDate = (endAt || startAt).slice(0, 10);
  return startDate < tripStart || startDate > tripEnd || endDate < tripStart || endDate > tripEnd;
}
export function sortReservations(items: Reservation[]) { return [...items].sort((a, b) => a.startAt.localeCompare(b.startAt)); }
