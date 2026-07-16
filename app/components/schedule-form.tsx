"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createScheduleId,
  saveSchedule,
  SCHEDULE_TYPES,
  updateSchedule,
  type Schedule,
} from "@/app/lib/schedules";
import type { Trip } from "@/app/lib/trips";

type Errors = Partial<
  Record<"date" | "startTime" | "endTime" | "title" | "type" | "storage", string>
>;

const inputClass =
  "mt-2 min-h-11 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

export default function ScheduleForm({ trip, schedule }: { trip: Trip; schedule?: Schedule }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const detailHref = `/trips/${trip.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const date = String(data.get("date") ?? "");
    const startTime = String(data.get("startTime") ?? "");
    const endTime = String(data.get("endTime") ?? "");
    const title = String(data.get("title") ?? "").trim();
    const place = String(data.get("place") ?? "").trim();
    const memo = String(data.get("memo") ?? "").trim();
    const type = String(data.get("type") ?? "");
    const nextErrors: Errors = {};

    if (!date) nextErrors.date = "日付を選択してください。";
    else if (date < trip.startDate || date > trip.endDate) {
      nextErrors.date = "旅行期間内の日付を選択してください。";
    }
    if (!startTime) nextErrors.startTime = "開始時刻を選択してください。";
    if (startTime && endTime && endTime < startTime) {
      nextErrors.endTime = "終了時刻は開始時刻以降を選択してください。";
    }
    if (!title) nextErrors.title = "予定のタイトルを入力してください。";
    if (!SCHEDULE_TYPES.includes(type as (typeof SCHEDULE_TYPES)[number])) {
      nextErrors.type = "種類を選択してください。";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const nextSchedule: Schedule = {
      id: schedule?.id ?? createScheduleId(),
      tripId: trip.id,
      date,
      startTime,
      endTime,
      title,
      place,
      memo,
      type: type as Schedule["type"],
      createdAt: schedule?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      const saved = schedule
        ? updateSchedule(schedule.id, nextSchedule)
        : (saveSchedule(nextSchedule), true);
      if (!saved) {
        setErrors({ storage: "編集する予定が見つかりませんでした。" });
        return;
      }
      router.push(detailHref);
    } catch {
      setErrors({ storage: "予定を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-6">
      {errors.storage && <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{errors.storage}</p>}

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="日付" required error={errors.date} htmlFor="date">
          <input id="date" name="date" type="date" min={trip.startDate} max={trip.endDate} defaultValue={schedule?.date ?? trip.startDate} aria-invalid={Boolean(errors.date)} className={inputClass} />
        </Field>
        <Field label="開始時刻" required error={errors.startTime} htmlFor="startTime">
          <input id="startTime" name="startTime" type="time" defaultValue={schedule?.startTime} aria-invalid={Boolean(errors.startTime)} className={inputClass} />
        </Field>
        <Field label="終了時刻" error={errors.endTime} htmlFor="endTime">
          <input id="endTime" name="endTime" type="time" defaultValue={schedule?.endTime} aria-invalid={Boolean(errors.endTime)} className={inputClass} />
        </Field>
      </div>

      <Field label="タイトル" required error={errors.title} htmlFor="title">
        <input id="title" name="title" type="text" defaultValue={schedule?.title} placeholder="例：清水寺を拝観" className={inputClass} />
      </Field>
      <Field label="場所" htmlFor="place">
        <input id="place" name="place" type="text" defaultValue={schedule?.place} placeholder="例：清水寺" className={inputClass} />
      </Field>
      <Field label="種類" required error={errors.type} htmlFor="type">
        <select id="type" name="type" defaultValue={schedule?.type ?? "観光"} className={inputClass}>
          {SCHEDULE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </Field>
      <Field label="メモ" htmlFor="memo">
        <textarea id="memo" name="memo" rows={4} defaultValue={schedule?.memo} placeholder="予約情報や補足など" className={`${inputClass} resize-y`} />
      </Field>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-stone-300 bg-stone-50/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
        <Link href={detailHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none">キャンセル</Link>
        <button type="submit" className="min-h-11 flex-[2] rounded bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 sm:flex-none">{schedule ? "変更を保存する" : "予定を保存する"}</button>
      </div>
    </form>
  );
}

function Field({ label, required = false, error, htmlFor, children }: { label: string; required?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">{label}{required && <span className="ml-2 text-xs font-normal text-red-700">必須</span>}</label>{children}{error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}</div>;
}
