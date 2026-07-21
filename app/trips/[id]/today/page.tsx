"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTrips } from "@/app/lib/use-trips";
import { useTransports } from "@/app/lib/use-transports";
import { useSchedules } from "@/app/lib/use-schedules";
import { useReservations } from "@/app/lib/use-reservations";
import { getTripDates } from "@/app/lib/trip-summary";
import { TRANSPORT_MODE_LABELS } from "@/app/lib/transports";
import TripExperienceNav from "@/app/components/trip-experience-nav";
import QuickAddLauncher, { OPEN_QUICK_RECORD_EVENT } from "@/app/components/quick-add-launcher";
import { OPEN_QUICK_ADD_EVENT } from "@/app/components/bottom-navigation";

export default function TodayPage() {
  const { id } = useParams<{ id: string }>();
  const { trips, isLoaded } = useTrips();
  const trip = trips.find((item) => item.id === id);
  const { transports } = useTransports(id);
  const { schedules } = useSchedules(id);
  const { reservations } = useReservations(id);
  const dates = useMemo(() => trip ? getTripDates(trip.startDate, trip.endDate) : [], [trip]);
  const [selected, setSelected] = useState("");
  if (!isLoaded) return <main className="min-h-screen bg-stone-100 p-6">旅行を読み込んでいます…</main>;
  if (!trip) return <main className="min-h-screen bg-stone-100 p-6">旅行が見つかりません。</main>;
  const today = localDate();
  const active = selected || (today < trip.startDate ? trip.startDate : today > trip.endDate ? trip.endDate : today);
  const index = dates.indexOf(active);
  const items = [
    ...transports.filter((item) => item.departureDate === active).map((item) => ({ id: `t-${item.id}`, time: item.departureTime, type: "移動", title: `${item.departurePlace} → ${item.arrivalPlace}`, detail: `${TRANSPORT_MODE_LABELS[item.mode]} ${item.serviceName} ${[item.carNumber, item.seatNumber, item.departurePlatform].filter(Boolean).join("・")}`, place: item.arrivalPlace })),
    ...schedules.filter((item) => item.date === active).map((item) => ({ id: `s-${item.id}`, time: item.startTime, type: "予定", title: item.title, detail: item.place, place: item.place })),
    ...reservations.filter((item) => item.startAt.slice(0, 10) === active).map((item) => ({ id: `r-${item.id}`, time: item.startAt.slice(11, 16), type: "予約", title: item.name, detail: item.type, place: "" })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const nowTime = today === active ? localTime() : "00:00";
  const found = items.findIndex((item) => item.time >= nowTime);
  const highlight = found;
  const next = found >= 0 ? items[found] : undefined;
  return <main className="min-h-screen bg-stone-100 px-4 py-5 text-stone-900"><div className="mx-auto max-w-3xl">
    <TripExperienceNav trip={trip} active="today" />
    <header className="pt-4"><p className="text-sm font-bold text-teal-800">{index + 1}日目</p><h1 className="text-2xl font-bold">{active === today ? "今日の旅程" : "この日の旅程"}</h1><p className="mt-1 text-stone-500">{formatDate(active)}</p></header>
    <div role="tablist" aria-label="表示日" className="mt-4 flex gap-2 overflow-x-auto pb-2">{dates.map((date, dayIndex) => <button key={date} role="tab" aria-selected={active === date} onClick={() => setSelected(date)} className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-bold ${active === date ? "bg-teal-700 text-white" : "bg-white"}`}>{dayIndex + 1}日目</button>)}</div>
    {next && <section className="mt-3 rounded-2xl bg-teal-800 p-5 text-white"><p className="text-xs font-bold text-teal-100">次の行動</p><p className="mt-2 text-sm tabular-nums text-white/80">{next.time}</p><h2 className="mt-1 break-words text-xl font-bold">{next.title}</h2><p className="mt-2 break-words text-sm text-white/80">{next.detail}</p>{next.place && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(next.place)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 items-center rounded-xl bg-white px-4 text-sm font-bold text-teal-900">地図を開く</a>}</section>}
    <section className="mt-6"><h2 className="text-lg font-bold">1日の流れ</h2>{items.length ? <ol className="mt-3 space-y-2">{items.map((item, itemIndex) => <li key={item.id} className={`grid grid-cols-[3.5rem_1fr] gap-3 rounded-xl p-4 ${itemIndex === highlight ? "bg-white ring-2 ring-teal-700" : itemIndex < (highlight >= 0 ? highlight : items.length) ? "bg-white/50 text-stone-400" : "bg-white"}`}><time className="text-sm tabular-nums">{item.time || "--:--"}</time><div><p className="text-xs font-bold">{itemIndex === highlight && "次："}{item.type}</p><p className="mt-0.5 break-words font-bold">{item.title}</p>{item.detail && <p className="mt-1 break-words text-sm opacity-75">{item.detail}</p>}</div></li>)}</ol> : <p className="mt-3 rounded-xl bg-white p-5 text-sm text-stone-500">この日の予定はまだありません。</p>}</section>
    <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => dispatchEvent(new Event(OPEN_QUICK_RECORD_EVENT))} className="min-h-14 rounded-xl bg-teal-700 px-3 font-bold text-white">写真・思い出を残す</button><button type="button" onClick={() => dispatchEvent(new Event(OPEN_QUICK_ADD_EVENT))} className="min-h-14 rounded-xl bg-white px-3 font-bold text-stone-700">支出などを追加</button></div>
    <QuickAddLauncher trip={trip} navigationOnly experience="today" initialDate={active} />
  </div></main>;
}
function localDate() { const now = new Date(), pad = (value: number) => String(value).padStart(2, "0"); return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; }
function localTime() { const now = new Date(), pad = (value: number) => String(value).padStart(2, "0"); return `${pad(now.getHours())}:${pad(now.getMinutes())}`; }
function formatDate(value: string) { const [year, month, day] = value.split("-").map(Number); return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(new Date(year, month - 1, day)); }
