"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loadTrips, saveTrip, updateTrip, type Trip } from "@/app/lib/trips";

type FormErrors = Partial<
  Record<"title" | "destination" | "startDate" | "endDate" | "storage", string>
>;

type TripFormProps = {
  trip?: Trip;
  cancelHref: string;
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

function createUniqueId() {
  const existingIds = new Set(loadTrips().map((trip) => trip.id));
  let id = globalThis.crypto.randomUUID();
  while (existingIds.has(id)) id = globalThis.crypto.randomUUID();
  return id;
}

export default function TripForm({ trip, cancelHref }: TripFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          return;
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
    } catch {
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

      <Field label="旅行タイトル" required error={errors.title} htmlFor="title">
        <input id="title" name="title" type="text" defaultValue={trip?.title} autoComplete="off" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} placeholder="例：京都の寺社をめぐる旅" className={inputClassName} />
      </Field>

      <Field label="行き先" required error={errors.destination} htmlFor="destination">
        <input id="destination" name="destination" type="text" defaultValue={trip?.destination} autoComplete="off" aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "destination-error" : undefined} placeholder="例：京都府京都市" className={inputClassName} />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="開始日" required error={errors.startDate} htmlFor="startDate">
          <input id="startDate" name="startDate" type="date" defaultValue={trip?.startDate} aria-invalid={Boolean(errors.startDate)} aria-describedby={errors.startDate ? "startDate-error" : undefined} className={inputClassName} />
        </Field>
        <Field label="終了日" required error={errors.endDate} htmlFor="endDate">
          <input id="endDate" name="endDate" type="date" defaultValue={trip?.endDate} aria-invalid={Boolean(errors.endDate)} aria-describedby={errors.endDate ? "endDate-error" : undefined} className={inputClassName} />
        </Field>
      </div>

      <Field label="メモ" htmlFor="memo">
        <textarea id="memo" name="memo" rows={5} defaultValue={trip?.memo} placeholder="行きたい場所や、旅の目的など" className={`${inputClassName} resize-y`} />
      </Field>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-stone-300 bg-stone-50/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
        <Link href={cancelHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none">
          キャンセル
        </Link>
        <button type="submit" className="min-h-11 flex-[2] rounded bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:flex-none">
          {trip ? "変更を保存する" : "旅行を保存する"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required = false, error, htmlFor, children }: { label: string; required?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">
        {label}
        {required && <span className="ml-2 text-xs font-normal text-red-700">必須</span>}
      </label>
      {children}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
