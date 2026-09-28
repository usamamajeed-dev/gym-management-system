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

/** "6:00 PM" */
export function formatTime(iso: string | null | undefined): string {
  return iso ? format(gymDate(iso), 'h:mm a') : '—';
}

/** "6:00 PM – 7:30 PM", or across days "Sat 11:00 PM – Sun 1:00 AM". */
export function formatRange(startIso: string, endIso: string | null | undefined): string {
  if (!endIso) return formatTime(startIso);
  if (gymDayKey(startIso) === gymDayKey(endIso)) return `${formatTime(startIso)} – ${formatTime(endIso)}`;
  return `${formatDate(startIso, 'EEE h:mm a')} – ${formatDate(endIso, 'EEE h:mm a')}`;
}

/** An opening-hours time from the API ("18:30", 24-hour) as "6:30 PM". */
export function formatClock(time: string | null | undefined): string {
  const match = time?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time ?? '';
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** A plain Y-m-d (date of birth) as "15 Jun 1995". */
export function formatPlainDate(ymd: string | null | undefined): string {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'd MMM yyyy');
}
