export const BIBLE_VERSIONS = [
  { code: 'tb', name: 'Terjemahan Baru', lang: 'id' },
  { code: 'bis', name: 'Alkitab Kabar Baik / BIS', lang: 'id' },
  { code: 'net', name: 'New English Translation', lang: 'en' },
] as const;

export type BibleVersionCode = (typeof BIBLE_VERSIONS)[number]['code'];

export const DEFAULT_VERSION: BibleVersionCode = 'tb';

export function isBibleVersionCode(value: unknown): value is BibleVersionCode {
  return BIBLE_VERSIONS.some((version) => version.code === value);
}

/** Mengembalikan kode versi yang didukung; jatuh ke DEFAULT_VERSION jika tidak dikenal. */
export function resolveVersion(value: string | null | undefined): BibleVersionCode {
  return isBibleVersionCode(value) ? value : DEFAULT_VERSION;
}
