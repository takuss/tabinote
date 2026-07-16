"use client";
import Link from "next/link";
import { useMemo } from "react";
import { deleteRecord, sortRecords, summarizeExpenses, type TripRecord } from "@/app/lib/records";
import { useRecords } from "@/app/lib/use-records";
import { formatTripDate } from "@/app/lib/trips";

export default function RecordsSections({ tripId }: { tripId: string }) {
  const { records, isLoaded } = useRecords(tripId);
  const summary = useMemo(() => summarizeExpenses(records), [records]);
  function remove(record: TripRecord) { if (window.confirm(`記録「${record.title}」を削除しますか？`)) deleteRecord(record.id); }
  return <>
    <section aria-labelledby="records-heading" className="border-t border-stone-300 py-7">
      <SectionHeading id="records-heading" title="記録" href={`/trips/${tripId}/records/new`} />
      {!isLoaded ? <Empty>記録を読み込んでいます…</Empty> : records.length === 0 ? <Empty>まだ旅の記録がありません</Empty> : <RecordList tripId={tripId} records={records} onDelete={remove} />}
    </section>
    <section aria-labelledby="expenses-heading" className="border-t border-stone-300 py-7">
      <SectionHeading id="expenses-heading" title="支出" href={`/trips/${tripId}/records/new`} />
      {!isLoaded ? <Empty>支出を読み込んでいます…</Empty> : summary.count === 0 ? <Empty>まだ支出の記録がありません</Empty> : <div className="py-5"><p className="text-sm text-stone-500">支出合計</p><p className="mt-1 text-2xl font-bold tabular-nums">{yen(summary.total)}</p><dl className="mt-5 divide-y divide-stone-200 border-t border-stone-300">{summary.byCategory.map(({ category, amount }) => <div key={category} className="flex items-center justify-between py-3 text-sm"><dt>{category}</dt><dd className="font-medium tabular-nums">{yen(amount)}</dd></div>)}</dl></div>}
    </section>
  </>;
}

function RecordList({ tripId, records, onDelete }: { tripId: string; records: TripRecord[]; onDelete: (record: TripRecord) => void }) {
  const grouped = useMemo(
    () => Map.groupBy(sortRecords(records), (record) => record.date),
    [records],
  );
  return <div className="divide-y divide-stone-300">{Array.from(grouped, ([date, items]) => <section key={date} className="py-5"><h3 className="text-sm font-bold">{formatTripDate(date)}</h3><ol className="mt-2 divide-y divide-stone-200">{items.map((record) => <li key={record.id} className="grid grid-cols-[4.5rem_1fr] gap-3 py-4 sm:grid-cols-[7rem_1fr_auto] sm:gap-5"><p className="text-sm tabular-nums text-stone-600">{record.time || "時刻なし"}</p><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">{record.title}</h4><span className="border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{record.type}</span></div>{record.place && <p className="mt-1 text-sm text-stone-600">{record.place}</p>}{record.memo && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-500">{record.memo}</p>}{record.amount !== null && <p className="mt-2 text-sm font-bold">{yen(record.amount)} <span className="font-normal text-stone-500">{record.expenseCategory}{record.paymentMethod ? `・${record.paymentMethod}` : ""}</span></p>}</div><div className="col-start-2 flex gap-3 text-sm sm:col-start-3 sm:row-start-1"><Link href={`/trips/${tripId}/records/${record.id}/edit`} className="font-medium text-teal-800 hover:underline">編集</Link><button type="button" onClick={() => onDelete(record)} className="font-medium text-red-700 hover:underline">削除</button></div></li>)}</ol></section>)}</div>;
}
function SectionHeading({ id, title, href }: { id: string; title: string; href: string }) { return <div className="flex items-center justify-between border-b border-stone-300 pb-3"><h2 id={id} className="text-lg font-bold">{title}</h2><Link href={href} className="inline-flex min-h-10 items-center rounded bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800">記録を追加</Link></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="py-7 text-sm text-stone-500">{children}</p>; }
function yen(amount: number) { return `${new Intl.NumberFormat("ja-JP").format(amount)}円`; }
