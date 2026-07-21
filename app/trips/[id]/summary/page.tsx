"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { TripRecord } from "@/app/lib/records";
import type { Reservation } from "@/app/lib/reservations";
import type { Schedule } from "@/app/lib/schedules";
import { buildTripSummary, type TripDaySummary } from "@/app/lib/trip-summary";
import { formatTripDateRange, getTripStatus, type Trip } from "@/app/lib/trips";
import { useRecords } from "@/app/lib/use-records";
import { useReservations } from "@/app/lib/use-reservations";
import { useSchedules } from "@/app/lib/use-schedules";
import { useTrips } from "@/app/lib/use-trips";
import { useTransports } from "@/app/lib/use-transports";
import { formatDuration, TRANSPORT_MODE_LABELS, transportDurationMinutes, type Transport } from "@/app/lib/transports";
import CoverPhotoImage from "@/app/components/cover-photo-image";
import { RecordPhotoViewer } from "@/app/components/record-photo-media";
import { useRecordPhoto } from "@/app/lib/use-record-photo";
import TripExperienceNav from "@/app/components/trip-experience-nav";
import QuickAddLauncher from "@/app/components/quick-add-launcher";
import { useRecordPhotoCount } from "@/app/lib/use-record-photo-count";

export default function TripSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const { trips, isLoaded: tripsLoaded } = useTrips();
  const { schedules, isLoaded: schedulesLoaded } = useSchedules(id);
  const { reservations, isLoaded: reservationsLoaded } = useReservations(id);
  const { records, isLoaded: recordsLoaded } = useRecords(id);
  const { transports, isLoaded: transportsLoaded } = useTransports(id);
  const photoCount = useRecordPhotoCount(id);
  const [activeDay, setActiveDay] = useState(0);
  const trip = trips.find((item) => item.id === id);
  const isLoaded = tripsLoaded && schedulesLoaded && reservationsLoaded && recordsLoaded && transportsLoaded;
  const summary = useMemo(() => trip ? buildTripSummary(trip, schedules, reservations, records, transports) : null, [trip, schedules, reservations, records, transports]);

  return <main className="min-h-screen bg-stone-100 text-stone-900">
    <header className="border-b border-stone-200 bg-white"><div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href="/" className="text-lg font-bold tracking-tight">旅ノート</Link>{trip && <Link href={`/trips/${trip.id}`} className="inline-flex min-h-12 items-center text-sm font-bold text-teal-800 hover:underline">旅行詳細へ</Link>}</div></header>
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      {!isLoaded ? <p className="py-10 text-sm text-stone-500">旅のまとめを読み込んでいます…</p> : !trip || !summary ? <Missing /> : <>
        <Hero trip={trip} days={summary.duration.days} />
        <TripExperienceNav trip={trip} active="memories" />
        <QuickAddLauncher trip={trip} navigationOnly experience="memories" initialDate={summary.days[activeDay]?.date} />

        <section aria-labelledby="overview-heading" className="py-7 sm:py-9">
          <SectionHeading id="overview-heading" eyebrow="AT A GLANCE">旅の概要</SectionHeading>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<PhotoIcon />} label="写真" value={`${photoCount}枚`} />
            <StatCard icon={<CalendarIcon />} label="訪れた場所" value={`${summary.counts.places}か所`} />
            <StatCard icon={<WalletIcon />} label="支出合計" value={yen(summary.expenses.total)} />
            <StatCard icon={<NoteIcon />} label="記録" value={`${summary.counts.records}件`} />
            <StatCard icon={<TrainIcon />} label="移動" value={`${summary.counts.transports}件・${formatDuration(summary.transportMinutes) || "0分"}`} />
          </dl>
          {summary.transports.length > 0 && <p className="mt-3 text-sm text-stone-500">主な移動手段：{mainTransportModes(summary.transports)}</p>}
        </section>

        <section aria-labelledby="timeline-heading" className="rounded-2xl bg-white px-4 py-6 shadow-sm sm:px-7 sm:py-8">
          <SectionHeading id="timeline-heading" eyebrow="TIMELINE">旅のタイムライン</SectionHeading>
          {summary.days.length === 0 ? <Empty>旅行期間を表示できません</Empty> : <>
            <div role="tablist" aria-label="旅行日を選択" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {summary.days.map((day, index) => <button key={day.date} type="button" role="tab" id={`day-tab-${index}`} aria-selected={activeDay === index} aria-controls={`day-panel-${index}`} onClick={() => setActiveDay(index)} className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${activeDay === index ? "bg-teal-700 text-white" : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}><span>{index + 1}日目</span><span className="ml-2 font-normal opacity-80">{shortDate(day.date)}</span></button>)}
            </div>
            {summary.days.map((day, index) => activeDay === index && <div key={day.date} role="tabpanel" id={`day-panel-${index}`} aria-labelledby={`day-tab-${index}`} tabIndex={0} className="mt-5 outline-none"><DayTimeline day={day} /></div>)}
          </>}
        </section>

        <section aria-labelledby="expense-heading" className="py-7 sm:py-9">
          <SectionHeading id="expense-heading" eyebrow="EXPENSES">支出の内訳</SectionHeading>
          {summary.expenses.count === 0 ? <Empty>まだ支出の記録がありません</Empty> : <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-5"><div><p className="text-sm text-stone-500">旅行全体</p><p className="mt-1 text-2xl font-bold tabular-nums">{yen(summary.expenses.total)}</p></div><p className="text-sm text-stone-500">{summary.expenses.count}件</p></div>
            <div className="mt-2 divide-y divide-stone-100">{summary.expenses.categories.map((item) => <div key={item.category} className="py-4"><div className="flex items-baseline justify-between gap-4"><p className="text-sm font-bold">{item.category}</p><p className="text-sm tabular-nums">{yen(item.amount)} <span className="text-stone-400">{item.percentage}%</span></p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100" aria-label={`${item.category} ${item.percentage}%`}><div className="h-full rounded-full bg-teal-600" style={{ width: `${item.percentage}%` }} /></div></div>)}</div>
          </div>}
        </section>

        <section aria-labelledby="photos-heading" className="pb-8">
          <SectionHeading id="photos-heading" eyebrow="PHOTOS">旅の写真</SectionHeading>
          <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-8 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-500"><PhotoIcon /></span><p className="mt-3 font-bold">旅の写真アルバム</p><p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">写真付き記録は日別タイムラインで楽しめます。将来、旅の写真一覧がここに並びます。</p></div>
        </section>
      </>}
    </div>
  </main>;
}

