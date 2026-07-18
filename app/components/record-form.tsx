"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createRecordId, EXPENSE_CATEGORIES, PAYMENT_METHODS, RECORD_TYPES, saveRecord, updateRecord, validateRecordValues, type RecordValues, type TripRecord } from "@/app/lib/records";
import type { Trip } from "@/app/lib/trips";
import { FormActions, FormField as Field, inputClass } from "@/app/components/ui";
import RecordPhotoManager from "@/app/components/record-photo-manager";

type Errors = ReturnType<typeof validateRecordValues> & { storage?: string };

export default function RecordForm({ trip, record }: { trip: Trip; record?: TripRecord }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [hasAmount, setHasAmount] = useState(record?.amount !== null && record?.amount !== undefined);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const detailHref = `/trips/${trip.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitLock.current) return; const data = new FormData(event.currentTarget);
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
    try { submitLock.current = true; setSubmitting(true);
      const saved = record ? updateRecord(record.id, next) : (saveRecord(next), true);
      if (!saved) { submitLock.current = false; setSubmitting(false); setErrors({ storage: "編集する記録が見つかりませんでした。" }); return; }
      router.push(detailHref);
    } catch { submitLock.current = false; setSubmitting(false); setErrors({ storage: "記録を保存できませんでした。ブラウザの設定を確認してください。" }); }
  }

  return <>{record && <div className="pt-6"><RecordPhotoManager recordId={record.id} tripId={trip.id} alt={`${record.title}の記録写真`} /></div>}<form onSubmit={handleSubmit} noValidate className="space-y-6 pt-6">
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
    <FormActions cancelHref={detailHref} submitting={submitting} submitLabel={record ? "変更を保存" : "記録を保存"} />
  </form></>;
}
