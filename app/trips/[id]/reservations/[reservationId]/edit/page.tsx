"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReservationForm from "@/app/components/reservation-form";
import { useReservations } from "@/app/lib/use-reservations";
import { useTrips } from "@/app/lib/use-trips";

export default function EditReservationPage() {
  const { id, reservationId } = useParams<{ id: string; reservationId: string }>();
  const { trips, isLoaded: tripsLoaded } = useTrips();
  const { reservations, isLoaded: reservationsLoaded } = useReservations(id);
  const trip = trips.find((item) => item.id === id);
  const reservation = reservations.find((item) => item.id === reservationId);
  const loaded = tripsLoaded && reservationsLoaded;
  return <main className="min-h-screen bg-stone-50 text-stone-900"><header className="border-b border-stone-300 bg-white"><div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6"><Link href="/" className="text-lg font-bold">旅ノート</Link></div></header><div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">{!loaded ? <p className="text-sm text-stone-500">予約情報を読み込んでいます…</p> : !trip || !reservation ? <section><h1 className="text-xl font-bold">旅行または予約情報が見つかりません</h1><p className="mt-2 text-sm text-stone-500">削除されたか、URLが正しくない可能性があります。</p><Link href={trip ? `/trips/${trip.id}` : "/"} className="mt-5 inline-flex text-sm font-bold text-teal-800">← 戻る</Link></section> : <><div className="border-b border-stone-300 pb-4"><Link href={`/trips/${trip.id}`} className="text-sm font-medium text-teal-800 hover:underline">← 旅行詳細に戻る</Link><h1 className="mt-4 text-xl font-bold sm:text-2xl">予約情報を編集する</h1><p className="mt-1 text-sm text-stone-500">{reservation.name}</p></div><ReservationForm trip={trip} reservation={reservation} /></>}</div></main>;
}
