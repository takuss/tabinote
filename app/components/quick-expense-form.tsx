"use client";

import { useRef, useState, type FormEvent } from "react";
import { createRecordId, saveRecord, type ExpenseCategory, type RecordType, type TripRecord } from "@/app/lib/records";
import type { Trip } from "@/app/lib/trips";
import { getQuickInitialDate } from "@/app/lib/quick-form-defaults";

const QUICK_CATEGORIES = ["食事", "交通", "宿泊", "観光", "買い物", "その他"] as const;
type QuickCategory = (typeof QUICK_CATEGORIES)[number];
type Errors = Partial<Record<"amount" | "category" | "date" | "storage", string>>;

const inputClass = "mt-2 min-h-12 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

function getInitialValues(trip: Trip, preferredDate?: string) {
  const now = new Date();
  return {
    date: getQuickInitialDate(trip, preferredDate),
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
}

function toStoredCategory(category: QuickCategory): ExpenseCategory {
  return category === "観光" ? "観光・チケット" : category;
}

function toRecordType(category: QuickCategory): RecordType {
  if (category === "交通") return "移動";
  if (category === "観光") return "観光";
  return category;
}

export default function QuickExpenseForm({ trip, onClose, initialDate }: { trip: Trip; onClose: () => void; initialDate?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [initialValues] = useState(() => getInitialValues(trip, initialDate));
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<QuickCategory>("その他");
  const submitLock = useRef(false);

  function closeForm() {
    setErrors({});
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get("quickExpenseDate") ?? "");
    const time = String(data.get("quickExpenseTime") ?? initialValues.time);
    const amountText = String(data.get("quickExpenseAmount") ?? "");
    const memo = String(data.get("quickExpenseMemo") ?? "").trim();
    const amount = Number(amountText);
    const nextErrors: Errors = {};

    if (!date || date < trip.startDate || date > trip.endDate) nextErrors.date = "旅行期間内の日付を選択してください。";
    if (amountText === "" || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) nextErrors.amount = "金額を0以上の整数で入力してください。";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const timestamp = new Date().toISOString();
    const record: TripRecord = {
      id: createRecordId(),
      tripId: trip.id,
      date,
      time,
      title: `${category}の費用`,
      place: "",
      type: toRecordType(category),
      memo,
      amount,
      expenseCategory: toStoredCategory(category),
      paymentMethod: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      submitLock.current = true; setSubmitting(true);
      saveRecord(record);
      closeForm();
    } catch { submitLock.current = false; setSubmitting(false);
      setErrors({ storage: "その他の費用を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  return <form onSubmit={handleSubmit} noValidate className="quick-add-form mt-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold">その他の費用を追加</h3><span className="text-xs text-stone-500">{initialValues.time} に記録</span></div>
    <p className="mt-2 text-sm leading-6 text-stone-500">細かな買い物まで入力せず、旅全体で把握したい費用だけを残せます。</p>
    {errors.storage && <p role="alert" className="mt-4 border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{errors.storage}</p>}
    <div className="mt-4">
      <Field label="金額" error={errors.amount} htmlFor="quickExpenseAmount"><div className="relative"><input id="quickExpenseAmount" name="quickExpenseAmount" type="number" inputMode="numeric" min="0" step="1" autoFocus aria-invalid={Boolean(errors.amount)} className={`${inputClass} pr-10`} /><span className="absolute bottom-3 right-3 text-sm text-stone-500">円</span></div></Field>
    </div>
    <fieldset className="mt-4"><legend className="text-sm font-bold">カテゴリー</legend><div className="mt-2 flex flex-wrap gap-2">{QUICK_CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-12 rounded-full px-4 text-sm font-bold ${category === item ? "bg-teal-700 text-white" : "bg-white text-stone-700"}`}>{item}</button>)}</div></fieldset>
    <details className="mt-4 rounded-xl bg-white px-3"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-teal-800"><span>{formatShortDate(initialValues.date)} {initialValues.time}・{category}</span><span className="shrink-0">日時や詳細を変更</span></summary><div className="grid gap-4 pb-4 sm:grid-cols-2"><Field label="日付" optional error={errors.date} htmlFor="quickExpenseDate"><input id="quickExpenseDate" name="quickExpenseDate" type="date" min={trip.startDate} max={trip.endDate} defaultValue={initialValues.date} aria-invalid={Boolean(errors.date)} className={inputClass} /></Field><Field label="時刻" optional htmlFor="quickExpenseTime"><input id="quickExpenseTime" name="quickExpenseTime" type="time" defaultValue={initialValues.time} className={inputClass} /></Field><Field label="メモ" optional htmlFor="quickExpenseMemo"><input id="quickExpenseMemo" name="quickExpenseMemo" type="text" placeholder="例：駅前で昼食" className={inputClass} /></Field></div></details>
    <div className="mt-5 flex gap-3 sm:justify-end"><button type="button" onClick={closeForm} className="min-h-12 flex-1 rounded-xl bg-stone-100 px-4 text-sm font-bold hover:bg-stone-200 sm:flex-none">キャンセル</button><button type="submit" disabled={submitting} aria-busy={submitting} className="min-h-12 flex-[2] rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60 sm:flex-none">{submitting ? "保存中…" : "保存する"}</button></div>
  </form>;
}

function Field({ label, optional = false, error, htmlFor, children }: { label: string; optional?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">{label}<span className={`ml-2 text-xs font-normal ${optional ? "text-stone-500" : "text-red-700"}`}>{optional ? "任意" : "必須"}</span></label>{children}{error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}</div>;
}
function formatShortDate(value: string) { const [, month, day] = value.split("-").map(Number); return `${month}月${day}日`; }
