"use client";

import { useState, type FormEvent } from "react";
import { createRecordId, saveRecord, type ExpenseCategory, type RecordType, type TripRecord } from "@/app/lib/records";
import type { Trip } from "@/app/lib/trips";

const QUICK_CATEGORIES = ["食事", "交通", "宿泊", "観光", "買い物", "その他"] as const;
type QuickCategory = (typeof QUICK_CATEGORIES)[number];
type Errors = Partial<Record<"amount" | "category" | "date" | "storage", string>>;

const inputClass = "mt-2 min-h-12 w-full rounded border border-stone-400 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

function getInitialValues(trip: Trip) {
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  return {
    date: today >= trip.startDate && today <= trip.endDate ? today : trip.startDate,
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

export default function QuickExpenseForm({ trip }: { trip: Trip }) {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [initialValues, setInitialValues] = useState(() => getInitialValues(trip));

  function openForm() {
    setInitialValues(getInitialValues(trip));
    setErrors({});
    setIsOpen(true);
  }

  function closeForm() {
    setErrors({});
    setIsOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const date = String(data.get("quickExpenseDate") ?? "");
    const amountText = String(data.get("quickExpenseAmount") ?? "");
    const category = String(data.get("quickExpenseCategory") ?? "") as QuickCategory;
    const memo = String(data.get("quickExpenseMemo") ?? "").trim();
    const amount = Number(amountText);
    const nextErrors: Errors = {};

    if (!date || date < trip.startDate || date > trip.endDate) nextErrors.date = "旅行期間内の日付を選択してください。";
    if (amountText === "" || !Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) nextErrors.amount = "金額を0以上の整数で入力してください。";
    if (!QUICK_CATEGORIES.includes(category)) nextErrors.category = "カテゴリーを選択してください。";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const timestamp = new Date().toISOString();
    const record: TripRecord = {
      id: createRecordId(),
      tripId: trip.id,
      date,
      time: initialValues.time,
      title: `${category}の支出`,
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
      saveRecord(record);
      closeForm();
    } catch {
      setErrors({ storage: "支出を保存できませんでした。ブラウザの設定を確認してください。" });
    }
  }

  if (!isOpen) {
    return <button type="button" onClick={openForm} aria-expanded="false" className="inline-flex min-h-11 items-center justify-center rounded bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800">＋支出</button>;
  }

  return <form onSubmit={handleSubmit} noValidate className="mt-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold">支出のクイック追加</h3><span className="text-xs text-stone-500">{initialValues.time} に記録</span></div>
    {errors.storage && <p role="alert" className="mt-4 border-l-4 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">{errors.storage}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      <Field label="金額" error={errors.amount} htmlFor="quickExpenseAmount"><div className="relative"><input id="quickExpenseAmount" name="quickExpenseAmount" type="number" inputMode="numeric" min="0" step="1" autoFocus aria-invalid={Boolean(errors.amount)} className={`${inputClass} pr-10`} /><span className="absolute bottom-3 right-3 text-sm text-stone-500">円</span></div></Field>
      <Field label="カテゴリー" error={errors.category} htmlFor="quickExpenseCategory"><select id="quickExpenseCategory" name="quickExpenseCategory" defaultValue="" aria-invalid={Boolean(errors.category)} className={inputClass}><option value="">選択してください</option>{QUICK_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
      <Field label="日付" optional error={errors.date} htmlFor="quickExpenseDate"><input id="quickExpenseDate" name="quickExpenseDate" type="date" min={trip.startDate} max={trip.endDate} defaultValue={initialValues.date} aria-invalid={Boolean(errors.date)} className={inputClass} /></Field>
    </div>
    <div className="mt-4"><Field label="メモ" optional htmlFor="quickExpenseMemo"><input id="quickExpenseMemo" name="quickExpenseMemo" type="text" placeholder="例：駅前で昼食" className={inputClass} /></Field></div>
    <div className="mt-5 flex gap-3 sm:justify-end"><button type="button" onClick={closeForm} className="min-h-12 flex-1 rounded border border-stone-400 bg-white px-4 text-sm font-bold hover:bg-stone-100 sm:flex-none">キャンセル</button><button type="submit" className="min-h-12 flex-[2] rounded bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 sm:flex-none">保存する</button></div>
  </form>;
}

function Field({ label, optional = false, error, htmlFor, children }: { label: string; optional?: boolean; error?: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="text-sm font-bold text-stone-800">{label}<span className={`ml-2 text-xs font-normal ${optional ? "text-stone-500" : "text-red-700"}`}>{optional ? "任意" : "必須"}</span></label>{children}{error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}</div>;
}
