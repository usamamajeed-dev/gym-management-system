import { FormControl, FormGroup } from '@angular/forms';

import { combine, scheduleValidator } from './event-form.component';

function schedule(start: [Date | null, string], end: [Date | null, string]) {
  return new FormGroup(
    {
      start_date: new FormControl<Date | null>(start[0]),
      start_time: new FormControl(start[1]),
      end_date: new FormControl<Date | null>(end[0]),
      end_time: new FormControl(end[1]),
    },
    { validators: scheduleValidator },
  );
}

const oct5 = new Date(2026, 9, 5);
const oct6 = new Date(2026, 9, 6);

describe('schedule validator (end ≥ start)', () => {
  it('accepts an event without an end', () => {
    expect(schedule([oct5, '18:00'], [null, '']).valid).toBe(true);
  });

  it('accepts an end after or equal to the start', () => {
    expect(schedule([oct5, '18:00'], [oct5, '19:30']).valid).toBe(true);
    expect(schedule([oct5, '18:00'], [oct5, '18:00']).valid).toBe(true);
    expect(schedule([oct5, '23:00'], [oct6, '01:00']).valid).toBe(true);
  });

  it('rejects an end before the start', () => {
    const group = schedule([oct5, '18:00'], [oct5, '17:00']);

    expect(group.errors?.['endBeforeStart']).toBe('The event must end after it starts.');
  });

  it('needs both end date and time once either is set', () => {
    expect(schedule([oct5, '18:00'], [oct5, '']).errors?.['endIncomplete']).toBeTruthy();
    expect(schedule([oct5, '18:00'], [null, '19:00']).errors?.['endIncomplete']).toBeTruthy();
  });

  it('combines a date and time into the API format', () => {
    expect(combine(oct5, '18:00')).toBe('2026-10-05 18:00');
    expect(combine(null, '18:00')).toBeNull();
  });
});
