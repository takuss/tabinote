"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  createReservationId,
  RESERVATION_TYPES,
  saveReservationWithExpense,
  validateReservationValues,
  type Reservation,
  type ReservationType,
  type ReservationValues,
} from "@/app/lib/reservations";
import type { Trip } from "@/app/lib/trips";
import { getQuickInitialDate } from "@/app/lib/quick-form-defaults";

type Errors = ReturnType<typeof validateReservationValues> & { date?: string; storage?: string };
const inputClass = "mt-2 min-h-12 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

export default function QuickReservationForm({ trip, onClose, initialDate: preferredDate }: { trip: Trip; onClose: () => void; initialDate?: string }) {
  const [initialDate] = useState(() => getQuickInitialDate(trip, preferredDate));
  const [errors, setErrors] = useState<Errors>({});
  const [type, setType] = useState<ReservationType>("その他");
  const [hasAmount, setHasAmount] = useState(false);
  const isSubmitting = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  function closeForm() {
    setErrors({});
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting.current) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get("quickReservationDate") ?? "");
    const time = String(data.get("quickReservationTime") ?? "");
    const values: ReservationValues = {
      type,
      name: String(data.get("quickReservationName") ?? "").trim(),
      startAt: time ? `${date}T${time}` : date,
      endAt: "",
      provider: "",
      confirmationNumber: "",
      reservedBy: "",
      amount: String(data.get("quickReservationAmount") ?? ""),
      url: String(data.get("quickReservationUrl") ?? "").trim(),
      phone: "",
      memo: String(data.get("quickReservationMemo") ?? "").trim(),
    };
    const nextErrors: Errors = validateReservationValues(values);
    if (!date || date < trip.startDate || date > trip.endDate) nextErrors.date = "旅行期間内の利用日を選択してください。";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const addToExpenses = data.get("quickReservationAddToExpenses") === "on";

    const now = new Date().toISOString();
    const reservation: Reservation = {
      ...values,
      id: createReservationId(),
      tripId: trip.id,
      amount: values.amount === "" ? null : Number(values.amount),
      createdAt: now,
      updatedAt: now,
    };

    try {
      isSubmitting.current = true; setSubmitting(true);
      saveReservationWithExpense(reservation, addToExpenses);
      closeForm();
    } catch {
      isSubmitting.current = false; setSubmitting(false);
      setErrors({ storage: "予約情報を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  return <form onSubmit={handleSubmit} noValidate className="quick-add-form mt-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold">予約のクイック追加</h3><span className="text-xs text-stone-500">詳細は保存後に編集できます</span></div>
    {errors.storage && <p role="alert" className="mt-4 border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{errors.storage}</p>}
    <div className="mt-4"><Field label="予約名" error={errors.name} htmlFor="quickReservationName"><input id="quickReservationName" name="quickReservationName" type="text" autoFocus placeholder="例：京都駅前ホテル" aria-invalid={Boolean(errors.name)} className={inputClass} /></Field></div>
    <fieldset className="mt-4"><legend className="text-sm font-bold">予約種別</legend><div className="mt-2 flex flex-wrap gap-2">{RESERVATION_TYPES.map((item) => <button key={item} type="button" aria-pressed={type === item} onClick={() => setType(item)} className={`min-h-12 rounded-full px-4 text-sm font-bold ${type === item ? "bg-teal-700 text-white" : "bg-white text-stone-700"}`}>{item}</button>)}</div></fieldset>
    <details className="mt-4 rounded-xl bg-white p-3">
      <summary className="flex min-h-12 cursor-pointer items-center font-bold text-teal-800">日時や詳細を変更 <span className="ml-auto text-sm font-normal text-stone-500">{formatShortDate(initialDate)}・{type}</span></summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="利用日" error={errors.date} htmlFor="quickReservationDate"><input id="quickReservationDate" name="quickReservationDate" type="date" min={trip.startDate} max={trip.endDate} defaultValue={initialDate} aria-invalid={Boolean(errors.date)} className={inputClass} /></Field>
        <Field label="時刻" optional htmlFor="quickReservationTime"><input id="quickReservationTime" name="quickReservationTime" type="time" className={inputClass} /></Field>
        <Field label="金額" optional error={errors.amount} htmlFor="quickReservationAmount"><div className="relative"><input id="quickReservationAmount" name="quickReservationAmount" type="number" inputMode="numeric" min="0" step="1" onChange={(event) => setHasAmount(event.target.value !== "")} aria-invalid={Boolean(errors.amount)} className={`${inputClass} pr-10`} /><span className="absolute bottom-3 right-3 text-sm text-stone-500">円</span></div></Field>
        <Field label="予約URL" optional error={errors.url} htmlFor="quickReservationUrl"><input id="quickReservationUrl" name="quickReservationUrl" type="url" placeholder="https://" aria-invalid={Boolean(errors.url)} className={inputClass} /></Field>
      </div>
      <label className={`mt-4 flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-sm font-bold ${hasAmount ? "cursor-pointer border-teal-200 bg-white text-stone-800" : "border-stone-200 bg-stone-100 text-stone-400"}`}><input name="quickReservationAddToExpenses" type="checkbox" disabled={!hasAmount} className="size-5 shrink-0 accent-teal-700" /><span>この金額を支出にも追加する</span></label>
      <div className="mt-4"><Field label="メモ" optional htmlFor="quickReservationMemo"><textarea id="quickReservationMemo" name="quickReservationMemo" rows={3} placeholder="キャンセル条件など" className={`${inputClass} resize-y`} /></Field></div>
    </details>
    <div className="mt-5 flex gap-3 sm:justify-end"><button type="button" onClick={closeForm} className="min-h-12 flex-1 rounded-xl bg-stone-100 px-4 text-sm font-bold hover:bg-stone-200 sm:flex-none">キャンセル</button><button type="submit" disabled={submitting} aria-busy={submitting} className="min-h-12 flex-[2] rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60 sm:flex-none">{submitting ? "保存中…" : "保存する"}</button></div>
  </form>;
}

function formatShortDate(date: string) { const [, month, day] = date.split("-").map(Number); return `${month}月${day}日`; }

function Field({ label, optional = false, error, htmlFor, children }: { label: string; optional?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">{label}<span className={`ml-2 text-xs font-normal ${optional ? "text-stone-500" : "text-red-700"}`}>{optional ? "任意" : "必須"}</span></label>{children}{error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}</div>;
}
