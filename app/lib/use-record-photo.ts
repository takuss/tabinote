"use client";

import { useEffect, useRef, useState } from "react";
import { getRecordPhoto, RECORD_PHOTO_CHANGED_EVENT } from "@/app/lib/record-photo-storage";

export function useRecordPhoto(recordId: string) {
  const [version, setVersion] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    function changed(event: Event) {
      const changedId = (event as CustomEvent<{ recordId?: string }>).detail?.recordId;
      if (!changedId || changedId === recordId) { setIsLoading(true); setError(null); setVersion((current) => current + 1); }
    }
    window.addEventListener(RECORD_PHOTO_CHANGED_EVENT, changed);
    return () => window.removeEventListener(RECORD_PHOTO_CHANGED_EVENT, changed);
  }, [recordId]);

  useEffect(() => {
    let cancelled = false;
    getRecordPhoto(recordId).then((record) => {
      if (cancelled) return;
      const nextUrl = record ? URL.createObjectURL(record.blob) : null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = nextUrl;
      setUrl(nextUrl); setIsLoading(false);
    }).catch(() => {
      if (cancelled) return;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setUrl(null); setIsLoading(false); setError("記録写真を読み込めませんでした。");
    });
    return () => { cancelled = true; };
  }, [recordId, version]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);
  return { url, isLoading, error, hasPhoto: Boolean(url) };
}
