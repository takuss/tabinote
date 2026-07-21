"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createRecordId, deleteRecord, saveRecord, type TripRecord } from "@/app/lib/records";
import { COVER_PHOTO_ACCEPT, COVER_PHOTO_MAX_FILE_SIZE, processCoverPhoto, validatePhotoFile } from "@/app/lib/cover-photo-processing";
import { saveRecordPhoto } from "@/app/lib/record-photo-storage";
import type { Trip } from "@/app/lib/trips";
import { inputClass } from "@/app/components/ui";
import { getQuickInitialDate } from "@/app/lib/quick-form-defaults";

type Errors = Partial<Record<"content" | "date" | "photo" | "storage", string>>;

function initialValues(trip: Trip, preferredDate?: string) {
  const now = new Date();
  return { date: getQuickInitialDate(trip, preferredDate), time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` };
}

export default function QuickRecordForm({ trip, onClose, initialDate }: { trip: Trip; onClose: () => void; initialDate?: string }) {
  const [initial] = useState(() => initialValues(trip, initialDate));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;
    try {
      validatePhotoFile(selected);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const nextUrl = URL.createObjectURL(selected);
      previewRef.current = nextUrl; setPreviewUrl(nextUrl); setFile(selected); setErrors((current) => ({ ...current, photo: undefined, content: undefined }));
    } catch (caught) { setErrors((current) => ({ ...current, photo: caught instanceof Error ? caught.message : "画像を選択できませんでした。" })); }
  }

  function removeSelectedPhoto() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null; setPreviewUrl(null); setFile(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const data = new FormData(event.currentTarget);
    const date = String(data.get("quickRecordDate") ?? "");
    const time = String(data.get("quickRecordTime") ?? "");
    const text = String(data.get("quickRecordText") ?? "").trim();
    const place = String(data.get("quickRecordPlace") ?? "").trim();
    const nextErrors: Errors = {};
    if (!text && !file) nextErrors.content = "写真またはひとことを入力してください。";
    if (!date || date < trip.startDate || date > trip.endDate) nextErrors.date = "旅行期間内の日付を選択してください。";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    submitLock.current = true; setSubmitting(true); setErrors({});
    let processed: Blob | null = null;
    try {
      if (file) processed = await processCoverPhoto(file);
      const now = new Date().toISOString();
      const record: TripRecord = { id: createRecordId(), tripId: trip.id, date, time, title: text || "写真の記録", place, type: "出来事", memo: "", amount: null, expenseCategory: "", paymentMethod: "", createdAt: now, updatedAt: now };
      saveRecord(record);
      if (processed) {
        try { await saveRecordPhoto(record.id, trip.id, processed); }
        catch (error) { deleteRecord(record.id); throw error; }
      }
      onClose();
    } catch { submitLock.current = false; setSubmitting(false); setErrors((current) => ({ ...current, storage: "記録を保存できませんでした。入力内容と現在の写真は維持されています。" })); }
  }

  return <form onSubmit={handleSubmit} noValidate className="mt-4 rounded-2xl bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">写真付き記録</h3><p className="mt-1 text-sm text-stone-500">写真かひとこと、どちらかだけでも保存できます。</p></div><span className="text-xs text-stone-400">{initial.time}</span></div>
    {errors.storage && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.storage}</p>}
    <div className="mt-4">{previewUrl ? <div className="relative aspect-[4/3] max-h-72 overflow-hidden rounded-xl bg-stone-100"><Image src={previewUrl} alt="選択した記録写真のプレビュー" fill unoptimized className="object-cover object-center" /><button type="button" onClick={removeSelectedPhoto} aria-label="選択した写真を外す" className="absolute right-2 top-2 inline-flex min-h-12 items-center rounded-full bg-black/60 px-4 text-sm font-bold text-white">写真を外す</button></div> : <label className="flex min-h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 text-center text-sm font-bold text-teal-700 hover:bg-stone-100"><input type="file" accept={COVER_PHOTO_ACCEPT} onChange={selectPhoto} className="sr-only" aria-label="記録写真を選択" />＋ 写真を選ぶ</label>}<p className="mt-1.5 text-xs text-stone-400">JPEG・PNG・WebP、{Math.round(COVER_PHOTO_MAX_FILE_SIZE / 1024 / 1024)}MB以下</p>{errors.photo && <p role="alert" className="mt-1.5 text-sm text-red-700">{errors.photo}</p>}</div>
    <div className="mt-4"><label htmlFor="quickRecordText" className="text-sm font-bold">ひとこと <span className="font-normal text-stone-400">任意</span></label><textarea id="quickRecordText" name="quickRecordText" rows={3} placeholder="旅先での出来事や感想" className={`${inputClass} resize-y`} />{errors.content && <p role="alert" className="mt-1.5 text-sm text-red-700">{errors.content}</p>}</div>
    <div className="mt-4 grid gap-4 sm:grid-cols-3"><div><label htmlFor="quickRecordDate" className="text-sm font-bold">日付</label><input id="quickRecordDate" name="quickRecordDate" type="date" min={trip.startDate} max={trip.endDate} defaultValue={initial.date} className={inputClass} />{errors.date && <p role="alert" className="mt-1.5 text-sm text-red-700">{errors.date}</p>}</div><div><label htmlFor="quickRecordTime" className="text-sm font-bold">時刻</label><input id="quickRecordTime" name="quickRecordTime" type="time" defaultValue={initial.time} className={inputClass} /></div><div><label htmlFor="quickRecordPlace" className="text-sm font-bold">場所 <span className="font-normal text-stone-400">任意</span></label><input id="quickRecordPlace" name="quickRecordPlace" type="text" placeholder="例：金沢駅" className={inputClass} /></div></div>
    <div className="mt-5 flex gap-3 sm:justify-end"><button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl bg-stone-100 px-4 text-sm font-bold hover:bg-stone-200 sm:flex-none">キャンセル</button><button type="submit" disabled={submitting} aria-busy={submitting} className="min-h-12 flex-[2] rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60 sm:flex-none">{submitting ? "保存中…" : "記録を保存"}</button></div>
  </form>;
}
