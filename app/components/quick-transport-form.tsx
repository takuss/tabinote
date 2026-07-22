"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Trip } from "@/app/lib/trips";
import { createTransportId, findPreviousTransport, saveTransport, TRANSPORT_MODES, TRANSPORT_MODE_LABELS, validateTransportValues, type TransportMode, type TransportValues } from "@/app/lib/transports";
import { useTransports } from "@/app/lib/use-transports";
import { getQuickInitialDate } from "@/app/lib/quick-form-defaults";
import { inputClass } from "@/app/components/ui";

function initial(trip: Trip, preferredDate?: string) {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return { date: getQuickInitialDate(trip, preferredDate), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
}

export default function QuickTransportForm({ trip, onClose, initialDate }: { trip: Trip; onClose: () => void; initialDate?: string }) {
  const [start] = useState(() => initial(trip, initialDate));
  const { transports } = useTransports(trip.id);
  const [mode, setMode] = useState<TransportMode>("local-train");
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [manualDeparture, setManualDeparture] = useState<string | null>(null);
  const [errors, setErrors] = useState<ReturnType<typeof validateTransportValues> & { storage?: string }>({});
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const previous = findPreviousTransport(transports, date, time);
  const departurePlace = manualDeparture ?? previous?.arrivalPlace ?? "";
  const suggested = manualDeparture === null && Boolean(previous?.arrivalPlace);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const values: TransportValues = { mode, departurePlace, arrivalPlace: text("arrivalPlace"), departureDate: date, departureTime: time, arrivalDate: "", arrivalTime: text("arrivalTime"), serviceName: text("serviceName"), operator: "", departurePlatform: "", arrivalPlatform: "", terminal: "", carNumber: text("carNumber"), seatNumber: text("seatNumber"), fare: "", bookingUrl: "", memo: "", reservationId: "" };
    const found = validateTransportValues(values, trip.startDate, trip.endDate);
    if (Object.keys(found).length) { setErrors(found); return; }
    lock.current = true; setSaving(true);
    const now = new Date().toISOString();
    try {
      saveTransport({ ...values, id: createTransportId(), tripId: trip.id, arrivalDate: values.arrivalTime ? values.departureDate : "", fare: null, createdAt: now, updatedAt: now });
      onClose();
    } catch {
      lock.current = false; setSaving(false);
      setErrors({ storage: "移動を保存できませんでした。入力内容は維持されています。" });
    }
  }

  return <form onSubmit={submit} noValidate className="quick-add-form mt-4 rounded-2xl bg-white p-4 sm:p-5">
    <h3 className="font-bold">移動のクイック追加</h3><p className="mt-1 text-sm text-stone-500">出発地と到着地だけですぐ保存できます。</p>
    {errors.storage && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.storage}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="出発地" error={errors.departurePlace}><input name="departurePlace" autoFocus value={departurePlace} onChange={(event) => setManualDeparture(event.target.value)} className={inputClass} />{suggested && <span className="mt-1 block text-xs font-normal text-stone-500">前の移動の到着地から入力しました</span>}</Field>
      <Field label="到着地" error={errors.arrivalPlace}><input name="arrivalPlace" className={inputClass} /></Field>
    </div>
    <details className="mt-4 rounded-xl bg-stone-50 p-3">
      <summary className="flex min-h-12 cursor-pointer items-center font-bold text-teal-800">移動の詳細を追加 <span className="ml-auto text-sm font-normal text-stone-500">{formatShortDate(date)} {time}・{TRANSPORT_MODE_LABELS[mode]}</span></summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="移動手段" error={errors.mode}><select value={mode} onChange={(event) => setMode(event.target.value as TransportMode)} className={inputClass}>{TRANSPORT_MODES.map((item) => <option key={item} value={item}>{TRANSPORT_MODE_LABELS[item]}</option>)}</select></Field>
        <Field label="出発日" error={errors.departureDate}><input name="departureDate" type="date" min={trip.startDate} max={trip.endDate} value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></Field>
        <Field label="出発時刻" error={errors.departureTime}><input name="departureTime" type="time" value={time} onChange={(event) => setTime(event.target.value)} className={inputClass} /></Field>
        <Field label="到着時刻" optional error={errors.arrivalTime}><input name="arrivalTime" type="time" className={inputClass} /></Field>
        <Field label="列車名・便名など" optional><input name="serviceName" className={inputClass} /></Field>
        <Field label="号車" optional><input name="carNumber" className={inputClass} /></Field>
        <Field label="座席" optional><input name="seatNumber" className={inputClass} /></Field>
      </div>
    </details>
    <p className="mt-4"><a href={`/trips/${trip.id}/transports/new`} className="inline-flex min-h-12 items-center text-sm font-bold text-teal-800">詳細入力へ</a></p>
    <div className="mt-3 flex gap-3 sm:justify-end"><button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl bg-stone-100 px-4 font-bold sm:flex-none">キャンセル</button><button disabled={saving} aria-busy={saving} className="min-h-12 flex-[2] rounded-xl bg-teal-700 px-5 font-bold text-white disabled:opacity-60 sm:flex-none">{saving ? "保存中…" : "保存する"}</button></div>
  </form>;
}

function formatShortDate(date: string) { const [, month, day] = date.split("-").map(Number); return `${month}月${day}日`; }
function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) { return <label className="text-sm font-bold">{label}<span className={`ml-2 text-xs font-normal ${optional ? "text-stone-400" : "text-red-700"}`}>{optional ? "任意" : "必須"}</span>{children}{error && <span role="alert" className="mt-1 block font-normal text-red-700">{error}</span>}</label>; }
