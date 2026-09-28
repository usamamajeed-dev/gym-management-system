import { GymEvent } from '../api/types';
import { formatTime } from './dates';
import { groupEventsByDay, isFinished, monthDiff, monthTitle, shiftMonth } from './events';

function event(id: number, starts_at: string, ends_at: string | null = null): GymEvent {
  return {
    id,
    title: `Event ${id}`,
    description: null,
    location: null,
    capacity: null,
    is_published: true,
    starts_at,
    ends_at,
    image_url: null,
    created_at: starts_at,
    updated_at: starts_at,
  };
}

describe('groupEventsByDay', () => {
  // jest runs with TZ=UTC (see package.json), i.e. a device in UTC.
  it('groups by gym-time day, not the device day', () => {
    // 23:30 at the gym (+05:00) is 18:30 UTC the same day…
    const lateEvening = event(1, '2026-10-05T23:30:00+05:00');
    // …while 01:30 on the 6th at the gym is still the 5th (20:30) in UTC.
    const afterMidnight = event(2, '2026-10-06T01:30:00+05:00');

    const sections = groupEventsByDay([afterMidnight, lateEvening]);

    expect(sections.map((s) => s.key)).toEqual(['2026-10-05', '2026-10-06']);
    expect(sections[0].title).toBe('Mon 5 Oct');
    expect(sections[1].data[0].id).toBe(2);
    expect(formatTime(lateEvening.starts_at)).toBe('23:30');
  });

  it('keeps events of the same day together, earliest first', () => {
    const sections = groupEventsByDay([
      event(1, '2026-10-05T18:00:00+00:00'),
      event(2, '2026-10-05T07:00:00+00:00'),
      event(3, '2026-10-07T09:00:00+00:00'),
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0].data.map((e) => e.id)).toEqual([2, 1]);
  });
});

describe('isFinished', () => {
  const now = new Date('2026-10-05T12:00:00Z');

  it('uses the end time when there is one', () => {
    expect(isFinished(event(1, '2026-10-05T10:00:00Z', '2026-10-05T11:00:00Z'), now)).toBe(true);
    expect(isFinished(event(2, '2026-10-05T11:00:00Z', '2026-10-05T13:00:00Z'), now)).toBe(false);
  });

  it('uses the start time when there is no end', () => {
    expect(isFinished(event(3, '2026-10-05T11:59:00Z'), now)).toBe(true);
    expect(isFinished(event(4, '2026-10-05T12:30:00Z'), now)).toBe(false);
  });
});

describe('month helpers', () => {
  it('shifts, names and diffs months', () => {
    expect(shiftMonth('2026-11', 2)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthTitle('2026-10')).toBe('October 2026');
    expect(monthDiff('2026-11', '2027-01')).toBe(2);
  });
});
