"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  createScheduleId,
  saveSchedule,
  SCHEDULE_TYPES,
  updateSchedule,
  type Schedule,
} from "@/app/lib/schedules";
import type { Trip } from "@/app/lib/trips";
import { FormActions, FormField as Field, inputClass } from "@/app/components/ui";

type Errors = Partial<
  Record<"date" | "startTime" | "endTime" | "title" | "type" | "storage", string>
>;

export default function ScheduleForm({ trip, schedule }: { trip: Trip; schedule?: Schedule }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const detailHref = `/trips/${trip.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
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
      submitLock.current = true; setSubmitting(true);
      const saved = schedule
        ? updateSchedule(schedule.id, nextSchedule)
        : (saveSchedule(nextSchedule), true);
      if (!saved) {
        setErrors({ storage: "編集する予定が見つかりませんでした。" });
        submitLock.current = false; setSubmitting(false); return;
      }
      router.push(detailHref);
    } catch { submitLock.current = false; setSubmitting(false);
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

      <FormActions cancelHref={detailHref} submitting={submitting} submitLabel={schedule ? "変更を保存" : "予定を保存"} />
    </form>
  );
}
