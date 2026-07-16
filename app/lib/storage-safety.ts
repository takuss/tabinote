export const MAX_STORAGE_TEXT_LENGTH = 2_000_000;
export const MAX_STORED_ITEMS = 10_000;

export function canParseStorageText(saved: string | null): saved is string {
  return saved !== null && saved.length > 0 && saved.length <= MAX_STORAGE_TEXT_LENGTH;
}
