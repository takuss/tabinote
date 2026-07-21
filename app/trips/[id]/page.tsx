"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteSchedule, sortSchedules, type Schedule } from "@/app/lib/schedules";
import { useSchedules } from "@/app/lib/use-schedules";
import { deleteTrip, formatTripDate, formatTripDateRange, getTripStatus, type Trip } from "@/app/lib/trips";
import { getTripDuration } from "@/app/lib/trip-summary";
import { AppCard, EmptyState, SectionHeader, StatusBadge } from "@/app/components/ui";
import { useTrips } from "@/app/lib/use-trips";
import ReservationsSection from "@/app/components/reservations-section";
import RecordsSections from "@/app/components/records-sections";
import QuickAddLauncher from "@/app/components/quick-add-launcher";
import CoverPhotoBanner from "@/app/components/cover-photo-banner";
import CoverPhotoManager from "@/app/components/cover-photo-manager";
import { deleteCoverPhoto } from "@/app/lib/cover-photo-storage";
import { deleteRecordPhotosForTrip } from "@/app/lib/record-photo-storage";
import TransportsSection from "@/app/components/transports-section";
import NextTransportCard from "@/app/components/next-transport-card";
import TripExperienceNav from "@/app/components/trip-experience-nav";
import PlanFlow from "@/app/components/plan-flow";


export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, isLoaded } = useTrips();
  const { schedules, isLoaded: schedulesLoaded } = useSchedules(id);
  const trip = trips.find((item) => item.id === id);
  const [quickDate, setQuickDate] = useState("");

  async function handleTripDelete() {
    if (!trip || !window.confirm(`「${trip.title}」を削除しますか？\n日程・予約・記録もすべて削除され、この操作は取り消せません。`)) return;
    if (deleteTrip(trip.id)) {
      await Promise.allSettled([deleteCoverPhoto(trip.id), deleteRecordPhotosForTrip(trip.id)]);
      router.push("/");
    }
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
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
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
            <TripDetailHero trip={trip} onDelete={handleTripDelete} />
            <TripExperienceNav trip={trip} active="plan" />
            <NextTransportCard trip={trip} />
            <PlanFlow trip={trip} onActiveDateChange={setQuickDate} />

            <QuickAddLauncher trip={trip} navigationOnly initialDate={quickDate} />
            <CoverPhotoManager tripId={trip.id} />

            <details className="mt-5 rounded-2xl bg-white px-4 open:pb-2 sm:px-5"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-bold">旅行情報<span className="text-stone-400" aria-hidden="true">⌄</span></summary><dl className="divide-y divide-stone-100">
                <DetailRow label="行き先" value={trip.destination} />
                <DetailRow label="開始日" value={formatTripDate(trip.startDate)} />
                <DetailRow label="終了日" value={formatTripDate(trip.endDate)} />
                <DetailRow label="状態" value={getTripStatus(trip).label} />
                <DetailRow label="メモ" value={trip.memo || "メモはありません"} preserveLines />
              </dl></details>

            <details className="mt-6"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between rounded-2xl bg-white px-5 font-bold">すべての情報を管理<span aria-hidden="true" className="text-stone-400">⌄</span></summary><div className="pb-4"><section aria-labelledby="schedule-heading" className="mt-5"><AppCard><SectionHeader id="schedule-heading" title="予定" count={schedules.length} href={`/trips/${trip.id}/schedule/new`} />
              {!schedulesLoaded ? (
                <p className="py-6 text-sm text-stone-500">予定を読み込んでいます…</p>
              ) : schedules.length === 0 ? (
                <EmptyState title="予定はまだありません" description="下の追加ボタンから、最初の予定を登録できます。" />
              ) : (
                <ScheduleList tripId={trip.id} schedules={schedules} onDelete={handleScheduleDelete} />
              )}</AppCard>
            </section>

            <TransportsSection trip={trip} />
            <ReservationsSection trip={trip} />
            <RecordsSections trip={trip} />
            </div></details>
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
            <Link href={`/trips/${tripId}/schedule/${schedule.id}/edit`} className="inline-flex min-h-12 items-center font-medium text-teal-800 hover:underline">編集</Link>
            <button type="button" onClick={() => onDelete(schedule)} className="inline-flex min-h-12 items-center font-medium text-stone-500 hover:text-red-700">削除</button>
          </div>
        </li>
      ))}</ol>
    </section>
  ))}</div>;
}

function DetailRow({ label, value, preserveLines = false }: { label: string; value: string; preserveLines?: boolean }) {
  return <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-5"><dt className="text-sm font-medium text-stone-500">{label}</dt><dd className={`text-sm leading-6 ${preserveLines ? "whitespace-pre-wrap" : ""}`}>{value}</dd></div>;
}

function TripDetailHero({ trip, onDelete }: { trip: Trip; onDelete: () => void }) {
  return <><CoverPhotoBanner tripId={trip.id} alt={`${trip.title}の表紙写真`}><div className="flex items-start justify-between gap-3"><Link href="/" className="inline-flex min-h-12 items-center text-sm font-bold text-white/85 hover:text-white">← 旅行一覧</Link><StatusBadge className={getTripStatus(trip).className}>{getTripStatus(trip).label}</StatusBadge></div><div className="min-w-0"><p className="truncate text-sm text-white/75">{trip.destination}</p><h1 className="mt-1 line-clamp-2 break-words text-2xl font-bold tracking-tight sm:text-4xl">{trip.title}</h1><p className="mt-2 text-sm text-white/85">{formatTripDateRange(trip.startDate, trip.endDate)}・{getTripDuration(trip.startDate, trip.endDate).days}日間</p></div></CoverPhotoBanner><div className="mt-3 flex gap-3"><Link href={`/trips/${trip.id}/summary`} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800">旅のまとめ</Link><Link href={`/trips/${trip.id}/edit`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-100">編集</Link><button type="button" onClick={onDelete} className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-stone-400 hover:text-red-700">削除</button></div></>;
}
