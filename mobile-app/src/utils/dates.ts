import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * API datetimes carry the gym's offset (e.g. 2026-10-05T18:00:00+05:00). Showing them
 * in that offset keeps gym time on every phone, whatever the device's own timezone.
 */
export function gymDate(iso: string): Date {
  const offset = iso.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] ?? 'Z';
  const zoned = offset === 'Z' ? '+00:00' : offset;
  return toZonedTime(iso, zoned);
}

/** Calendar day in gym time, e.g. "2026-10-05". Used for grouping. */
export function gymDayKey(iso: string): string {
  return format(gymDate(iso), 'yyyy-MM-dd');
}

/** "Mon 5 Oct" (or a custom date-fns pattern). */
export function formatDate(iso: string | null | undefined, pattern = 'EEE d MMM'): string {
  return iso ? format(gymDate(iso), pattern) : '—';
}

/** "18:00" */
export function formatTime(iso: string | null | undefined): string {
  return iso ? format(gymDate(iso), 'HH:mm') : '—';
}

/** "18:00 – 19:30", or across days "Sat 23:00 – Sun 01:00". */
export function formatRange(startIso: string, endIso: string | null | undefined): string {
  if (!endIso) return formatTime(startIso);
  if (gymDayKey(startIso) === gymDayKey(endIso)) return `${formatTime(startIso)} – ${formatTime(endIso)}`;
  return `${formatDate(startIso, 'EEE HH:mm')} – ${formatDate(endIso, 'EEE HH:mm')}`;
}

/** A plain Y-m-d (date of birth) as "15 Jun 1995". */
export function formatPlainDate(ymd: string | null | undefined): string {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'd MMM yyyy');
}