function Hero({ trip, days }: { trip: Trip; days: number }) {
  const status = getTripStatus(trip);
  return <section className="relative aspect-[3/2] min-h-[240px] max-h-[440px] w-full max-w-full overflow-hidden rounded-2xl bg-teal-800 p-6 text-white sm:aspect-video sm:p-8 lg:p-10">
    <CoverPhotoImage tripId={trip.id} alt={`${trip.title}の表紙写真`} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" aria-hidden="true" />
    <div className="absolute -right-16 -top-20 size-64 rounded-full border-[36px] border-white/10" aria-hidden="true" /><div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
    <div className="relative flex h-full min-h-0 flex-col justify-between"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold tracking-[0.25em] text-white/75">TRIP MEMORY</p><span className="rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-bold">{status.label}</span></div><div className="min-w-0"><p className="truncate text-sm font-medium text-white/80">{trip.destination}</p><h1 className="mt-2 line-clamp-3 max-w-3xl break-words text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{trip.title}</h1><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85"><span>{formatTripDateRange(trip.startDate, trip.endDate)}</span><span className="h-4 w-px bg-white/35" aria-hidden="true" /><span className="font-bold">{days}日間</span></div></div></div>
  </section>;
}

function DayTimeline({ day }: { day: TripDaySummary }) {
  const items = [
    ...day.schedules.map((item) => ({ key: `s-${item.id}`, time: item.startTime, node: <ScheduleItem item={item} /> })),
    ...day.reservations.map((item) => ({ key: `b-${item.id}`, time: timeFromDateTime(item.startAt), node: <ReservationItem item={item} /> })),
    ...day.records.map((item) => ({ key: `r-${item.id}`, time: item.time, node: <RecordItem item={item} /> })),
    ...day.transports.map((item) => ({ key: `t-${item.id}`, time: item.departureTime, node: <TransportItem item={item} /> })),
  ].sort((a, b) => (!a.time ? 1 : !b.time ? -1 : a.time.localeCompare(b.time)));
  const route = day.transports.length ? [day.transports[0].departurePlace, ...day.transports.map((item) => item.arrivalPlace)].join(" → ") : "";
  return <div><div className="flex items-baseline justify-between gap-4"><h3 className="font-bold">{formatDate(day.date)}</h3>{day.expenseTotal > 0 && <p className="text-sm tabular-nums text-stone-500">支出 {yen(day.expenseTotal)}</p>}</div>{route && <p className="mt-2 break-words text-sm font-medium text-teal-800">{route}</p>}{items.length === 0 ? <Empty>この日の情報はまだありません</Empty> : <ol className="relative mt-4 space-y-3 before:absolute before:bottom-6 before:left-[23px] before:top-6 before:w-px before:bg-stone-200">{items.map((item) => <li key={item.key} className="relative">{item.node}</li>)}</ol>}</div>;
}

