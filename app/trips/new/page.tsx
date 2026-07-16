"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveTrip, type Trip } from "@/app/lib/trips";

type FormErrors = Partial<Record<"title" | "destination" | "startDate" | "endDate" | "storage", string>>;

const inputClassName =
  "mt-2 min-h-11 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

export default function NewTripPage() {
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

    const trip: Trip = {
      id: globalThis.crypto.randomUUID(),
      title,
      destination,
      startDate,
      endDate,
      memo,
      createdAt: new Date().toISOString(),
    };

    try {
      saveTrip(trip);
      router.push("/");
    } catch {
      setErrors({ storage: "旅行を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            旅ノート
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="border-b border-stone-300 pb-4">
          <Link href="/" className="text-sm font-medium text-teal-800 hover:underline">
            ← 旅行一覧に戻る
          </Link>
          <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">新しい旅行を作る</h1>
          <p className="mt-1 text-sm text-stone-500">まずは旅行の基本情報を記録します。</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-6">
          {errors.storage && (
            <p role="alert" className="border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
              {errors.storage}
            </p>
          )}

          <Field label="旅行タイトル" required error={errors.title} htmlFor="title">
            <input
              id="title"
              name="title"
              type="text"
              autoComplete="off"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              placeholder="例：京都の寺社をめぐる旅"
              className={inputClassName}
            />
          </Field>

          <Field label="行き先" required error={errors.destination} htmlFor="destination">
            <input
              id="destination"
              name="destination"
              type="text"
              autoComplete="off"
              aria-invalid={Boolean(errors.destination)}
              aria-describedby={errors.destination ? "destination-error" : undefined}
              placeholder="例：京都府京都市"
              className={inputClassName}
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="開始日" required error={errors.startDate} htmlFor="startDate">
              <input
                id="startDate"
                name="startDate"
                type="date"
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={errors.startDate ? "startDate-error" : undefined}
                className={inputClassName}
              />
            </Field>
            <Field label="終了日" required error={errors.endDate} htmlFor="endDate">
              <input
                id="endDate"
                name="endDate"
                type="date"
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={errors.endDate ? "endDate-error" : undefined}
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label="メモ" htmlFor="memo">
            <textarea
              id="memo"
              name="memo"
              rows={5}
              placeholder="行きたい場所や、旅の目的など"
              className={`${inputClassName} resize-y`}
            />
          </Field>

          <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-stone-300 bg-stone-50/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
            <Link
              href="/"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="min-h-11 flex-[2] rounded bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:flex-none"
            >
              旅行を保存する
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  required = false,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">
        {label}
        {required && <span className="ml-2 text-xs font-normal text-red-700">必須</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
