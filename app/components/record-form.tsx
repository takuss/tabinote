"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createRecordId, EXPENSE_CATEGORIES, PAYMENT_METHODS, RECORD_TYPES, saveRecord, updateRecord, validateRecordValues, type RecordValues, type TripRecord } from "@/app/lib/records";
import type { Trip } from "@/app/lib/trips";

type Errors = ReturnType<typeof validateRecordValues> & { storage?: string };
const inputClass = "mt-2 min-h-11 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

export default function RecordForm({ trip, record }: { trip: Trip; record?: TripRecord }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [hasAmount, setHasAmount] = useState(record?.amount !== null && record?.amount !== undefined);
  const detailHref = `/trips/${trip.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const values: RecordValues = {
      date: String(data.get("date") ?? ""), time: String(data.get("time") ?? ""),
      title: String(data.get("title") ?? "").trim(), place: String(data.get("place") ?? "").trim(),
      type: String(data.get("type") ?? "") as RecordValues["type"], memo: String(data.get("memo") ?? "").trim(),
      amount: String(data.get("amount") ?? ""), expenseCategory: String(data.get("expenseCategory") ?? "") as RecordValues["expenseCategory"],
      paymentMethod: String(data.get("paymentMethod") ?? "") as RecordValues["paymentMethod"],
    };
    const validationErrors = validateRecordValues(values, trip.startDate, trip.endDate);
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    const now = new Date().toISOString();
    const next: TripRecord = { ...values, id: record?.id ?? createRecordId(), tripId: trip.id, amount: values.amount === "" ? null : Number(values.amount), createdAt: record?.createdAt ?? now, updatedAt: now };
    try {
      const saved = record ? updateRecord(record.id, next) : (saveRecord(next), true);
      if (!saved) { setErrors({ storage: "編集する記録が見つかりませんでした。" }); return; }
      router.push(detailHref);
    } catch { setErrors({ storage: "記録を保存できませんでした。ブラウザの設定を確認してください。" }); }
  }

  return <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-6">
    {errors.storage && <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{errors.storage}</p>}
    <div className="grid gap-6 sm:grid-cols-2">
      <Field label="日付" required error={errors.date} htmlFor="date"><input id="date" name="date" type="date" min={trip.startDate} max={trip.endDate} defaultValue={record?.date ?? trip.startDate} className={inputClass} /></Field>
      <Field label="時刻" htmlFor="time"><input id="time" name="time" type="time" defaultValue={record?.time} className={inputClass} /></Field>
    </div>
    <Field label="タイトル" required error={errors.title} htmlFor="title"><input id="title" name="title" defaultValue={record?.title} placeholder="例：市場で海鮮丼を食べた" className={inputClass} /></Field>
    <div className="grid gap-6 sm:grid-cols-2">
      <Field label="場所" htmlFor="place"><input id="place" name="place" defaultValue={record?.place} placeholder="例：近江町市場" className={inputClass} /></Field>
      <Field label="種類" required error={errors.type} htmlFor="type"><select id="type" name="type" defaultValue={record?.type ?? "出来事"} className={inputClass}>{RECORD_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
    </div>
    <Field label="メモ" htmlFor="memo"><textarea id="memo" name="memo" rows={7} defaultValue={record?.memo} placeholder="そのときの出来事や感想を自由に記録" className={`${inputClass} resize-y`} /></Field>
    <fieldset className="border-t border-stone-300 pt-5"><legend className="pr-3 text-base font-bold">支出</legend><div className="mt-1 grid gap-6 sm:grid-cols-2">
      <Field label="支出金額" error={errors.amount} htmlFor="amount"><div className="relative"><input id="amount" name="amount" type="number" inputMode="numeric" min="0" step="1" defaultValue={record?.amount ?? ""} onChange={(event) => setHasAmount(event.target.value !== "")} className={`${inputClass} pr-10`} /><span className="absolute bottom-2.5 right-3 text-sm text-stone-500">円</span></div></Field>
      <Field label="支出カテゴリ" required={hasAmount} error={errors.expenseCategory} htmlFor="expenseCategory"><select id="expenseCategory" name="expenseCategory" defaultValue={record?.expenseCategory ?? ""} className={inputClass}><option value="">選択してください</option>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
      <Field label="支払方法" htmlFor="paymentMethod"><select id="paymentMethod" name="paymentMethod" defaultValue={record?.paymentMethod ?? ""} className={inputClass}><option value="">選択しない</option>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></Field>
    </div></fieldset>
    <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-stone-300 bg-stone-50/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0"><Link href={detailHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none">キャンセル</Link><button type="submit" className="min-h-11 flex-[2] rounded bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 sm:flex-none">{record ? "変更を保存する" : "記録を保存する"}</button></div>
  </form>;
}
function Field({ label, required, error, htmlFor, children }: { label: string; required?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) { return <div><label htmlFor={htmlFor} className="text-sm font-bold">{label}{required && <span className="ml-2 text-xs font-normal text-red-700">必須</span>}</label>{children}{error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}</div>; }
