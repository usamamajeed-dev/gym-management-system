import { addMonths, format, parse } from 'date-fns';

import { GymEvent } from '../api/types';
import { formatDate, gymDayKey } from './dates';

export interface EventSection {
  /** Gym-time calendar day, e.g. "2026-10-05". */
  key: string;
  /** e.g. "Mon 5 Oct" */
  title: string;
  data: GymEvent[];
}

/** Groups events by their start day in gym time (not the device's timezone), in start order. */
export function groupEventsByDay(events: GymEvent[]): EventSection[] {
  const sections = new Map<string, EventSection>();

  for (const event of [...events].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))) {
    const key = gymDayKey(event.starts_at);
    if (!sections.has(key)) {
      sections.set(key, { key, title: formatDate(event.starts_at, 'EEE d MMM'), data: [] });
    }
    sections.get(key)!.data.push(event);
  }

  return [...sections.values()];
}

/** An event is finished once its end (or its start, when it has no end) is in the past. */
export function isFinished(event: Pick<GymEvent, 'starts_at' | 'ends_at'>, now: Date = new Date()): boolean {
  return Date.parse(event.ends_at ?? event.starts_at) < now.getTime();
}

/** "2026-10" ± n months → "2026-12". */
export function shiftMonth(month: string, delta: number): string {
  return format(addMonths(parse(month, 'yyyy-MM', new Date()), delta), 'yyyy-MM');
}

/** "2026-10" → "October 2026". */
export function monthTitle(month: string): string {
  return format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy');
}

/** Number of months between two "YYYY-MM" values (b - a). */
export function monthDiff(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}
