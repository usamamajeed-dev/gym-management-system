import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * Date pickers show dates as dd/mm/yyyy. The native adapter parses typed text with
 * Date.parse (US month-first), so "15/06/1995" would be rejected. This adapter reads
 * dd/mm/yyyy (also with "." or "-") first and falls back to the native parser.
 */
@Injectable()
export class GymDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const match = value.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);

      if (match) {
        const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
        const date = new Date(year, month - 1, day);
        const isReal = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

        return isReal ? date : this.invalid();
      }
    }

    return super.parse(value, parseFormat);
  }
}
