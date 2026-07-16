"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { TripRecord } from "@/app/lib/records";
import { buildTripSummary, type TripDaySummary } from "@/app/lib/trip-summary";
import { getTripStatus } from "@/app/lib/trips";
import { useRecords } from "@/app/lib/use-records";
import { useReservations } from "@/app/lib/use-reservations";
import { useSchedules } from "@/app/lib/use-schedules";
import { useTrips } from "@/app/lib/use-trips";

export default function TripSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const { trips, isLoaded: tripsLoaded } = useTrips();
  const { schedules, isLoaded: schedulesLoaded } = useSchedules(id);
  const { reservations, isLoaded: reservationsLoaded } = useReservations(id);
  const { records, isLoaded: recordsLoaded } = useRecords(id);
  const trip = trips.find((item) => item.id === id);
  const isLoaded = tripsLoaded && schedulesLoaded && reservationsLoaded && recordsLoaded;
  const summary = useMemo(
    () => (trip ? buildTripSummary(trip, schedules, reservations, records) : null),
    [trip, schedules, reservations, records],
  );

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">旅ノート</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
        {!isLoaded ? <p className="text-sm text-stone-500">旅のまとめを読み込んでいます…</p> : !trip || !summary ? (
          <section className="border-b border-stone-300 py-10">
            <h1 className="text-xl font-bold">旅行が見つかりません</h1>
            <p className="mt-2 text-sm text-stone-500">削除されたか、URLが正しくない可能性があります。</p>
            <Link href="/" className="mt-5 inline-flex text-sm font-bold text-teal-800 hover:underline">← 旅行一覧に戻る</Link>
          </section>
        ) : <>
          <header className="border-b border-stone-400 pb-6">
            <Link href={`/trips/${trip.id}`} className="text-sm font-medium text-teal-800 hover:underline">← 旅行詳細に戻る</Link>
            <p className="mt-5 text-xs font-bold tracking-widest text-stone-500">旅のまとめ</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{trip.title}</h1>
              <span className={`rounded-sm border px-2 py-1 text-xs font-bold ${getTripStatus(trip).className}`}>{getTripStatus(trip).label}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{trip.destination}</p>
          </header>

          <section aria-labelledby="summary-overview" className="py-7">
            <SectionTitle id="summary-overview">旅行概要</SectionTitle>
            <dl className="divide-y divide-stone-200">
              <Row label="旅行期間" value={`${formatDate(trip.startDate)} — ${formatDate(trip.endDate)}`} />
              <Row label="泊数・日数" value={`${summary.duration.nights}泊${summary.duration.days}日`} />
              <Row label="旅行メモ" value={trip.memo || "メモはありません"} preserveLines />
            </dl>
          </section>

          <section aria-labelledby="numbers-heading" className="border-t border-stone-300 py-7">
            <SectionTitle id="numbers-heading">旅行の数字</SectionTitle>
            <dl className="grid grid-cols-2 border-b border-stone-300 sm:grid-cols-5">
              <Stat label="予定" value={`${summary.counts.schedules}件`} />
              <Stat label="予約" value={`${summary.counts.reservations}件`} />
              <Stat label="記録" value={`${summary.counts.records}件`} />
              <Stat label="支出合計" value={yen(summary.expenses.total)} />
              <Stat label="訪れた場所" value={`${summary.counts.places}件`} />
            </dl>
          </section>

          <section aria-labelledby="daily-heading" className="border-t border-stone-300 py-7">
            <SectionTitle id="daily-heading">日別の振り返り</SectionTitle>
            {summary.days.length === 0 ? <Empty>旅行期間を表示できません</Empty> : (
              <div className="divide-y divide-stone-400 border-b border-stone-400">
                {summary.days.map((day, index) => <DayReview key={day.date} day={day} dayNumber={index + 1} />)}
              </div>
            )}
          </section>

          <section aria-labelledby="expense-summary" className="border-t border-stone-300 py-7">
            <SectionTitle id="expense-summary">支出まとめ</SectionTitle>
            {summary.expenses.count === 0 ? <Empty>まだ支出の記録がありません</Empty> : <div className="pt-5">
              <p className="text-sm text-stone-500">旅行全体の支出</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{yen(summary.expenses.total)}</p>
              <div className="mt-6 divide-y divide-stone-200 border-y border-stone-300">
                {summary.expenses.categories.map((item) => <div key={item.category} className="py-4">
                  <div className="flex items-baseline justify-between gap-4 text-sm"><span className="font-medium">{item.category}</span><span className="tabular-nums">{yen(item.amount)}・{item.percentage}%</span></div>
                  <div className="mt-2 h-1.5 bg-stone-200" aria-hidden="true"><div className="h-full bg-teal-700" style={{ width: `${item.percentage}%` }} /></div>
                </div>)}
              </div>
            </div>}
          </section>

          <section aria-labelledby="all-records" className="border-t border-stone-300 py-7">
            <SectionTitle id="all-records">旅の記録一覧</SectionTitle>
            {summary.records.length === 0 ? <Empty>まだ旅の記録がありません</Empty> : <ol className="divide-y divide-stone-300 border-b border-stone-300">{summary.records.map((record) => <RecordEntry key={record.id} record={record} />)}</ol>}
          </section>
        </>}
      </div>
    </main>
  );
}

