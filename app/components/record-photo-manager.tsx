"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { COVER_PHOTO_ACCEPT, COVER_PHOTO_MAX_FILE_SIZE, processCoverPhoto } from "@/app/lib/cover-photo-processing";
import { deleteRecordPhoto, saveRecordPhoto } from "@/app/lib/record-photo-storage";
import { useRecordPhoto } from "@/app/lib/use-record-photo";
import { primaryButtonClass, secondaryButtonClass } from "@/app/components/ui";

export default function RecordPhotoManager({ recordId, tripId, alt }: { recordId: string; tripId: string; alt: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { url, hasPhoto, isLoading, error } = useRecordPhoto(recordId);

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || busyRef.current) return;
    busyRef.current = true; setBusy(true); setMessage("");
    try { const blob = await processCoverPhoto(file); await saveRecordPhoto(recordId, tripId, blob); setMessage(hasPhoto ? "記録写真を変更しました。" : "記録写真を追加しました。"); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "記録写真を保存できませんでした。現在の写真は維持されています。"); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function remove() {
    if (busyRef.current || !window.confirm("記録写真を削除しますか？")) return;
    busyRef.current = true; setBusy(true); setMessage("");
    try { await deleteRecordPhoto(recordId); setMessage("記録写真を削除しました。"); }
    catch { setMessage("記録写真を削除できませんでした。"); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <section aria-labelledby="record-photo-heading" className="rounded-2xl bg-white p-4 sm:p-5"><h2 id="record-photo-heading" className="font-bold">記録写真</h2><p className="mt-1 text-sm text-stone-500">JPEG・PNG・WebP、{Math.round(COVER_PHOTO_MAX_FILE_SIZE / 1024 / 1024)}MB以下</p>{url && <div className="relative mt-4 aspect-[4/3] max-h-80 overflow-hidden rounded-xl bg-stone-100"><Image src={url} alt={alt} fill unoptimized className="object-cover object-center" /></div>}<div className="mt-4 flex gap-3"><button type="button" onClick={() => inputRef.current?.click()} disabled={busy || isLoading} aria-label={hasPhoto ? "記録写真を変更" : "記録写真を追加"} className={`${hasPhoto ? secondaryButtonClass : primaryButtonClass} flex-1 sm:flex-none`}>{busy ? "処理中…" : hasPhoto ? "写真を変更" : "写真を追加"}</button>{hasPhoto && <button type="button" onClick={remove} disabled={busy} aria-label="記録写真を削除" className="inline-flex min-h-12 items-center px-3 text-sm font-medium text-stone-500 hover:text-red-700">削除</button>}<input ref={inputRef} type="file" accept={COVER_PHOTO_ACCEPT} onChange={selectPhoto} aria-label="記録写真を選択" className="sr-only" /></div>{(message || error) && <p role="status" className={`mt-3 text-sm ${error ? "text-red-700" : "text-stone-600"}`}>{error ?? message}</p>}</section>;
}
