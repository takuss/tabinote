"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { loadTrips, saveTrip, updateTrip, type Trip } from "@/app/lib/trips";
import { FormActions, FormField, inputClass } from "@/app/components/ui";

type Errors = Partial<Record<"title" | "startDate" | "endDate" | "storage", string>>;

export default function TripForm({ trip, cancelHref }: { trip?: Trip; cancelHref: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(trip?.startDate ?? "");
  const [endDate, setEndDate] = useState(trip?.endDate ?? "");
  const endEdited = useRef(Boolean(trip));
  const lock = useRef(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const destination = String(form.get("destination") ?? "").trim();
    const memo = String(form.get("memo") ?? "").trim();
    const next: Errors = {};
    if (!title) next.title = "旅行名を入力してください。";
    if (!startDate) next.startDate = "開始日を選択してください。";
    if (!endDate) next.endDate = "終了日を選択してください。";
    if (startDate && endDate && endDate < startDate) next.endDate = "終了日は開始日以降を選択してください。";
    if (Object.keys(next).length) { setErrors(next); return; }

    lock.current = true;
    setSubmitting(true);
    try {
      if (trip) {
        if (!updateTrip(trip.id, { ...trip, title, destination, startDate, endDate, memo })) throw new Error();
        router.push(`/trips/${trip.id}`);
      } else {
        saveTrip({ id: uniqueId(), title, destination, startDate, endDate, memo, createdAt: new Date().toISOString() });
        router.push("/");
      }
    } catch {
      lock.current = false;
      setSubmitting(false);
      setErrors({ storage: "旅行を保存できませんでした。入力内容は維持されています。" });
    }
  }

  return <form onSubmit={submit} noValidate className="space-y-6 pt-6">
    {errors.storage && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.storage}</p>}
    <FormField label="旅行名" required error={errors.title} htmlFor="title"><input id="title" name="title" defaultValue={trip?.title} autoFocus placeholder="例：京都の寺社をめぐる旅" className={inputClass} /></FormField>
    <FormField label="開始日" required error={errors.startDate} htmlFor="startDate"><input id="startDate" name="startDate" type="date" value={startDate} onChange={(event) => { const value = event.target.value; setStartDate(value); if (!endEdited.current) setEndDate(value); }} className={inputClass} /></FormField>
    <details open={trip ? true : undefined} className="rounded-2xl bg-white px-4">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-bold text-teal-800">旅行の詳細を追加<span aria-hidden="true">⌄</span></summary>
      <div className="space-y-5 pb-5">
        <FormField label="終了日" error={errors.endDate} htmlFor="endDate"><input id="endDate" name="endDate" type="date" min={startDate || undefined} value={endDate} onChange={(event) => { endEdited.current = true; setEndDate(event.target.value); }} className={inputClass} /></FormField>
        <FormField label="行き先" htmlFor="destination"><input id="destination" name="destination" defaultValue={trip?.destination} placeholder="例：京都府京都市" className={inputClass} /></FormField>
        <FormField label="メモ" htmlFor="memo"><textarea id="memo" name="memo" rows={3} defaultValue={trip?.memo} className={`${inputClass} resize-y`} /></FormField>
      </div>
    </details>
    <FormActions cancelHref={cancelHref} submitting={submitting} submitLabel={trip ? "変更を保存" : "旅行を作成"} />
  </form>;
}

function uniqueId() {
  const ids = new Set(loadTrips().map((trip) => trip.id));
  let id = crypto.randomUUID();
  while (ids.has(id)) id = crypto.randomUUID();
  return id;
}
