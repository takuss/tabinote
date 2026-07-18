"use client";

import Image from "next/image";
import { useCoverPhoto } from "@/app/lib/use-cover-photo";

export default function CoverPhotoImage({ tripId, alt, className = "", sizes = "(max-width: 640px) 100vw, 800px" }: { tripId: string; alt: string; className?: string; sizes?: string }) {
  const { url } = useCoverPhoto(tripId);
  if (!url) return null;
  return <Image src={url} alt={alt} fill unoptimized sizes={sizes} className={`object-cover object-center ${className}`} />;
}
