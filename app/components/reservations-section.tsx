"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteReservation, sortReservations, type Reservation } from "@/app/lib/reservations";
import { useReservations } from "@/app/lib/use-reservations";
import QuickReservationForm from "@/app/components/quick-reservation-form";
import type { Trip } from "@/app/lib/trips";

export default function ReservationsSection({ trip }: { trip: Trip }) {
  const tripId = trip.id;
  const { reservations, isLoaded } = useReservations(tripId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const sortedReservations = useMemo(() => sortReservations(reservations), [reservations]);
  const totalAmount = useMemo(() => reservations.reduce((total, item) => total + (item.amount ?? 0), 0), [reservations]);

  function handleDelete(item: Reservation) {
    if (window.confirm(`予約情報「${item.name}」を削除しますか？`)) deleteReservation(item.id);
  }

  async function copyNumber(item: Reservation) {
    try {
      await navigator.clipboard.writeText(item.confirmationNumber);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId((current) => current === item.id ? null : current), 1800);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section aria-labelledby="reservations-heading" className="border-t border-stone-300 py-7">
      <div className="flex items-center justify-between gap-4 border-b border-stone-300 pb-3">
        <h2 id="reservations-heading" className="text-lg font-bold">予約</h2>
        <Link href={`/trips/${tripId}/reservations/new`} className="inline-flex min-h-12 items-center text-sm font-bold text-teal-800 hover:underline">詳細入力</Link>
      </div>
      <QuickReservationForm trip={trip} />
      {!isLoaded ? <p className="py-6 text-sm text-stone-500">予約情報を読み込んでいます…</p> : reservations.length === 0 ? <p className="py-7 text-sm text-stone-500">まだ予約情報がありません</p> : (
        <><div className="flex items-baseline justify-between border-b border-stone-200 py-5"><p className="text-sm text-stone-500">予約金額の合計</p><p className="text-xl font-bold tabular-nums">{new Intl.NumberFormat("ja-JP").format(totalAmount)}円</p></div><ol className="divide-y divide-stone-300">
          {sortedReservations.map((item) => (
            <li key={item.id} className="py-5">
              <article className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:gap-5">
                <div className="text-sm tabular-nums text-stone-600"><p className="font-medium">{formatReservationDate(item.startAt)}</p><p className="mt-1">{formatReservationTime(item.startAt, item.endAt)}</p></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.name}</h3><span className="border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{item.type}</span></div>
                  {item.provider && <p className="mt-1 text-sm text-stone-600">{item.provider}</p>}
                  {item.confirmationNumber && <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span className="text-stone-500">予約番号</span><code className="font-sans font-medium">{item.confirmationNumber}</code><button type="button" onClick={() => copyNumber(item)} className="font-medium text-teal-800 hover:underline">コピー</button>{copiedId === item.id && <span role="status" className="text-xs text-teal-800">コピーしました</span>}</div>}
                  {item.amount !== null && <p className="mt-2 text-sm font-medium">{new Intl.NumberFormat("ja-JP").format(item.amount)}円</p>}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-800 hover:underline">予約ページを開く</a>}
                    {item.phone && <a href={`tel:${item.phone}`} className="font-medium text-teal-800 hover:underline">{item.phone}</a>}
                  </div>
                  {item.memo && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-500">{item.memo}</p>}
                </div>
                <div className="flex gap-3 text-sm sm:justify-end">
                  <Link href={`/trips/${tripId}/reservations/${item.id}/edit`} className="font-medium text-teal-800 hover:underline">編集</Link>
                  <button type="button" onClick={() => handleDelete(item)} className="font-medium text-red-700 hover:underline">削除</button>
                </div>
              </article>
            </li>
          ))}
        </ol></>
      )}
    </section>
  );
}

function parseDateTime(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}
function formatReservationDate(value: string) { return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(parseDateTime(value)); }
function formatReservationTime(start: string, end: string) {
  if (!start.includes("T") && !end) return "時刻なし";
  const time = (value: string) => new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(parseDateTime(value));
  return end ? `${time(start)}–${time(end)}` : time(start);
}
