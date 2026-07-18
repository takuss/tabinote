"use client";

import { useRef, useState, type FormEvent } from "react";
import { createScheduleId, saveSchedule, type Schedule } from "@/app/lib/schedules";
import { formatTripDate, type Trip } from "@/app/lib/trips";

type Errors = Partial<Record<"date" | "startTime" | "endTime" | "place" | "storage", string>>;

const inputClass =
  "mt-2 min-h-12 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

function getInitialValues(trip: Trip) {
  const now = new Date();
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    date: localDate >= trip.startDate && localDate <= trip.endDate ? localDate : trip.startDate,
    startTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
}

function getTripDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const current = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  while (current <= end) {
    dates.push(
      [current.getFullYear(), String(current.getMonth() + 1).padStart(2, "0"), String(current.getDate()).padStart(2, "0")].join("-"),
    );
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function QuickScheduleForm({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [errors, setErrors] = useState<Errors>({});
  const [initialValues] = useState(() => getInitialValues(trip));
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const tripDates = getTripDates(trip.startDate, trip.endDate);

  function cancel() {
    setErrors({});
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get("quickDate") ?? "");
    const startTime = String(data.get("quickStartTime") ?? "");
    const endTime = String(data.get("quickEndTime") ?? "");
    const place = String(data.get("quickPlace") ?? "").trim();
    const memo = String(data.get("quickMemo") ?? "").trim();
    const nextErrors: Errors = {};

    if (!date || date < trip.startDate || date > trip.endDate) nextErrors.date = "旅行期間内の日付を選択してください。";
    if (!startTime) nextErrors.startTime = "開始時刻を選択してください。";
    if (startTime && endTime && endTime < startTime) nextErrors.endTime = "終了時刻は開始時刻以降を選択してください。";
    if (!place) nextErrors.place = "場所を入力してください。";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const schedule: Schedule = {
      id: createScheduleId(),
      tripId: trip.id,
      date,
      startTime,
      endTime,
      title: place,
      place,
      memo,
      type: "その他",
      createdAt: now,
      updatedAt: now,
    };

    try {
      submitLock.current = true; setSubmitting(true);
      saveSchedule(schedule);
      setErrors({});
      onClose();
    } catch { submitLock.current = false; setSubmitting(false);
      setErrors({ storage: "予定を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">予定のクイック追加</h3>
        <span className="text-xs text-stone-500">必須項目は3つだけ</span>
      </div>
      {errors.storage && <p role="alert" className="mt-4 border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{errors.storage}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="日付" error={errors.date} htmlFor="quickDate">
          <select id="quickDate" name="quickDate" defaultValue={initialValues.date} aria-invalid={Boolean(errors.date)} className={inputClass}>
            {tripDates.map((date) => <option key={date} value={date}>{formatTripDate(date)}</option>)}
          </select>
        </Field>
        <Field label="開始時刻" error={errors.startTime} htmlFor="quickStartTime">
          <input id="quickStartTime" name="quickStartTime" type="time" defaultValue={initialValues.startTime} aria-invalid={Boolean(errors.startTime)} className={inputClass} />
        </Field>
        <Field label="終了時刻" optional error={errors.endTime} htmlFor="quickEndTime">
          <input id="quickEndTime" name="quickEndTime" type="time" aria-invalid={Boolean(errors.endTime)} className={inputClass} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="場所" error={errors.place} htmlFor="quickPlace">
          <input id="quickPlace" name="quickPlace" type="text" placeholder="例：清水寺" autoFocus aria-invalid={Boolean(errors.place)} className={inputClass} />
        </Field>
        <Field label="メモ" optional htmlFor="quickMemo">
          <input id="quickMemo" name="quickMemo" type="text" placeholder="予約情報や補足など" className={inputClass} />
        </Field>
      </div>

      <div className="mt-5 flex gap-3 sm:justify-end">
        <button type="button" onClick={cancel} className="min-h-12 flex-1 rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none">キャンセル</button>
        <button type="submit" disabled={submitting} aria-busy={submitting} className="min-h-12 flex-[2] rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60 sm:flex-none">{submitting ? "保存中…" : "保存する"}</button>
      </div>
    </form>
  );
}

function Field({ label, optional = false, error, htmlFor, children }: { label: string; optional?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">{label}<span className={`ml-2 text-xs font-normal ${optional ? "text-stone-500" : "text-red-700"}`}>{optional ? "任意" : "必須"}</span></label>{children}{error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}</div>;
}
