"use client";

import Link from "next/link";
import {
  formatTripDateRange,
  getTripStatus,
} from "@/app/lib/trips";
import { useTrips } from "@/app/lib/use-trips";

export default function Home() {
  const { trips, isLoaded } = useTrips();

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            旅ノート
          </Link>
          <span className="text-xs text-stone-500">国内旅行ノート</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4 border-b border-stone-300 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">あなたの旅行</h1>
            {trips.length > 0 && (
              <p className="mt-1 text-sm text-stone-500">{trips.length}件の旅行ノート</p>
            )}
          </div>
          <Link
            href="/trips/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded bg-teal-700 px-4 text-sm font-bold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <span aria-hidden="true" className="mr-1 text-lg font-normal">
              ＋
            </span>
            新しい旅行
          </Link>
        </div>

        {!isLoaded ? (
          <p className="py-10 text-sm text-stone-500">旅行を読み込んでいます…</p>
        ) : trips.length === 0 ? (
          <section className="border-b border-stone-300 py-12 text-center" aria-label="旅行なし">
            <h2 className="text-base font-bold">まだ旅行がありません</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              最初の旅行ノートを作って、日程や行き先をまとめましょう。
            </p>
            <Link
              href="/trips/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100"
            >
              新しい旅行を作る
            </Link>
          </section>
        ) : (
          <ol className="divide-y divide-stone-300 border-b border-stone-300">
            {trips.map((trip) => {
              const status = getTripStatus(trip);

              return (
                <li key={trip.id}>
                  <Link href={`/trips/${trip.id}`} className="block py-5 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:px-2 sm:py-6">
                  <article className="grid gap-3 sm:grid-cols-[9rem_1fr_auto] sm:items-start sm:gap-6">
                    <p className="text-sm font-medium tabular-nums text-stone-600">
                      {formatTripDateRange(trip.startDate, trip.endDate)}
                    </p>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold leading-6">{trip.title}</h2>
                      <p className="mt-1 text-sm text-stone-600">{trip.destination}</p>
                      {trip.memo && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-500">
                          {trip.memo}
                        </p>
                      )}
                    </div>
                    <span
                      className={`w-fit rounded-sm border px-2 py-1 text-xs font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </article>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