function DayReview({ day, dayNumber }: { day: TripDaySummary; dayNumber: number }) {
  const hasData = day.schedules.length || day.reservations.length || day.records.length;
  return <article className="py-6"><header className="flex items-baseline gap-3"><span className="text-xs font-bold text-teal-800">{dayNumber}日目</span><h3 className="font-bold">{formatDate(day.date)}</h3>{day.expenseTotal > 0 && <span className="ml-auto text-sm tabular-nums text-stone-600">支出 {yen(day.expenseTotal)}</span>}</header>
    {!hasData ? <p className="mt-4 text-sm text-stone-500">登録された情報はありません</p> : <div className="mt-4 space-y-5">
      {day.schedules.length > 0 && <DayGroup title="予定">{day.schedules.map((item) => <CompactItem key={item.id} time={item.startTime} title={item.title} detail={item.place} label={item.type} />)}</DayGroup>}
      {day.reservations.length > 0 && <DayGroup title="予約">{day.reservations.map((item) => <CompactItem key={item.id} time={timeFromDateTime(item.startAt)} title={item.name} detail={item.provider} label={item.type} />)}</DayGroup>}
      {day.records.length > 0 && <DayGroup title="記録">{day.records.map((item) => <CompactItem key={item.id} time={item.time || "—"} title={item.title} detail={item.place} label={item.type} />)}</DayGroup>}
    </div>}
  </article>;
}

function DayGroup({ title, children }: { title: string; children: React.ReactNode }) { return <section className="grid gap-2 sm:grid-cols-[5rem_1fr]"><h4 className="text-sm font-bold text-stone-500">{title}</h4><div className="divide-y divide-stone-200">{children}</div></section>; }
function CompactItem({ time, title, detail, label }: { time: string; title: string; detail: string; label: string }) { return <div className="grid grid-cols-[3.5rem_1fr] gap-3 py-2 text-sm"><span className="tabular-nums text-stone-500">{time}</span><div><span className="font-medium">{title}</span><span className="ml-2 text-xs text-stone-500">{label}</span>{detail && <p className="mt-0.5 text-stone-500">{detail}</p>}</div></div>; }

function RecordEntry({ record }: { record: TripRecord }) { return <li className="py-5"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-sm font-medium tabular-nums text-stone-600">{formatDate(record.date)} {record.time}</span><h3 className="font-bold">{record.title}</h3><span className="text-xs text-stone-500">{record.type}</span></div>{record.place && <p className="mt-2 text-sm text-stone-600">{record.place}</p>}{record.memo && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">{record.memo}</p>}{record.amount !== null && <p className="mt-3 text-sm font-bold tabular-nums">{yen(record.amount)} <span className="font-normal text-stone-500">{record.expenseCategory}</span></p>}</li>; }
function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="border-b border-stone-300 pb-3 text-lg font-bold">{children}</h2>; }
function Row({ label, value, preserveLines }: { label: string; value: string; preserveLines?: boolean }) { return <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]"><dt className="text-sm font-medium text-stone-500">{label}</dt><dd className={`text-sm leading-6 ${preserveLines ? "whitespace-pre-wrap" : ""}`}>{value}</dd></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="border-t border-stone-300 px-3 py-4 first:border-t-0 sm:border-l sm:first:border-l-0 sm:first:border-t"><dt className="text-xs text-stone-500">{label}</dt><dd className="mt-1 font-bold tabular-nums">{value}</dd></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="py-7 text-sm text-stone-500">{children}</p>; }
function yen(amount: number) { return `${new Intl.NumberFormat("ja-JP").format(amount)}円`; }
function timeFromDateTime(value: string) { return value.slice(11, 16) || "—"; }
function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value || "日付不明";
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return value;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).format(date);
}
