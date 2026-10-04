/**
 * Hàm định dạng dùng chung — bám theo web (src/lib/formatters.ts) để số liệu, ngày giờ
 * hiển thị giống nhau giữa hai nền tảng.
 */

/** Số thập phân kiểu Việt Nam; trả "--" khi không phải số. */
export function formatHrvNumber(val: unknown, decimals = 2): string {
  if (typeof val !== 'number' || Number.isNaN(val)) return '--';
  return Number(val.toFixed(decimals)).toLocaleString('vi-VN');
}

/** dd/MM/yyyy HH:mm:ss — dùng cho thời gian đo (giống web). */
export function formatRecordDate(iso?: string | number | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** dd/MM/yyyy HH:mm — dùng cho hạn, mốc thời gian trong tư vấn. */
export function formatDateTime(iso?: string | number | null, fallback = '-'): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** dd/MM/yyyy */
export function formatShortDate(iso?: string | number | null, fallback = '-'): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Tiền VND: 150.000 ₫ */
export function formatVND(amount?: number | null, fallback = '—'): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return fallback;
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

/** YYYY-MM-DD theo giờ máy (không dùng toISOString vì lệch múi giờ). */
export function toLocalDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Múi giờ của máy (vd. Asia/Ho_Chi_Minh) để server gom theo ngày đúng với người dùng. */
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}
