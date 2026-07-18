"use client";

import { useEffect, useRef, useState } from "react";
import { COVER_PHOTO_CHANGED_EVENT, getCoverPhoto } from "@/app/lib/cover-photo-storage";

export function useCoverPhoto(tripId: string) {
  const [version, setVersion] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    function changed(event: Event) {
      const changedTripId = (event as CustomEvent<{ tripId?: string }>).detail?.tripId;
      if (!changedTripId || changedTripId === tripId) { setIsLoading(true); setError(null); setVersion((current) => current + 1); }
    }
    window.addEventListener(COVER_PHOTO_CHANGED_EVENT, changed);
    return () => window.removeEventListener(COVER_PHOTO_CHANGED_EVENT, changed);
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    getCoverPhoto(tripId).then((record) => {
      if (cancelled) return;
      const nextUrl = record ? URL.createObjectURL(record.blob) : null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = nextUrl;
      setUrl(nextUrl); setIsLoading(false);
    }).catch(() => {
      if (cancelled) return;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setUrl(null); setIsLoading(false); setError("このブラウザでは表紙写真を読み込めません。");
    });
    return () => { cancelled = true; };
  }, [tripId, version]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  return { url, isLoading, error, hasPhoto: Boolean(url) };
}
