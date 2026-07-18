"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { parseRecords, RECORDS_STORAGE_KEY } from "@/app/lib/records";
import { parseReservations, RESERVATIONS_STORAGE_KEY } from "@/app/lib/reservations";
import { parseSchedules, SCHEDULES_STORAGE_KEY } from "@/app/lib/schedules";
import { parseTrips, TRIPS_STORAGE_KEY } from "@/app/lib/trips";
import { primaryButtonClass, secondaryButtonClass } from "@/app/components/ui";
import { parseTransports, TRANSPORTS_STORAGE_KEY } from "@/app/lib/transports";

type BackupData = { schemaVersion: 2; createdAt: string; data: { trips: unknown[]; schedules: unknown[]; reservations: unknown[]; records: unknown[]; transports: unknown[] } };
type Preview = { backup: BackupData; trips: number; schedules: number; reservations: number; records: number; transports: number; expenses: number };
const keys = [TRIPS_STORAGE_KEY, SCHEDULES_STORAGE_KEY, RESERVATIONS_STORAGE_KEY, RECORDS_STORAGE_KEY, TRANSPORTS_STORAGE_KEY] as const;

export default function BackupManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function download() {
    try {
      const data = {
        trips: parseTrips(localStorage.getItem(TRIPS_STORAGE_KEY)), schedules: parseSchedules(localStorage.getItem(SCHEDULES_STORAGE_KEY)),
        reservations: parseReservations(localStorage.getItem(RESERVATIONS_STORAGE_KEY)), records: parseRecords(localStorage.getItem(RECORDS_STORAGE_KEY)),
        transports: parseTransports(localStorage.getItem(TRANSPORTS_STORAGE_KEY)),
      };
      const backup: BackupData = { schemaVersion: 2, createdAt: new Date().toISOString(), data };
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `tabinote-backup-${localDate()}.json`; anchor.click(); URL.revokeObjectURL(url);
      setMessage("バックアップを書き出しました。");
    } catch { setMessage("バックアップを書き出せませんでした。"); }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setPreview(null); setMessage("");
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 8_000_000) throw new Error();
      const parsed: unknown = JSON.parse(await file.text());
      const backup = validateBackup(parsed);
      const records = parseRecords(JSON.stringify(backup.data.records));
      setPreview({ backup, trips: backup.data.trips.length, schedules: backup.data.schedules.length, reservations: backup.data.reservations.length, records: backup.data.records.length, transports: backup.data.transports.length, expenses: records.filter((item) => item.amount !== null).length });
    } catch { setMessage("このファイルは旅ノートの有効なバックアップではありません。既存データは変更されていません。"); }
  }

  function restore() {
    if (!preview || busy) return;
    setBusy(true);
    const originals = new Map(keys.map((key) => [key, localStorage.getItem(key)]));
    try {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(preview.backup.data.trips));
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(preview.backup.data.schedules));
      localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(preview.backup.data.reservations));
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(preview.backup.data.records));
      localStorage.setItem(TRANSPORTS_STORAGE_KEY, JSON.stringify(preview.backup.data.transports));
      window.location.reload();
    } catch {
      for (const [key, value] of originals) { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); }
      setBusy(false); setMessage("復元に失敗しました。元のデータは維持されています。");
    }
  }

  return <section aria-labelledby="backup-heading" className="mt-10 border-t border-stone-200 pt-6"><details>
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-bold text-stone-700"><span id="backup-heading">データのバックアップ</span><span aria-hidden="true" className="text-stone-400">⌄</span></summary>
    <p className="mt-1 text-sm leading-6 text-stone-500">旅行データをこの端末からJSONファイルへ保存・復元できます。</p>
    <p className="mt-1 text-xs leading-5 text-stone-400">表紙写真と記録写真はJSONバックアップ対象外です。</p>
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={download} className={secondaryButtonClass}>書き出す</button><button type="button" onClick={() => inputRef.current?.click()} className={secondaryButtonClass}>ファイルから復元</button><input ref={inputRef} type="file" accept="application/json,.json" onChange={chooseFile} className="sr-only" aria-label="バックアップファイルを選択" /></div>
    {message && <p role="status" className="mt-3 text-sm text-stone-600">{message}</p>}
    {preview && <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">復元内容を確認してください</p><p className="mt-2 leading-6">旅行 {preview.trips}件・予定 {preview.schedules}件・移動 {preview.transports}件・予約 {preview.reservations}件・記録 {preview.records}件（支出 {preview.expenses}件）</p><p className="mt-2 font-bold">現在のデータはすべて置き換えられます。この操作は取り消せません。</p><div className="mt-4 flex gap-3"><button type="button" onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }} className={`${secondaryButtonClass} flex-1`}>キャンセル</button><button type="button" onClick={restore} disabled={busy} className={`${primaryButtonClass} flex-[2]`}>{busy ? "復元中…" : "すべて置き換えて復元"}</button></div></div>}
  </details></section>;
}

function validateBackup(value: unknown): BackupData {
  if (!value || typeof value !== "object") throw new Error();
  const backup = value as { schemaVersion?: number; createdAt?: unknown; data?: Record<string, unknown> };
  if (![1, 2].includes(backup.schemaVersion ?? 0) || typeof backup.createdAt !== "string" || !backup.data) throw new Error();
  const { trips, schedules, reservations, records } = backup.data; const transports = backup.schemaVersion === 1 ? [] : backup.data.transports;
  if (![trips, schedules, reservations, records, transports].every(Array.isArray)) throw new Error();
  const arrays = [trips, schedules, reservations, records, transports] as unknown[][];
  if (parseTrips(JSON.stringify(trips)).length !== arrays[0].length || parseSchedules(JSON.stringify(schedules)).length !== arrays[1].length || parseReservations(JSON.stringify(reservations)).length !== arrays[2].length || parseRecords(JSON.stringify(records)).length !== arrays[3].length || parseTransports(JSON.stringify(transports)).length !== arrays[4].length) throw new Error();
  if (!arrays.every((items) => new Set(items.map((item) => (item as { id: string }).id)).size === items.length)) throw new Error();
  return { schemaVersion: 2, createdAt: backup.createdAt, data: { trips: arrays[0], schedules: arrays[1], reservations: arrays[2], records: arrays[3], transports: arrays[4] } };
}
function localDate() { const now = new Date(); return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-"); }
