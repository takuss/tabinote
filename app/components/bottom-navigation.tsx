"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { useTrips } from "@/app/lib/use-trips";
import { getTripExperiencePath } from "@/app/lib/trips";

export const OPEN_QUICK_ADD_EVENT = "tabinote:open-quick-add";

export default function BottomNavigation() {
  const pathname = usePathname();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { trips } = useTrips();
  const match = /^\/trips\/([^/]+)/.exec(pathname);
  const tripId = match && match[1] !== "new" ? match[1] : null;
  const isTripDetail = Boolean(tripId && ["", "/today", "/summary"].some((suffix) => pathname === `/trips/${tripId}${suffix}`));
  const isSummary = Boolean(tripId && pathname === `/trips/${tripId}/summary`);
  const currentTrip = trips.find((trip) => trip.id === tripId);
  const tripHref = currentTrip ? getTripExperiencePath(currentTrip) : tripId ? `/trips/${tripId}` : "";

  function openQuickAdd() {
    window.dispatchEvent(new CustomEvent(OPEN_QUICK_ADD_EVENT, { detail: { trigger: addButtonRef.current } }));
  }

  return <nav aria-label="メインナビゲーション" className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-x-auto md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:p-2 md:shadow-sm">
    <div className="mx-auto grid h-[5rem] max-w-lg grid-cols-4 items-end gap-1 px-2 md:h-auto md:w-[5.25rem] md:grid-cols-1 md:items-stretch md:gap-1 md:px-0">
      <NavLink href="/" label="ホーム" active={pathname === "/"} icon={<HomeIcon />} />
      {tripId ? <NavLink href={tripHref} label="旅行" active={!isSummary} icon={<SuitcaseIcon />} /> : <DisabledItem label="旅行" icon={<SuitcaseIcon />} hint="旅行を選ぶと開けます" />}
      <div className="flex min-h-16 items-end justify-center md:min-h-0 md:items-center md:py-1">
        {isTripDetail ? <button ref={addButtonRef} type="button" onClick={openQuickAdd} aria-label="予定、移動、予約、思い出などを追加" className="flex min-h-16 min-w-16 -translate-y-2 flex-col items-center justify-center rounded-full bg-teal-700 px-3 text-white shadow-md transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 md:min-h-14 md:min-w-0 md:w-full md:translate-y-0 md:rounded-xl md:shadow-none"><PlusIcon /><span className="mt-0.5 text-[0.65rem] font-bold">追加</span></button> : <Link href={tripId ? `/trips/${tripId}` : "/trips/new"} aria-label={tripId ? "旅行詳細へ移動して追加する" : "新しい旅行を追加"} aria-current={!tripId && pathname === "/trips/new" ? "page" : undefined} className="flex min-h-16 min-w-16 -translate-y-2 flex-col items-center justify-center rounded-full bg-teal-700 px-3 text-white shadow-md transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 md:min-h-14 md:min-w-0 md:w-full md:translate-y-0 md:rounded-xl md:shadow-none"><PlusIcon /><span className="mt-0.5 text-[0.65rem] font-bold">追加</span></Link>}
      </div>
      {tripId ? <NavLink href={`/trips/${tripId}/summary`} label="思い出" active={isSummary} icon={<AlbumIcon />} /> : <DisabledItem label="思い出" icon={<AlbumIcon />} hint="旅行を選ぶと開けます" />}
    </div>
  </nav>;
}

function NavLink({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: ReactNode }) {
  return <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={`flex min-h-[3.5rem] flex-col items-center justify-center rounded-xl px-2 text-xs font-bold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 md:min-h-14 ${active ? "bg-teal-50 text-teal-800" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"}`}><span aria-hidden="true">{icon}</span><span className="mt-1">{label}</span><span className="sr-only">{active ? "現在のページ" : ""}</span></Link>;
}

function DisabledItem({ label, icon, hint }: { label: string; icon: ReactNode; hint: string }) {
  return <button type="button" disabled aria-label={`${label}：${hint}`} title={hint} className="flex min-h-16 flex-col items-center justify-center rounded-xl px-2 text-xs font-bold text-stone-300 md:min-h-14"><span aria-hidden="true">{icon}</span><span className="mt-1">{label}</span></button>;
}

const iconClass = "size-6";
function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>; }
function SuitcaseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V4h6v3M8 11v5m8-5v5M3 13h18" /></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-7"><path d="M12 5v14M5 12h14" /></svg>; }
function AlbumIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v18M11 8h6M11 12h6M11 16h4" /></svg>; }
