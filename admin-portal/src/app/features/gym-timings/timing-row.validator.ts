import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const CLOSING_BEFORE_OPENING = 'Closing time must be after opening time';

/**
 * Row-level check for one day: an open day needs both times, and closing must be
 * later than opening. A closed day needs no times.
 */
export const timingRowValidator: ValidatorFn = (row: AbstractControl): ValidationErrors | null => {
  const isClosed = row.get('is_closed')?.value as boolean;
  const opens = row.get('opens_at')?.value as string | null;
  const closes = row.get('closes_at')?.value as string | null;

  if (isClosed) {
    return null;
  }

  if (!opens || !closes) {
    return { timesRequired: 'Set both opening and closing times, or mark the day as closed' };
  }

  return closes > opens ? null : { closingBeforeOpening: CLOSING_BEFORE_OPENING };
};
