import { FormArray, FormGroup } from '@angular/forms';

import { applyServerErrors } from '../../core/utils/form-errors';
import { GymTiming } from './gym-timing.model';
import { buildTimingRow, copyMondayToWeekdays, TimingRow } from './gym-timings.component';
import { CLOSING_BEFORE_OPENING } from './timing-row.validator';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function day(dow: number, overrides: Partial<GymTiming> = {}): GymTiming {
  return {
    day_of_week: dow,
    day_name: DAY_NAMES[dow],
    is_closed: false,
    opens_at: '06:00',
    closes_at: '22:00',
    updated_at: null,
    ...overrides,
  };
}

/** Monday-first week, as the API returns it. */
function week(): FormArray<TimingRow> {
  return new FormArray([1, 2, 3, 4, 5, 6, 0].map((d) => buildTimingRow(day(d))));
}

describe('timing row validator', () => {
  it('rejects an open day whose closing time is not after opening', () => {
    const row = buildTimingRow(day(1, { opens_at: '20:00', closes_at: '08:00' }));

    expect(row.valid).toBe(false);
    expect(row.errors?.['closingBeforeOpening']).toBe(CLOSING_BEFORE_OPENING);

    row.patchValue({ closes_at: '20:00' });
    expect(row.valid).toBe(false);
  });

  it('accepts a closed day without times', () => {
    const row = buildTimingRow(day(0, { is_closed: true, opens_at: null, closes_at: null }));

    expect(row.valid).toBe(true);
    expect(row.controls.opens_at.disabled).toBe(true);
  });

  it('requires both times on an open day', () => {
    const row = buildTimingRow(day(3, { opens_at: '06:00', closes_at: null }));

    expect(row.errors?.['timesRequired']).toBeTruthy();
  });
});

describe('copyMondayToWeekdays', () => {
  it('copies Monday to Tuesday–Friday only', () => {
    const rows = week();
    rows.at(0).patchValue({ opens_at: '07:00', closes_at: '21:00' });
    rows.at(5).patchValue({ opens_at: '09:00', closes_at: '17:00' });

    copyMondayToWeekdays(rows);

    const byDay = Object.fromEntries(rows.getRawValue().map((r) => [r.day_of_week, `${r.opens_at}-${r.closes_at}`]));
    expect(byDay[2]).toBe('07:00-21:00');
    expect(byDay[3]).toBe('07:00-21:00');
    expect(byDay[4]).toBe('07:00-21:00');
    expect(byDay[5]).toBe('07:00-21:00');
    expect(byDay[6]).toBe('09:00-17:00');
    expect(byDay[0]).toBe('06:00-22:00');
  });

  it('copies a closed Monday too', () => {
    const rows = week();
    rows.at(0).patchValue({ is_closed: true, opens_at: null, closes_at: null });

    copyMondayToWeekdays(rows);

    expect(rows.at(1).controls.is_closed.value).toBe(true);
    expect(rows.at(1).controls.opens_at.disabled).toBe(true);
  });
});

describe('server errors on timings', () => {
  it('maps timings.N.field onto the matching row control', () => {
    const form = new FormGroup({ timings: week() });

    applyServerErrors(form, {
      errors: { 'timings.3.closes_at': ['Closing time must be after opening time for Thursday.'] },
    });

    const thursday = form.controls.timings.at(3);
    expect(thursday.controls.day_name.value).toBe('Thursday');
    expect(thursday.controls.closes_at.errors?.['server']).toBe(
      'Closing time must be after opening time for Thursday.',
    );
    expect(form.controls.timings.at(2).controls.closes_at.errors).toBeNull();
  });
});
