import { canParseStorageText, MAX_STORED_ITEMS } from "@/app/lib/storage-safety";

export const RECORD_TYPES = ["観光", "食事", "移動", "宿泊", "買い物", "出来事", "メモ", "その他"] as const;
export const EXPENSE_CATEGORIES = ["交通", "宿泊", "食事", "観光・チケット", "買い物", "その他"] as const;
export const PAYMENT_METHODS = ["現金", "クレジットカード", "電子マネー", "QRコード決済", "その他"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type TripRecord = {
  id: string; tripId: string; date: string; time: string; title: string; place: string;
  type: RecordType; memo: string; amount: number | null;
  expenseCategory: ExpenseCategory | ""; paymentMethod: PaymentMethod | "";
  createdAt: string; updatedAt: string;
};
export type RecordValues = Omit<TripRecord, "id" | "tripId" | "amount" | "createdAt" | "updatedAt"> & { amount: string };
export type RecordErrors = Partial<Record<"date" | "title" | "type" | "amount" | "expenseCategory", string>>;
export const RECORDS_STORAGE_KEY = "tabinote.records";
export const RECORDS_CHANGED_EVENT = "tabinote:records-changed";

function isRecord(value: unknown): value is TripRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.tripId === "string" &&
    typeof item.date === "string" && typeof item.time === "string" &&
    typeof item.title === "string" && typeof item.place === "string" &&
    typeof item.type === "string" && RECORD_TYPES.includes(item.type as RecordType) &&
    typeof item.memo === "string" &&
    (item.amount === null || (typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount >= 0)) &&
    typeof item.expenseCategory === "string" && (item.expenseCategory === "" || EXPENSE_CATEGORIES.includes(item.expenseCategory as ExpenseCategory)) &&
    typeof item.paymentMethod === "string" && (item.paymentMethod === "" || PAYMENT_METHODS.includes(item.paymentMethod as PaymentMethod)) &&
    typeof item.createdAt === "string" && typeof item.updatedAt === "string";
}

let cachedRecordsSource: string | null | undefined;
let cachedRecords: TripRecord[] = [];

export function parseRecords(saved: string | null): TripRecord[] {
  if (saved === cachedRecordsSource) return cachedRecords;
  cachedRecordsSource = saved;
  try {
    if (!canParseStorageText(saved)) return (cachedRecords = []);
    const parsed: unknown = JSON.parse(saved);
    cachedRecords = Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_ITEMS).filter(isRecord) : [];
  } catch { cachedRecords = []; }
  return cachedRecords;
}
export function loadRecords() { try { return parseRecords(window.localStorage.getItem(RECORDS_STORAGE_KEY)); } catch { return []; } }
function writeRecords(items: TripRecord[]) { window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(items)); window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT)); }
export function saveRecord(item: TripRecord) { const items = loadRecords(); if (items.some((saved) => saved.id === item.id)) throw new Error("Record ID already exists"); writeRecords([...items, item]); }
export function updateRecord(id: string, item: TripRecord) { const items = loadRecords(); if (!items.some((saved) => saved.id === id)) return false; writeRecords(items.map((saved) => saved.id === id ? item : saved)); return true; }
export function deleteRecord(id: string) { const items = loadRecords(); const remaining = items.filter((item) => item.id !== id); if (remaining.length === items.length) return false; writeRecords(remaining); return true; }
export function deleteRecordsForTrip(tripId: string) { const items = loadRecords(); const remaining = items.filter((item) => item.tripId !== tripId); if (remaining.length !== items.length) writeRecords(remaining); }
export function createRecordId() { const ids = new Set(loadRecords().map((item) => item.id)); let id = globalThis.crypto.randomUUID(); while (ids.has(id)) id = globalThis.crypto.randomUUID(); return id; }

export function validateRecordValues(values: RecordValues, tripStart: string, tripEnd: string): RecordErrors {
  const errors: RecordErrors = {};
  if (!values.date) errors.date = "日付を選択してください。";
  else if (values.date < tripStart || values.date > tripEnd) errors.date = "旅行期間内の日付を選択してください。";
  if (!values.title) errors.title = "タイトルを入力してください。";
  if (!RECORD_TYPES.includes(values.type as RecordType)) errors.type = "種類を選択してください。";
  if (values.amount !== "" && (!Number.isFinite(Number(values.amount)) || Number(values.amount) < 0)) errors.amount = "費用は0以上の数値で入力してください。";
  if (values.amount !== "" && !EXPENSE_CATEGORIES.includes(values.expenseCategory as ExpenseCategory)) errors.expenseCategory = "費用カテゴリーを選択してください。";
  return errors;
}

export function sortRecords(items: TripRecord[]) {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || (a.time === b.time ? 0 : !a.time ? 1 : !b.time ? -1 : a.time.localeCompare(b.time)));
}
export function summarizeExpenses(items: TripRecord[]) {
  const expenses = items.filter((item) => item.amount !== null);
  const byCategory = new Map<ExpenseCategory, number>();
  for (const item of expenses) {
    if (item.expenseCategory && item.amount !== null) byCategory.set(item.expenseCategory, (byCategory.get(item.expenseCategory) ?? 0) + item.amount);
  }
  return { total: expenses.reduce((sum, item) => sum + (item.amount ?? 0), 0), byCategory: Array.from(byCategory, ([category, amount]) => ({ category, amount })), count: expenses.length };
}
