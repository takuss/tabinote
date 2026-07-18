import { openMediaDatabase } from "@/app/lib/cover-photo-storage";

export type RecordPhotoRecord = {
  recordId: string;
  tripId: string;
  blob: Blob;
  mimeType: string;
  updatedAt: string;
};

const STORE_NAME = "recordPhotos";
export const RECORD_PHOTO_CHANGED_EVENT = "tabinote:record-photo-changed";

async function runTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, resolveValue: (value: T) => void) => void) {
  const database = await openMediaDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    let result = undefined as T;
    action(transaction.objectStore(STORE_NAME), (value) => { result = value; });
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error ?? new Error("Record photo transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Record photo transaction failed"));
  });
}

export function getRecordPhoto(recordId: string) {
  return runTransaction<RecordPhotoRecord | undefined>("readonly", (store, setResult) => {
    const request = store.get(recordId);
    request.onsuccess = () => setResult(request.result);
  });
}

export async function saveRecordPhoto(recordId: string, tripId: string, blob: Blob) {
  const value: RecordPhotoRecord = { recordId, tripId, blob, mimeType: blob.type, updatedAt: new Date().toISOString() };
  await runTransaction<void>("readwrite", (store) => { store.put(value); });
  window.dispatchEvent(new CustomEvent(RECORD_PHOTO_CHANGED_EVENT, { detail: { recordId, tripId } }));
}

export async function deleteRecordPhoto(recordId: string) {
  await runTransaction<void>("readwrite", (store) => { store.delete(recordId); });
  window.dispatchEvent(new CustomEvent(RECORD_PHOTO_CHANGED_EVENT, { detail: { recordId } }));
}

export async function deleteRecordPhotosForTrip(tripId: string) {
  await runTransaction<void>("readwrite", (store) => {
    const request = store.index("tripId").openKeyCursor(IDBKeyRange.only(tripId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      store.delete(cursor.primaryKey);
      cursor.continue();
    };
  });
  window.dispatchEvent(new CustomEvent(RECORD_PHOTO_CHANGED_EVENT, { detail: { tripId } }));
}

export function countRecordPhotosForTrip(tripId: string) {
  return runTransaction<number>("readonly", (store, setResult) => {
    const request = store.index("tripId").count(IDBKeyRange.only(tripId));
    request.onsuccess = () => setResult(request.result);
  });
}
