import { canParseStorageText, MAX_STORED_ITEMS } from "@/app/lib/storage-safety";

export const TRANSPORT_MODES = ["shinkansen", "limited-express", "local-train", "subway", "tram", "bus", "highway-bus", "airplane", "ferry", "rental-car", "car", "taxi", "walk", "bicycle", "other"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];
export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = { shinkansen: "新幹線", "limited-express": "特急", "local-train": "普通列車", subway: "地下鉄", tram: "路面電車", bus: "バス", "highway-bus": "高速バス", airplane: "飛行機", ferry: "フェリー", "rental-car": "レンタカー", car: "自家用車", taxi: "タクシー", walk: "徒歩", bicycle: "自転車", other: "その他" };

export type Transport = { id: string; tripId: string; mode: TransportMode; departurePlace: string; arrivalPlace: string; departureDate: string; departureTime: string; arrivalDate: string; arrivalTime: string; serviceName: string; operator: string; departurePlatform: string; arrivalPlatform: string; terminal: string; carNumber: string; seatNumber: string; fare: number | null; bookingUrl: string; memo: string; reservationId: string; createdAt: string; updatedAt: string };
export type TransportValues = Omit<Transport, "id" | "tripId" | "fare" | "createdAt" | "updatedAt"> & { fare: string };
export type TransportErrors = Partial<Record<"mode" | "departurePlace" | "arrivalPlace" | "departureDate" | "departureTime" | "arrivalDate" | "arrivalTime" | "fare" | "bookingUrl", string>>;
export const TRANSPORTS_STORAGE_KEY = "tabinote.transports";
export const TRANSPORTS_CHANGED_EVENT = "tabinote:transports-changed";

export function isTransport(value: unknown): value is Transport {
  if (!value || typeof value !== "object") return false;
  const x = value as Record<string, unknown>;
  return typeof x.id === "string" && typeof x.tripId === "string" && typeof x.mode === "string" && TRANSPORT_MODES.includes(x.mode as TransportMode) && ["departurePlace", "arrivalPlace", "departureDate", "departureTime", "arrivalDate", "arrivalTime", "serviceName", "operator", "departurePlatform", "arrivalPlatform", "terminal", "carNumber", "seatNumber", "bookingUrl", "memo", "reservationId", "createdAt", "updatedAt"].every((key) => typeof x[key] === "string") && (x.fare === null || (typeof x.fare === "number" && Number.isFinite(x.fare) && x.fare >= 0));
}
let cachedSource: string | null | undefined; let cached: Transport[] = [];
export function parseTransports(saved: string | null) { if (saved === cachedSource) return cached; cachedSource = saved; try { if (!canParseStorageText(saved)) return (cached = []); const value: unknown = JSON.parse(saved); return (cached = Array.isArray(value) ? value.slice(0, MAX_STORED_ITEMS).filter(isTransport) : []); } catch { return (cached = []); } }
export function loadTransports() { try { return parseTransports(localStorage.getItem(TRANSPORTS_STORAGE_KEY)); } catch { return []; } }
function write(items: Transport[]) { localStorage.setItem(TRANSPORTS_STORAGE_KEY, JSON.stringify(items)); window.dispatchEvent(new Event(TRANSPORTS_CHANGED_EVENT)); }
export function saveTransport(item: Transport) { const items = loadTransports(); if (items.some((x) => x.id === item.id)) throw new Error("Transport ID already exists"); write([...items, item]); }
export function updateTransport(id: string, item: Transport) { const items = loadTransports(); if (!items.some((x) => x.id === id)) return false; write(items.map((x) => x.id === id ? item : x)); return true; }
export function deleteTransport(id: string) { const items = loadTransports(); const next = items.filter((x) => x.id !== id); if (next.length === items.length) return false; write(next); return true; }
export function deleteTransportsForTrip(tripId: string) { const items = loadTransports(); const next = items.filter((x) => x.tripId !== tripId); if (next.length !== items.length) write(next); }
export function createTransportId() { const ids = new Set(loadTransports().map((x) => x.id)); let id = crypto.randomUUID(); while (ids.has(id)) id = crypto.randomUUID(); return id; }
export function sortTransports(items: Transport[]) { return [...items].sort((a, b) => transportDeparture(a).localeCompare(transportDeparture(b))); }
export function findPreviousTransport(items: Transport[], departureDate: string, departureTime: string, excludeId?: string) { const target = `${departureDate}T${departureTime || "23:59"}`; return sortTransports(items).filter((item) => item.id !== excludeId && transportDeparture(item) < target).at(-1); }
export function transportDeparture(item: Transport) { return `${item.departureDate}T${item.departureTime}`; }
export function transportArrival(item: Transport) { return item.arrivalTime ? `${item.arrivalDate || item.departureDate}T${item.arrivalTime}` : ""; }
export function transportDurationMinutes(item: Transport) { const end = transportArrival(item); if (!end) return null; const ms = new Date(end).getTime() - new Date(transportDeparture(item)).getTime(); return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 60000) : null; }
export function formatDuration(minutes: number | null) { if (minutes === null) return ""; const h = Math.floor(minutes / 60), m = minutes % 60; return h ? `${h}時間${m ? `${m}分` : ""}` : `${m}分`; }
export function validateTransportValues(v: TransportValues, tripStart: string, tripEnd: string): TransportErrors {
  const e: TransportErrors = {};
  if (!TRANSPORT_MODES.includes(v.mode as TransportMode)) e.mode = "移動手段を選択してください。";
  if (!v.departurePlace.trim()) e.departurePlace = "出発地を入力してください。"; if (!v.arrivalPlace.trim()) e.arrivalPlace = "到着地を入力してください。";
  if (!v.departureDate || v.departureDate < tripStart || v.departureDate > tripEnd) e.departureDate = "旅行期間内の出発日を選択してください。"; if (!v.departureTime) e.departureTime = "出発時刻を入力してください。";
  const arrivalDate = v.arrivalDate || (v.arrivalTime ? v.departureDate : ""); if (arrivalDate && (arrivalDate < tripStart || arrivalDate > tripEnd)) e.arrivalDate = "旅行期間内の到着日を選択してください。";
  if (v.arrivalTime && `${arrivalDate}T${v.arrivalTime}` < `${v.departureDate}T${v.departureTime}`) e.arrivalTime = "到着日時は出発日時以降を指定してください。";
  if (v.fare && (!Number.isFinite(Number(v.fare)) || Number(v.fare) < 0)) e.fare = "運賃は0以上の数値で入力してください。";
  if (v.bookingUrl) try { const url = new URL(v.bookingUrl); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { e.bookingUrl = "http:// または https:// から始まるURLを入力してください。"; }
  return e;
}
export function nextTransport(items: Transport[], now = new Date()) { const sorted = sortTransports(items); const current = sorted.find((x) => { const end = transportArrival(x); return transportDeparture(x) <= localDateTime(now) && Boolean(end) && localDateTime(now) <= end; }); return current ? { item: current, active: true } : (() => { const item = sorted.find((x) => transportDeparture(x) > localDateTime(now)); return item ? { item, active: false } : null; })(); }
function localDateTime(date: Date) { const p = (n: number) => String(n).padStart(2, "0"); return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`; }
