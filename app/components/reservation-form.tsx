"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  createReservationId,
  isReservationOutsideTrip,
  RESERVATION_TYPES,
  saveReservationWithExpense,
  updateReservation,
  validateReservationValues,
  type Reservation,
  type ReservationValues,
} from "@/app/lib/reservations";
import type { Trip } from "@/app/lib/trips";
import { FormActions, FormField as Field, inputClass } from "@/app/components/ui";

type FormErrors = ReturnType<typeof validateReservationValues> & { storage?: string };

export default function ReservationForm({ trip, reservation }: { trip: Trip; reservation?: Reservation }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPeriodWarning, setShowPeriodWarning] = useState(false);
  const [periodConfirmed, setPeriodConfirmed] = useState(false);
  const isSubmitting = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const detailHref = `/trips/${trip.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting.current) return;
    const data = new FormData(event.currentTarget);
    const values: ReservationValues = {
      type: String(data.get("type") ?? "") as ReservationValues["type"],
      name: String(data.get("name") ?? "").trim(),
      startAt: String(data.get("startAt") ?? ""), endAt: String(data.get("endAt") ?? ""),
      provider: String(data.get("provider") ?? "").trim(), confirmationNumber: String(data.get("confirmationNumber") ?? "").trim(),
      reservedBy: String(data.get("reservedBy") ?? "").trim(), amount: String(data.get("amount") ?? ""),
      url: String(data.get("url") ?? "").trim(), phone: String(data.get("phone") ?? "").trim(), memo: String(data.get("memo") ?? "").trim(),
    };
    const validationErrors = validateReservationValues(values);
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    const outside = isReservationOutsideTrip(values.startAt, values.endAt, trip.startDate, trip.endDate);
    if (outside && !periodConfirmed) { setShowPeriodWarning(true); return; }

    const now = new Date().toISOString();
    const next: Reservation = {
      ...values,
      id: reservation?.id ?? createReservationId(), tripId: trip.id,
      amount: values.amount === "" ? null : Number(values.amount),
      createdAt: reservation?.createdAt ?? now, updatedAt: now,
    };
    try {
      isSubmitting.current = true; setSubmitting(true);
      const saved = reservation ? updateReservation(reservation.id, next) : (saveReservationWithExpense(next, false), true);
      if (!saved) { isSubmitting.current = false; setSubmitting(false); setErrors({ storage: "編集する予約情報が見つかりませんでした。" }); return; }
      router.push(detailHref);
    } catch { isSubmitting.current = false; setSubmitting(false); setErrors({ storage: "予約情報を保存できませんでした。ブラウザの設定を確認してください。" }); }
  }

  function resetPeriodConfirmation() { setPeriodConfirmed(false); setShowPeriodWarning(false); }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-6">
      {errors.storage && <Alert>{errors.storage}</Alert>}
      {showPeriodWarning && <div className="border-l-4 border-amber-600 bg-amber-50 px-3 py-3 text-sm text-amber-900"><p>利用日時が旅行期間（{trip.startDate}〜{trip.endDate}）の外にあります。内容を確認してください。</p><label className="mt-3 flex min-h-10 items-center gap-2 font-bold"><input type="checkbox" checked={periodConfirmed} onChange={(event) => setPeriodConfirmed(event.target.checked)} className="size-4 accent-teal-700" />旅行期間外でも保存する</label></div>}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="予約種別" required error={errors.type} htmlFor="type"><select id="type" name="type" defaultValue={reservation?.type ?? "宿泊"} className={inputClass}>{RESERVATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="名称" required error={errors.name} htmlFor="name"><input id="name" name="name" defaultValue={reservation?.name} placeholder="例：京都駅前ホテル" className={inputClass} /></Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="利用開始日時" required error={errors.startAt} htmlFor="startAt"><input id="startAt" name="startAt" type="datetime-local" defaultValue={reservation?.startAt} onChange={resetPeriodConfirmation} className={inputClass} /></Field>
        <Field label="利用終了日時" error={errors.endAt} htmlFor="endAt"><input id="endAt" name="endAt" type="datetime-local" defaultValue={reservation?.endAt} onChange={resetPeriodConfirmation} className={inputClass} /></Field>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="予約先・会社名" htmlFor="provider"><input id="provider" name="provider" defaultValue={reservation?.provider} placeholder="例：楽天トラベル" className={inputClass} /></Field>
        <Field label="予約番号" htmlFor="confirmationNumber"><input id="confirmationNumber" name="confirmationNumber" defaultValue={reservation?.confirmationNumber} className={inputClass} /></Field>
        <Field label="予約者名" htmlFor="reservedBy"><input id="reservedBy" name="reservedBy" defaultValue={reservation?.reservedBy} className={inputClass} /></Field>
        <Field label="金額" error={errors.amount} htmlFor="amount"><div className="relative"><input id="amount" name="amount" type="number" inputMode="numeric" min="0" step="1" defaultValue={reservation?.amount ?? ""} className={`${inputClass} pr-10`} /><span className="absolute bottom-2.5 right-3 text-sm text-stone-500">円</span></div><p className="mt-1.5 text-xs text-stone-500">入力した金額は主な旅行費用へ自動集計されます。</p></Field>
      </div>
      <Field label="URL" error={errors.url} htmlFor="url"><input id="url" name="url" type="url" defaultValue={reservation?.url} placeholder="https://" className={inputClass} /></Field>
      <Field label="電話番号" htmlFor="phone"><input id="phone" name="phone" type="tel" defaultValue={reservation?.phone} className={inputClass} /></Field>
      <Field label="メモ" htmlFor="memo"><textarea id="memo" name="memo" rows={4} defaultValue={reservation?.memo} placeholder="キャンセル条件や受取方法など" className={`${inputClass} resize-y`} /></Field>

      <FormActions cancelHref={detailHref} submitting={submitting} submitLabel={reservation ? "変更を保存" : "予約情報を保存"} />
    </form>
  );
}

function Alert({ children }: { children: React.ReactNode }) { return <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{children}</p>; }
