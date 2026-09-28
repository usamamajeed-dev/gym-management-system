import { formatClock, formatDateTime, formatTimeRange } from './date.utils';

describe('date utils (12-hour display)', () => {
  it('formats 24-hour API times on a 12-hour clock', () => {
    expect(formatClock('00:00')).toBe('12:00 AM');
    expect(formatClock('06:05')).toBe('6:05 AM');
    expect(formatClock('12:00')).toBe('12:00 PM');
    expect(formatClock('18:30:00')).toBe('6:30 PM');
    expect(formatClock('23:59')).toBe('11:59 PM');
    expect(formatClock(null)).toBe('');
  });

  it('shows gym-time datetimes and ranges with AM/PM', () => {
    expect(formatDateTime('2026-10-05T18:00:00+05:00')).toBe('5 Oct 2026, 6:00 PM');
    expect(formatTimeRange('2026-10-05T18:00:00+05:00', null)).toBe('6:00 PM');
    expect(formatTimeRange('2026-10-05T18:00:00+05:00', '2026-10-05T19:30:00+05:00')).toBe('6:00 PM – 7:30 PM');
    expect(formatTimeRange('2026-10-05T23:00:00+05:00', '2026-10-06T01:00:00+05:00')).toBe(
      '11:00 PM – Tue 6 Oct, 1:00 AM',
    );
  });
});
