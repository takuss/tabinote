"use client";

import Link from "next/link";
import BackupManager from "@/app/components/backup-manager";
import CoverPhotoImage from "@/app/components/cover-photo-image";
import { EmptyState, StatusBadge, primaryButtonClass } from "@/app/components/ui";
import { getTripDuration } from "@/app/lib/trip-summary";
import { formatTripDateRange, getTripStatus } from "@/app/lib/trips";
import { useTrips } from "@/app/lib/use-trips";

export default function Home() {
  const { trips, isLoaded } = useTrips();
  return <main className="min-h-screen bg-stone-100 text-stone-900">
    <header className="bg-white"><div className="mx-auto max-w-5xl px-4 py-5 sm:px-6"><p className="text-xs font-bold tracking-[0.18em] text-teal-700">YOUR TRIPS</p><div className="mt-1 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">旅ノート</h1><p className="mt-1 text-sm text-stone-500">旅の予定と思い出を、ひとつに。</p></div><Link href="/trips/new" className={`${primaryButtonClass} shrink-0`}><span aria-hidden="true" className="mr-1 text-lg">＋</span>新しい旅行</Link></div></div></header>
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {!isLoaded ? <p className="py-12 text-center text-sm text-stone-500">旅行を読み込んでいます…</p> : trips.length === 0 ? <div className="rounded-2xl bg-white px-5"><EmptyState title="最初の旅を記録しましょう" description="旅行を作ると、予定・予約・支出・思い出をまとめられます。" action={<Link href="/trips/new" className={primaryButtonClass}>旅行を作る</Link>} /></div> : <>
        <div className="mb-4 flex items-baseline justify-between"><h2 className="text-lg font-bold">あなたの旅行</h2><p className="text-xs text-stone-400">{trips.length}件</p></div>
        <ol className="grid gap-5 sm:grid-cols-2">{trips.map((trip, index) => {
          const status = getTripStatus(trip);
          const duration = getTripDuration(trip.startDate, trip.endDate);
          return <li key={trip.id}><Link href={`/trips/${trip.id}`} className="group block overflow-hidden rounded-2xl bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><article>
            <div className="relative flex aspect-[16/8] flex-col justify-between overflow-hidden bg-teal-800 p-5 text-white">
              <CoverPhotoImage tripId={trip.id} alt={`${trip.title}の表紙写真`} />
              <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
              <div className="absolute -right-10 -top-12 size-40 rounded-full border-[24px] border-white/10" aria-hidden="true" />
              <p className="relative text-xs font-bold tracking-widest text-white/70">TRIP {String(index + 1).padStart(2, "0")}</p>
              <div className="relative min-w-0"><h3 className="line-clamp-2 text-xl font-bold leading-tight sm:text-2xl">{trip.title}</h3><p className="mt-2 truncate text-sm text-white/75">{formatTripDateRange(trip.startDate, trip.endDate)}</p></div>
            </div>
            <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{trip.destination}</p><p className="mt-1 text-sm text-stone-500">{duration.days}日間</p></div><StatusBadge className={status.className}>{status.label}</StatusBadge></div><p className="mt-4 text-sm font-bold text-teal-700 group-hover:underline">旅行を開く <span aria-hidden="true">→</span></p></div>
          </article></Link></li>;
        })}</ol>
      </>}
      <BackupManager />
    </div>
  </main>;
}
