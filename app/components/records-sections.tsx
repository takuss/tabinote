"use client";
import Link from "next/link";
import { useMemo } from "react";
import { deleteRecord, sortRecords, summarizeExpenses, type TripRecord } from "@/app/lib/records";
import { useRecords } from "@/app/lib/use-records";
import { formatTripDate } from "@/app/lib/trips";
import type { Trip } from "@/app/lib/trips";
import { AppCard, EmptyState, SectionHeader } from "@/app/components/ui";
import { deleteRecordPhoto } from "@/app/lib/record-photo-storage";
import { RecordPhotoThumbnail } from "@/app/components/record-photo-media";

export default function RecordsSections({ trip }: { trip: Trip }) {
  const tripId = trip.id;
  const { records, isLoaded } = useRecords(tripId);
  const summary = useMemo(() => summarizeExpenses(records), [records]);
  async function remove(record: TripRecord) {
    if (!window.confirm(`記録「${record.title}」を削除しますか？`)) return;
    if (deleteRecord(record.id)) {
      try { await deleteRecordPhoto(record.id); } catch { /* 写真機能の失敗で記録削除を止めない */ }
    }
  }
  return <>
    <section aria-labelledby="records-heading" className="mt-5"><AppCard>
      <SectionHeader id="records-heading" title="記録" count={records.length} href={`/trips/${tripId}/records/new`} />
      {!isLoaded ? <Empty>記録を読み込んでいます…</Empty> : records.length === 0 ? <EmptyState title="記録はまだありません" description="旅先での出来事やメモを残せます。" /> : <RecordList tripId={tripId} records={records} onDelete={remove} />}</AppCard>
    </section>
    <section aria-labelledby="expenses-heading" className="mt-5"><AppCard>
      <SectionHeader id="expenses-heading" title="その他の費用" count={summary.count} href={`/trips/${tripId}/records/new`} />
      {!isLoaded ? <Empty>その他の費用を読み込んでいます…</Empty> : summary.count === 0 ? <EmptyState title="その他の費用はまだありません" description="予約金額や移動運賃以外で、残しておきたい費用だけを追加できます。" /> : <div className="py-5"><p className="text-sm text-stone-500">その他の費用・登録分</p><p className="mt-1 break-all text-2xl font-bold tabular-nums">{yen(summary.total)}</p><dl className="mt-5 divide-y divide-stone-100">{summary.byCategory.map(({ category, amount }) => <div key={category} className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="min-w-0 break-words">{category}</dt><dd className="shrink-0 font-medium tabular-nums">{yen(amount)}</dd></div>)}</dl></div>}</AppCard>
    </section>
  </>;
}

function RecordList({ tripId, records, onDelete }: { tripId: string; records: TripRecord[]; onDelete: (record: TripRecord) => void | Promise<void> }) {
  const grouped = useMemo(
    () => Map.groupBy(sortRecords(records), (record) => record.date),
    [records],
  );
  return <div className="divide-y divide-stone-200">{Array.from(grouped, ([date, items]) => <section key={date} className="py-5"><h3 className="text-sm font-bold">{formatTripDate(date)}</h3><ol className="mt-2 divide-y divide-stone-100">{items.map((record) => <li key={record.id} className="grid grid-cols-[4.5rem_1fr] gap-3 py-4 sm:grid-cols-[7rem_1fr_auto] sm:gap-5"><p className="text-sm tabular-nums text-stone-600">{record.time || "時刻なし"}</p><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="break-words font-bold">{record.title}</h4><span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{record.type}</span></div><RecordPhotoThumbnail recordId={record.id} alt={`${record.title}の記録写真`} />{record.place && <p className="mt-1 break-words text-sm text-stone-600">{record.place}</p>}{record.memo && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-500">{record.memo}</p>}{record.amount !== null && <p className="mt-2 break-words text-sm font-bold">{yen(record.amount)} <span className="font-normal text-stone-500">{record.expenseCategory}{record.paymentMethod ? `・${record.paymentMethod}` : ""}</span></p>}</div><div className="col-start-2 flex gap-3 text-sm sm:col-start-3 sm:row-start-1"><Link href={`/trips/${tripId}/records/${record.id}/edit`} className="inline-flex min-h-12 items-center font-medium text-teal-800 hover:underline">編集</Link><button type="button" onClick={() => void onDelete(record)} className="inline-flex min-h-12 items-center font-medium text-stone-500 hover:text-red-700">削除</button></div></li>)}</ol></section>)}</div>;
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="py-7 text-sm text-stone-500">{children}</p>; }
function yen(amount: number) { return `${new Intl.NumberFormat("ja-JP").format(amount)}円`; }
