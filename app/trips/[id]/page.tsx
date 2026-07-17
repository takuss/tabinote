"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { deleteSchedule, sortSchedules, type Schedule } from "@/app/lib/schedules";
import { useSchedules } from "@/app/lib/use-schedules";
import { deleteTrip, formatTripDate, getTripStatus } from "@/app/lib/trips";
import { useTrips } from "@/app/lib/use-trips";
import ReservationsSection from "@/app/components/reservations-section";
import RecordsSections from "@/app/components/records-sections";
import QuickScheduleForm from "@/app/components/quick-schedule-form";


export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, isLoaded } = useTrips();
  const { schedules, isLoaded: schedulesLoaded } = useSchedules(id);
  const trip = trips.find((item) => item.id === id);

  function handleTripDelete() {
    if (!trip || !window.confirm(`「${trip.title}」を削除しますか？\n日程・予約・記録もすべて削除され、この操作は取り消せません。`)) return;
    if (deleteTrip(trip.id)) router.push("/");
  }

  function handleScheduleDelete(schedule: Schedule) {
    if (window.confirm(`予定「${schedule.title}」を削除しますか？`)) {
      deleteSchedule(schedule.id);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">旅ノート</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
        {!isLoaded ? (
          <p className="text-sm text-stone-500">旅行を読み込んでいます…</p>
        ) : !trip ? (
          <section className="border-b border-stone-300 py-10">
            <h1 className="text-xl font-bold">旅行が見つかりません</h1>
            <p className="mt-2 text-sm text-stone-500">削除されたか、URLが正しくない可能性があります。</p>
            <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-teal-800 hover:underline">← 旅行一覧に戻る</Link>
          </section>
        ) : (
          <>
            <div className="border-b border-stone-300 pb-5">
              <Link href="/" className="text-sm font-medium text-teal-800 hover:underline">← 戻る</Link>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{trip.title}</h1>
                    <span className={`rounded-sm border px-2 py-1 text-xs font-bold ${getTripStatus(trip).className}`}>{getTripStatus(trip).label}</span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{trip.destination}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/trips/${trip.id}/summary`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 sm:flex-none">旅のまとめを見る</Link>
                  <Link href={`/trips/${trip.id}/edit`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none">編集</Link>
                  <button type="button" onClick={handleTripDelete} className="min-h-11 flex-1 rounded border border-red-300 bg-white px-4 text-sm font-bold text-red-700 hover:bg-red-50 sm:flex-none">削除</button>
                </div>
              </div>
            </div>

            <section aria-labelledby="overview-heading" className="py-7">
              <h2 id="overview-heading" className="border-b border-stone-300 pb-3 text-lg font-bold">概要</h2>
              <dl className="divide-y divide-stone-200">
                <DetailRow label="行き先" value={trip.destination} />
                <DetailRow label="開始日" value={formatTripDate(trip.startDate)} />
                <DetailRow label="終了日" value={formatTripDate(trip.endDate)} />
                <DetailRow label="状態" value={getTripStatus(trip).label} />
                <DetailRow label="メモ" value={trip.memo || "メモはありません"} preserveLines />
              </dl>
            </section>

            <section aria-labelledby="schedule-heading" className="border-t border-stone-300 py-7">
              <div className="flex items-center justify-between gap-4 border-b border-stone-300 pb-3">
                <h2 id="schedule-heading" className="text-lg font-bold">日程</h2>
                <Link href={`/trips/${trip.id}/schedule/new`} className="inline-flex min-h-11 items-center text-sm font-bold text-teal-800 hover:underline">詳細入力</Link>
              </div>
              <QuickScheduleForm trip={trip} />
              {!schedulesLoaded ? (
                <p className="py-6 text-sm text-stone-500">予定を読み込んでいます…</p>
              ) : schedules.length === 0 ? (
                <p className="py-7 text-sm text-stone-500">まだ予定がありません</p>
              ) : (
                <ScheduleList tripId={trip.id} schedules={schedules} onDelete={handleScheduleDelete} />
              )}
            </section>

            <ReservationsSection tripId={trip.id} />
            <RecordsSections tripId={trip.id} />
          </>
        )}
      </div>
    </main>
  );
}

function ScheduleList({ tripId, schedules, onDelete }: { tripId: string; schedules: Schedule[]; onDelete: (schedule: Schedule) => void }) {
  const grouped = useMemo(
    () => Map.groupBy(sortSchedules(schedules), (schedule) => schedule.date),
    [schedules],
  );
  return <div className="divide-y divide-stone-300">{Array.from(grouped, ([date, items]) => (
    <section key={date} className="py-5">
      <h3 className="text-sm font-bold">{formatTripDate(date)}</h3>
      <ol className="mt-2 divide-y divide-stone-200">{items.map((schedule) => (
        <li key={schedule.id} className="grid grid-cols-[4.5rem_1fr] gap-3 py-4 sm:grid-cols-[7rem_1fr_auto] sm:gap-5">
          <p className="text-sm font-medium tabular-nums text-stone-600">{schedule.startTime}{schedule.endTime ? `–${schedule.endTime}` : ""}</p>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">{schedule.title}</h4><span className="border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{schedule.type}</span></div>
            {schedule.place && <p className="mt-1 text-sm text-stone-600">{schedule.place}</p>}
            {schedule.memo && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-500">{schedule.memo}</p>}
          </div>
          <div className="col-start-2 flex gap-3 text-sm sm:col-start-3 sm:row-start-1">
            <Link href={`/trips/${tripId}/schedule/${schedule.id}/edit`} className="font-medium text-teal-800 hover:underline">編集</Link>
            <button type="button" onClick={() => onDelete(schedule)} className="font-medium text-red-700 hover:underline">削除</button>
          </div>
        </li>
      ))}</ol>
    </section>
  ))}</div>;
}

function DetailRow({ label, value, preserveLines = false }: { label: string; value: string; preserveLines?: boolean }) {
  return <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-5"><dt className="text-sm font-medium text-stone-500">{label}</dt><dd className={`text-sm leading-6 ${preserveLines ? "whitespace-pre-wrap" : ""}`}>{value}</dd></div>;
}
