"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { loadTrips, saveTrip, updateTrip, type Trip } from "@/app/lib/trips";
import { FormActions, FormField, inputClass } from "@/app/components/ui";

type FormErrors = Partial<
  Record<"title" | "destination" | "startDate" | "endDate" | "storage", string>
>;

type TripFormProps = {
  trip?: Trip;
  cancelHref: string;
};

function createUniqueId() {
  const existingIds = new Set(loadTrips().map((trip) => trip.id));
  let id = globalThis.crypto.randomUUID();
  while (existingIds.has(id)) id = globalThis.crypto.randomUUID();
  return id;
}

export default function TripForm({ trip, cancelHref }: TripFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const destination = String(form.get("destination") ?? "").trim();
    const startDate = String(form.get("startDate") ?? "");
    const endDate = String(form.get("endDate") ?? "");
    const memo = String(form.get("memo") ?? "").trim();
    const nextErrors: FormErrors = {};

    if (!title) nextErrors.title = "旅行タイトルを入力してください。";
    if (!destination) nextErrors.destination = "行き先を入力してください。";
    if (!startDate) nextErrors.startDate = "開始日を選択してください。";
    if (!endDate) nextErrors.endDate = "終了日を選択してください。";
    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate = "終了日は開始日以降の日付を選択してください。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      submitLock.current = true; setSubmitting(true);
      if (trip) {
        const updated = updateTrip(trip.id, {
          ...trip,
          title,
          destination,
          startDate,
          endDate,
          memo,
        });
        if (!updated) {
          setErrors({ storage: "編集する旅行が見つかりませんでした。" });
          submitLock.current = false; setSubmitting(false); return;
        }
        router.push(`/trips/${trip.id}`);
      } else {
        saveTrip({
          id: createUniqueId(),
          title,
          destination,
          startDate,
          endDate,
          memo,
          createdAt: new Date().toISOString(),
        });
        router.push("/");
      }
    } catch { submitLock.current = false; setSubmitting(false);
      setErrors({ storage: "旅行を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-6">
      {errors.storage && (
        <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errors.storage}
        </p>
      )}

      <FormField label="旅行タイトル" required error={errors.title} htmlFor="title"><input id="title" name="title" type="text" defaultValue={trip?.title} autoComplete="off" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} placeholder="例：京都の寺社をめぐる旅" className={inputClass} /></FormField>

      <FormField label="行き先" required error={errors.destination} htmlFor="destination"><input id="destination" name="destination" type="text" defaultValue={trip?.destination} autoComplete="off" aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "destination-error" : undefined} placeholder="例：京都府京都市" className={inputClass} /></FormField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="開始日" required error={errors.startDate} htmlFor="startDate"><input id="startDate" name="startDate" type="date" defaultValue={trip?.startDate} aria-invalid={Boolean(errors.startDate)} aria-describedby={errors.startDate ? "startDate-error" : undefined} className={inputClass} /></FormField>
        <FormField label="終了日" required error={errors.endDate} htmlFor="endDate"><input id="endDate" name="endDate" type="date" defaultValue={trip?.endDate} aria-invalid={Boolean(errors.endDate)} aria-describedby={errors.endDate ? "endDate-error" : undefined} className={inputClass} /></FormField>
      </div>

      <FormField label="メモ" htmlFor="memo"><textarea id="memo" name="memo" rows={5} defaultValue={trip?.memo} placeholder="行きたい場所や、旅の目的など" className={`${inputClass} resize-y`} /></FormField>

      <FormActions cancelHref={cancelHref} submitting={submitting} submitLabel={trip ? "変更を保存" : "旅行を保存"} />
    </form>
  );
}
