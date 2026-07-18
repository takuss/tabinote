"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRecordPhoto } from "@/app/lib/use-record-photo";

export function RecordPhotoThumbnail({ recordId, alt }: { recordId: string; alt: string }) {
  const { url } = useRecordPhoto(recordId);
  if (!url) return null;
  return <div className="relative mt-3 h-24 w-32 max-w-full overflow-hidden rounded-xl bg-stone-100 sm:h-28 sm:w-40"><Image src={url} alt={alt} fill unoptimized sizes="160px" className="object-cover object-center" /></div>;
}

export function RecordPhotoViewer({ recordId, alt }: { recordId: string; alt: string }) {
  const { url } = useRecordPhoto(recordId);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function keydown(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keydown); window.requestAnimationFrame(() => trigger?.focus()); };
  }, [open]);

  if (!url) return null;
  return <><button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label={`${alt}を拡大表示`} className="relative mt-3 block aspect-[4/3] max-h-96 w-full overflow-hidden rounded-xl bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><Image src={url} alt={alt} fill unoptimized sizes="(max-width: 640px) 100vw, 640px" className="object-cover object-center" /></button>{open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 sm:p-8" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div role="dialog" aria-modal="true" aria-label="記録写真の拡大表示" className="relative h-full max-h-[90vh] w-full max-w-5xl"><Image src={url} alt={alt} fill unoptimized sizes="100vw" className="object-contain object-center" /><button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="写真を閉じる" className="absolute right-2 top-2 inline-flex size-12 items-center justify-center rounded-full bg-black/65 text-2xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">×</button></div></div>}</>;
}
