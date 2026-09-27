/**
 * The API returns ISO-8601 datetimes with the gym's offset, e.g. 2026-10-05T18:00:00+05:00.
 * To show gym time regardless of the browser's timezone, these helpers read the
 * wall-clock parts straight from the string instead of converting to local time.
 */

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const DAY_FMT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** { date: '2026-10-05', time: '18:00' } in gym time, or null. Plain dates ('1995-06-15') get time '00:00'. */
export function gymParts(iso: string | null | undefined): { date: string; time: string } | null {
  const match = iso?.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);

  return match ? { date: match[1], time: match[2] ?? '00:00' } : null;
}

function utcDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);

  return new Date(Date.UTC(y, m - 1, d));
}

/** "5 Oct 2026" */
export function formatDate(iso: string | null | undefined): string {
  const parts = gymParts(iso);

  return parts ? DATE_FMT.format(utcDate(parts.date)) : '—';
}

/** "5 Oct 2026, 18:00" */
export function formatDateTime(iso: string | null | undefined): string {
  const parts = gymParts(iso);

  return parts ? `${DATE_FMT.format(utcDate(parts.date))}, ${parts.time}` : '—';
}

/** "Mon, 5 Oct" */
export function formatDay(iso: string | null | undefined): string {
  const parts = gymParts(iso);

  return parts ? DAY_FMT.format(utcDate(parts.date)) : '—';
}

/** "18:00 – 19:30", "18:00", or a range across days. */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
  const start = gymParts(startIso);
  const end = gymParts(endIso);

  if (!start) return '—';
  if (!end) return start.time;
  if (end.date === start.date) return `${start.time} – ${end.time}`;

  return `${start.time} – ${formatDay(endIso)}, ${end.time}`;
}

/** "just now", "5 min ago", "3 days ago", or the date for anything older than a month. */
export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '—';

  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);

  if (Number.isNaN(seconds)) return '—';
  if (seconds < 45) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;

  return formatDate(iso);
}
