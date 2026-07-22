"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import QuickExpenseForm from "@/app/components/quick-expense-form";
import QuickReservationForm from "@/app/components/quick-reservation-form";
import QuickScheduleForm from "@/app/components/quick-schedule-form";
import QuickRecordForm from "@/app/components/quick-record-form";
import QuickTransportForm from "@/app/components/quick-transport-form";
import type { Trip } from "@/app/lib/trips";
import { OPEN_QUICK_ADD_EVENT } from "@/app/components/bottom-navigation";
import { usePathname } from "next/navigation";

type AddKind = "schedule" | "transport" | "expense" | "reservation" | "record";
type AddOption = { kind: AddKind; label: string; description: string; icon: ReactNode };

const ADD_OPTIONS: AddOption[] = [
  { kind: "schedule", label: "予定を追加", description: "行き先と時間をすばやく登録", icon: <CalendarIcon /> },
  { kind: "transport", label: "移動を追加", description: "乗り物と移動経路を登録", icon: <TrainIcon /> },
  { kind: "expense", label: "その他の費用を追加", description: "必要な費用だけを補足", icon: <WalletIcon /> },
  { kind: "reservation", label: "予約を追加", description: "宿や交通などの予約を登録", icon: <TicketIcon /> },
  { kind: "record", label: "写真・思い出を残す", description: "写真やひとことで旅を記録", icon: <PhotoIcon /> },
];
export const OPEN_QUICK_RECORD_EVENT = "tabinote:open-quick-record";

export default function QuickAddLauncher({ trip, navigationOnly = false, experience = "plan", initialDate }: { trip: Trip; navigationOnly?: boolean; experience?: "plan" | "today" | "memories"; initialDate?: string }) {
  const pathname = usePathname();
  const resolvedExperience = pathname.endsWith("/today") ? "today" : pathname.endsWith("/summary") ? "memories" : experience;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<AddKind | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const externalTriggerRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const formRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function openFromNavigation(event: Event) {
      externalTriggerRef.current = (event as CustomEvent<{ trigger?: HTMLElement }>).detail?.trigger ?? null;
      setIsMenuOpen(true);
    }
    window.addEventListener(OPEN_QUICK_ADD_EVENT, openFromNavigation);
    function openRecord() { setIsMenuOpen(false); setActiveKind("record"); window.requestAnimationFrame(() => formRegionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }
    window.addEventListener(OPEN_QUICK_RECORD_EVENT, openRecord);
    return () => { window.removeEventListener(OPEN_QUICK_ADD_EVENT, openFromNavigation); window.removeEventListener(OPEN_QUICK_RECORD_EVENT, openRecord); };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        window.requestAnimationFrame(() => (externalTriggerRef.current ?? triggerRef.current)?.focus());
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function closeMenu({ restoreFocus = true } = {}) {
    setIsMenuOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => (externalTriggerRef.current ?? triggerRef.current)?.focus());
  }

  function selectKind(kind: AddKind) {
    setActiveKind(kind);
    closeMenu({ restoreFocus: false });
    window.requestAnimationFrame(() => {
      formRegionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formRegionRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    });
  }

  const options = orderedOptions(resolvedExperience);
  const primaryOption = options[0];
  const secondaryOptions = options.slice(1);

  return <section aria-label="クイック追加" className={navigationOnly ? "" : "border-b border-stone-300 py-6"}>
    {!navigationOnly && <div className="flex items-center justify-between gap-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-4 sm:px-5">
      <div><h2 id="quick-add-heading" className="font-bold">旅の情報を追加</h2><p className="mt-1 text-sm text-stone-600">予定・移動・予約・思い出をすぐに登録できます</p></div>
      <button ref={triggerRef} type="button" onClick={() => { externalTriggerRef.current = null; setIsMenuOpen(true); }} aria-haspopup="dialog" aria-expanded={isMenuOpen} aria-controls="quick-add-sheet" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-teal-700 px-5 text-base font-bold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">＋追加</button>
    </div>}

    <div ref={formRegionRef} aria-live="polite">
      {activeKind === "schedule" && <QuickScheduleForm key="schedule" trip={trip} initialDate={initialDate} onClose={() => setActiveKind(null)} />}
      {activeKind === "transport" && <QuickTransportForm key="transport" trip={trip} initialDate={initialDate} onClose={() => setActiveKind(null)} />}
      {activeKind === "expense" && <QuickExpenseForm key="expense" trip={trip} initialDate={initialDate} onClose={() => setActiveKind(null)} />}
      {activeKind === "reservation" && <QuickReservationForm key="reservation" trip={trip} initialDate={initialDate} onClose={() => setActiveKind(null)} />}
      {activeKind === "record" && <QuickRecordForm key="record" trip={trip} initialDate={initialDate} onClose={() => setActiveKind(null)} />}
    </div>

    {isMenuOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/40 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div ref={sheetRef} id="quick-add-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-add-menu-title" className="w-full max-w-lg rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-2xl sm:p-5">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-stone-300 sm:hidden" aria-hidden="true" />
        <div className="flex min-h-12 items-center justify-between gap-4"><h2 id="quick-add-menu-title" className="text-lg font-bold">何を追加しますか？</h2><button type="button" onClick={() => closeMenu()} aria-label="追加メニューを閉じる" className="inline-flex size-12 items-center justify-center rounded-full text-2xl text-stone-600 hover:bg-stone-100">×</button></div>
        <button type="button" onClick={() => selectKind(primaryOption.kind)} className="mt-2 flex min-h-20 w-full items-center gap-4 rounded-2xl bg-teal-700 px-4 py-3 text-left text-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15" aria-hidden="true">{primaryOption.icon}</span><span><span className="block font-bold">{primaryOption.label}</span><span className="mt-0.5 line-clamp-1 block text-sm text-white/75">{primaryOption.description}</span></span><span className="ml-auto text-white/70" aria-hidden="true">›</span></button>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {secondaryOptions.map((option) => <button key={option.kind} type="button" onClick={() => selectKind(option.kind)} className="flex min-h-24 min-w-0 flex-col items-start justify-center rounded-xl bg-stone-100 px-3 py-3 text-left active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700"><span className="flex size-10 items-center justify-center rounded-full bg-white text-teal-800" aria-hidden="true">{option.icon}</span><span className="mt-2 block break-words text-sm font-bold leading-5">{option.label}</span><span className="mt-0.5 line-clamp-1 block max-w-full text-xs text-stone-500">{option.description}</span></button>)}
        </div>
      </div>
    </div>}
  </section>;
}

function orderedOptions(experience: "plan" | "today" | "memories") { const order: AddKind[] = experience === "plan" ? ["schedule", "transport", "reservation", "record", "expense"] : ["record", "schedule", "transport", "reservation", "expense"]; return order.map((kind) => ADD_OPTIONS.find((item) => item.kind === kind)!); }

const iconClass = "size-6";
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /><path d="M8 13h3v3H8z" /></svg>; }
function WalletIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M4 6h14a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h11" /><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z" /></svg>; }
function TicketIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z" /><path d="M12 7v2m0 2v2m0 2v2" /></svg>; }
function PhotoIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m5 17 4-4 3 3 2-2 5 3" /></svg>; }
function TrainIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M8 7h8M8 13h.01M16 13h.01M8 18l-2 3m10-3 2 3"/></svg>; }
