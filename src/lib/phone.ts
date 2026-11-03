/**
 * Menormalkan nomor telepon Indonesia ke format E.164 (+62...).
 * Contoh:
 * - "0812-3456-7890" -> "+6281234567890"
 * - "6281234567890"  -> "+6281234567890"
 * - "+62 812 3456 7890" -> "+6281234567890"
 * - "81234567890" (tanpa 0, sudah berprefiks +62 di UI) -> "+6281234567890"
 * Mengembalikan null jika nomor tidak valid.
 */
const CLEAN_PATTERN = /[\s\-().]/g;
const E164_ID_PATTERN = /^\+62\d{7,12}$/;

export function normalizePhone(input: string): string | null {
  const cleaned = input.trim().replace(CLEAN_PATTERN, '');
  if (!cleaned) return null;

  let rest: string;
  if (cleaned.startsWith('+62')) {
    rest = cleaned.slice(3);
  } else if (cleaned.startsWith('62')) {
    rest = cleaned.slice(2);
  } else if (cleaned.startsWith('0')) {
    rest = cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    rest = cleaned;
  } else {
    return null;
  }

  if (!/^\d+$/.test(rest)) return null;

  const result = `+62${rest}`;
  return E164_ID_PATTERN.test(result) ? result : null;
}
