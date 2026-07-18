"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { deleteCoverPhoto, saveCoverPhoto } from "@/app/lib/cover-photo-storage";
import { COVER_PHOTO_ACCEPT, COVER_PHOTO_MAX_FILE_SIZE, processCoverPhoto } from "@/app/lib/cover-photo-processing";
import { useCoverPhoto } from "@/app/lib/use-cover-photo";
import { primaryButtonClass, secondaryButtonClass } from "@/app/components/ui";

export default function CoverPhotoManager({ tripId }: { tripId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { hasPhoto, isLoading, error } = useCoverPhoto(tripId);

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busyRef.current) return;
    busyRef.current = true; setBusy(true); setMessage("");
    try {
      const processed = await processCoverPhoto(file);
      await saveCoverPhoto(tripId, processed);
      setMessage(hasPhoto ? "表紙写真を変更しました。" : "表紙写真を追加しました。");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "表紙写真を保存できませんでした。現在の写真は維持されています。");
    } finally { busyRef.current = false; setBusy(false); }
  }

  async function removePhoto() {
    if (busyRef.current || !window.confirm("表紙写真を削除しますか？")) return;
    busyRef.current = true; setBusy(true); setMessage("");
    try { await deleteCoverPhoto(tripId); setMessage("表紙写真を削除しました。"); }
    catch { setMessage("表紙写真を削除できませんでした。"); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <section aria-labelledby="cover-photo-heading" className="mt-5 rounded-2xl bg-white p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="cover-photo-heading" className="font-bold">表紙写真</h2><p className="mt-1 text-sm leading-6 text-stone-500">JPEG・PNG・WebP、{Math.round(COVER_PHOTO_MAX_FILE_SIZE / 1024 / 1024)}MB以下。表示用に自動で縮小・圧縮します。</p></div><div className="flex shrink-0 gap-3"><button type="button" onClick={() => inputRef.current?.click()} disabled={busy || isLoading || Boolean(error)} className={`${hasPhoto ? secondaryButtonClass : primaryButtonClass} flex-1 sm:flex-none`}>{busy ? "処理中…" : hasPhoto ? "写真を変更" : "表紙写真を追加"}</button>{hasPhoto && <button type="button" onClick={removePhoto} disabled={busy} className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-stone-500 hover:text-red-700 disabled:opacity-50">削除</button>}<input ref={inputRef} type="file" accept={COVER_PHOTO_ACCEPT} onChange={selectPhoto} className="sr-only" aria-label="表紙写真を選択" /></div></div>{(message || error) && <p role="status" className={`mt-3 text-sm ${error ? "text-red-700" : "text-stone-600"}`}>{error ?? message}</p>}</section>;
}
