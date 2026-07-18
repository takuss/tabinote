export type CoverPhotoRecord = {
  tripId: string;
  blob: Blob;
  mimeType: string;
  updatedAt: string;
};

const DATABASE_NAME = "tabinote-media";
const DATABASE_VERSION = 2;
const STORE_NAME = "coverPhotos";
const RECORD_PHOTO_STORE_NAME = "recordPhotos";
export const COVER_PHOTO_CHANGED_EVENT = "tabinote:cover-photo-changed";

let databasePromise: Promise<IDBDatabase> | null = null;

export function openMediaDatabase() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is not available"));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "tripId" });
      if (!database.objectStoreNames.contains(RECORD_PHOTO_STORE_NAME)) {
        const store = database.createObjectStore(RECORD_PHOTO_STORE_NAME, { keyPath: "recordId" });
        store.createIndex("tripId", "tripId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open photo storage"));
    request.onblocked = () => reject(new Error("Photo storage is blocked"));
  }).catch((error) => { databasePromise = null; throw error; });
  return databasePromise;
}

async function runRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openMediaDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    let result = undefined as T;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error ?? new Error("Photo storage operation failed"));
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(transaction.error ?? new Error("Photo storage transaction failed"));
    transaction.onerror = () => reject(transaction.error ?? new Error("Photo storage transaction failed"));
  });
}

export function getCoverPhoto(tripId: string) {
  return runRequest<CoverPhotoRecord | undefined>("readonly", (store) => store.get(tripId));
}

export async function saveCoverPhoto(tripId: string, blob: Blob) {
  const record: CoverPhotoRecord = { tripId, blob, mimeType: blob.type, updatedAt: new Date().toISOString() };
  await runRequest<IDBValidKey>("readwrite", (store) => store.put(record));
  window.dispatchEvent(new CustomEvent(COVER_PHOTO_CHANGED_EVENT, { detail: { tripId } }));
}

export async function deleteCoverPhoto(tripId: string) {
  await runRequest<undefined>("readwrite", (store) => store.delete(tripId));
  window.dispatchEvent(new CustomEvent(COVER_PHOTO_CHANGED_EVENT, { detail: { tripId } }));
}
