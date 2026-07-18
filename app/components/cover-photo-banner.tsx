"use client";

import Image from "next/image";
import { useCoverPhoto } from "@/app/lib/use-cover-photo";

export default function CoverPhotoBanner({ tripId, alt }: { tripId: string; alt: string }) {
  const { url } = useCoverPhoto(tripId);
  if (!url) return null;
  return <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-2xl bg-stone-200"><Image src={url} alt={alt} fill unoptimized sizes="(max-width: 896px) 100vw, 896px" className="object-cover" /></div>;
}