function ScheduleItem({ item }: { item: Schedule }) { return <TimelineItem icon={<CalendarIcon />} tone="teal" label="予定" time={item.startTime || "時刻なし"} title={item.title}><DetailLine label="場所" value={item.place} /><DetailLine label="終了" value={item.endTime} />{item.memo && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">{item.memo}</p>}</TimelineItem>; }
function ReservationItem({ item }: { item: Reservation }) { return <TimelineItem icon={<TicketIcon />} tone="amber" label="予約" time={timeFromDateTime(item.startAt) || "時刻なし"} title={item.name}><DetailLine label="種別" value={item.type} /><DetailLine label="予約先" value={item.provider} /><DetailLine label="金額" value={item.amount === null ? "" : yen(item.amount)} />{item.memo && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">{item.memo}</p>}</TimelineItem>; }
function TransportItem({ item }: { item: Transport }) { return <TimelineItem icon={<TrainIcon />} tone="teal" label="移動" time={item.departureTime} title={`${item.departurePlace} → ${item.arrivalPlace}`}><DetailLine label="手段" value={`${TRANSPORT_MODE_LABELS[item.mode]} ${item.serviceName}`} /><DetailLine label="到着" value={item.arrivalTime} /><DetailLine label="所要時間" value={formatDuration(transportDurationMinutes(item))} /><DetailLine label="座席" value={[item.carNumber, item.seatNumber].filter(Boolean).join(" ")} /></TimelineItem>; }
function RecordItem({ item }: { item: TripRecord }) {
  const isExpense = item.amount !== null;
  const { hasPhoto } = useRecordPhoto(item.id);
  const label = isExpense ? "支出" : item.type === "メモ" ? "メモ" : "記録";
  if (hasPhoto) return <article className="overflow-hidden rounded-xl border border-stone-200 bg-white"><div className="flex min-h-12 items-center gap-2 px-4 text-xs text-stone-500"><span className="font-bold text-teal-800">{label}</span><span>・</span><span className="tabular-nums">{item.time || "時刻なし"}</span></div><div className="px-3"><RecordPhotoViewer recordId={item.id} alt={`${item.title}の記録写真`} /></div><div className="px-4 pb-4 pt-3"><h4 className="break-words font-bold">{item.title}</h4><DetailLine label="場所" value={item.place} />{item.memo && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600">{item.memo}</p>}</div></article>;
  return <TimelineItem icon={isExpense ? <WalletIcon /> : <NoteIcon />} tone={isExpense ? "rose" : "stone"} label={label} time={item.time || "時刻なし"} title={item.title}><DetailLine label="場所" value={item.place} /><DetailLine label="金額" value={item.amount === null ? "" : yen(item.amount)} /><DetailLine label="カテゴリー" value={item.expenseCategory} />{item.memo && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">{item.memo}</p>}</TimelineItem>;
}

const tones = { teal: "bg-teal-100 text-teal-800", amber: "bg-amber-100 text-amber-800", rose: "bg-rose-100 text-rose-800", stone: "bg-stone-200 text-stone-700" };
function TimelineItem({ icon, tone, label, time, title, children }: { icon: ReactNode; tone: keyof typeof tones; label: string; time: string; title: string; children: ReactNode }) { return <details className="group rounded-xl border border-stone-200 bg-stone-50 open:bg-white"><summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-2 marker:hidden"><span className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full ${tones[tone]}`} aria-hidden="true">{icon}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-xs text-stone-500"><span>{label}</span><span>·</span><span className="tabular-nums">{time}</span></span><span className="mt-0.5 block truncate font-bold">{title}</span></span><span className="text-xl text-stone-400 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary><div className="border-t border-stone-100 px-4 py-4 pl-[4.75rem]">{children || <p className="text-sm text-stone-500">追加の詳細はありません</p>}</div></details>; }
function DetailLine({ label, value }: { label: string; value: string }) { return value ? <p className="mt-1 text-sm"><span className="mr-3 text-stone-400">{label}</span>{value}</p> : null; }

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-2xl bg-white p-4"><dt className="flex items-center gap-2 text-xs font-bold text-stone-500"><span className="text-teal-700" aria-hidden="true">{icon}</span>{label}</dt><dd className="mt-3 break-all text-xl font-bold tabular-nums sm:text-2xl">{value}</dd></div>; }
function SectionHeading({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) { return <div><p className="text-[0.65rem] font-bold tracking-[0.2em] text-teal-700">{eyebrow}</p><h2 id={id} className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{children}</h2></div>; }
function Missing() { return <section className="py-10"><h1 className="text-xl font-bold">旅行が見つかりません</h1><p className="mt-2 text-sm text-stone-500">削除されたか、URLが正しくない可能性があります。</p><Link href="/" className="mt-5 inline-flex min-h-12 items-center text-sm font-bold text-teal-800 hover:underline">← 旅行一覧に戻る</Link></section>; }
function Empty({ children }: { children: ReactNode }) { return <p className="py-7 text-sm text-stone-500">{children}</p>; }
function yen(amount: number) { return `${new Intl.NumberFormat("ja-JP").format(amount)}円`; }
function timeFromDateTime(value: string) { return value.includes("T") ? value.slice(11, 16) : ""; }
function shortDate(value: string) { const [, month, day] = value.split("-"); return `${Number(month)}/${Number(day)}`; }
function formatDate(value: string) { const [year, month, day] = value.split("-").map(Number); const date = new Date(year, month - 1, day); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(date) : value; }
function mainTransportModes(items: Transport[]) { const counts = new Map<string, number>(); for (const item of items) counts.set(TRANSPORT_MODE_LABELS[item.mode], (counts.get(TRANSPORT_MODE_LABELS[item.mode]) ?? 0) + 1); return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label]) => label).join("・"); }

const iconClass = "size-5";
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /><path d="M8 13h3v3H8z" /></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M4 6h14a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h11" /><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></svg>; }
function TicketIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" /><path d="M12 7v2m0 2v2m0 2v2" /></svg>; }
function NoteIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M5 3h11l3 3v15H5V3Z" /><path d="M8 10h8M8 14h8M8 18h5" /></svg>; }
function PhotoIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m5 17 4-4 3 3 2-2 5 3" /></svg>; }
function TrainIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M8 7h8M8 13h.01M16 13h.01M8 18l-2 3m10-3 2 3"/></svg>; }
