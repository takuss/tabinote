"use client";

import Image from "next/image";
import { useCoverPhoto } from "@/app/lib/use-cover-photo";

export default function CoverPhotoImage({ tripId, alt, className = "" }: { tripId: string; alt: string; className?: string }) {
  const { url } = useCoverPhoto(tripId);
  if (!url) return null;
  return <Image src={url} alt={alt} fill unoptimized sizes="(max-width: 640px) 100vw, 800px" className={`object-cover ${className}`} />;
}
