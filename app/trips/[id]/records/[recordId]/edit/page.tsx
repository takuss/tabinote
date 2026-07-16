"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import RecordForm from "@/app/components/record-form";
import { useRecords } from "@/app/lib/use-records";
import { useTrips } from "@/app/lib/use-trips";

export default function EditRecordPage() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const { trips, isLoaded: tripsLoaded } = useTrips(); const { records, isLoaded: recordsLoaded } = useRecords(id);
  const trip = trips.find((item) => item.id === id); const record = records.find((item) => item.id === recordId); const loaded = tripsLoaded && recordsLoaded;
  return <main className="min-h-screen bg-stone-50 text-stone-900"><header className="border-b border-stone-300 bg-white"><div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6"><Link href="/" className="text-lg font-bold">旅ノート</Link></div></header><div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">{!loaded ? <p className="text-sm text-stone-500">記録を読み込んでいます…</p> : !trip || !record ? <section><h1 className="text-xl font-bold">旅行または記録が見つかりません</h1><p className="mt-2 text-sm text-stone-500">削除されたか、URLが正しくない可能性があります。</p><Link href={trip ? `/trips/${trip.id}` : "/"} className="mt-5 inline-flex text-sm font-bold text-teal-800">← 戻る</Link></section> : <><div className="border-b border-stone-300 pb-4"><Link href={`/trips/${trip.id}`} className="text-sm font-medium text-teal-800 hover:underline">← 旅行詳細に戻る</Link><h1 className="mt-4 text-xl font-bold sm:text-2xl">旅の記録を編集する</h1><p className="mt-1 text-sm text-stone-500">{record.title}</p></div><RecordForm trip={trip} record={record} /></>}</div></main>;
}
