"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReservationForm from "@/app/components/reservation-form";
import { useTrips } from "@/app/lib/use-trips";

export default function NewReservationPage() {
  const { id } = useParams<{ id: string }>();
  const { trips, isLoaded } = useTrips();
  const trip = trips.find((item) => item.id === id);
  return <Shell>{!isLoaded ? <p className="text-sm text-stone-500">旅行を読み込んでいます…</p> : !trip ? <Missing /> : <><Heading href={`/trips/${trip.id}`} title="予約情報を追加する" subtitle={trip.title} /><ReservationForm trip={trip} /></>}</Shell>;
}
function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-stone-50 text-stone-900"><header className="border-b border-stone-300 bg-white"><div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6"><Link href="/" className="text-lg font-bold">旅ノート</Link></div></header><div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">{children}</div></main>; }
function Heading({ href, title, subtitle }: { href: string; title: string; subtitle: string }) { return <div className="border-b border-stone-300 pb-4"><Link href={href} className="text-sm font-medium text-teal-800 hover:underline">← 旅行詳細に戻る</Link><h1 className="mt-4 text-xl font-bold sm:text-2xl">{title}</h1><p className="mt-1 text-sm text-stone-500">{subtitle}</p></div>; }
function Missing() { return <section><h1 className="text-xl font-bold">旅行が見つかりません</h1><Link href="/" className="mt-5 inline-flex text-sm font-bold text-teal-800">← 旅行一覧に戻る</Link></section>; }
