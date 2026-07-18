"use client";

import type { ReactNode } from "react";
import CoverPhotoImage from "@/app/components/cover-photo-image";

export default function CoverPhotoBanner({ tripId, alt, children }: { tripId: string; alt: string; children: ReactNode }) {
  return <section className="relative h-[220px] w-full max-w-full overflow-hidden rounded-2xl bg-teal-800 text-white sm:h-[260px] lg:h-[310px] lg:max-h-[320px]">
    <CoverPhotoImage tripId={tripId} alt={alt} sizes="(max-width: 896px) 100vw, 896px" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/35" aria-hidden="true" />
    <div className="relative flex h-full min-w-0 flex-col justify-between p-5 sm:p-7">{children}</div>
  </section>;
}
