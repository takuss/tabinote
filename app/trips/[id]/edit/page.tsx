"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import TripForm from "@/app/components/trip-form";
import { useTrips } from "@/app/lib/use-trips";

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const { trips, isLoaded } = useTrips();
  const trip = trips.find((item) => item.id === id);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">旅ノート</Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
        {!isLoaded ? (
          <p className="text-sm text-stone-500">旅行を読み込んでいます…</p>
        ) : !trip ? (
          <section className="border-b border-stone-300 py-10">
            <h1 className="text-xl font-bold">旅行が見つかりません</h1>
            <Link href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-teal-800 hover:underline">← 旅行一覧に戻る</Link>
          </section>
        ) : (
          <>
            <div className="border-b border-stone-300 pb-4">
              <Link href={`/trips/${trip.id}`} className="text-sm font-medium text-teal-800 hover:underline">← 詳細に戻る</Link>
              <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">旅行を編集する</h1>
              <p className="mt-1 text-sm text-stone-500">{trip.title}</p>
            </div>
            <TripForm trip={trip} cancelHref={`/trips/${trip.id}`} />
          </>
        )}
      </div>
    </main>
  );
}
