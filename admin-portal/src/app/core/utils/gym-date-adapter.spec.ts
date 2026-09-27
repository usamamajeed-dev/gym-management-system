import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { GymDateAdapter } from './gym-date-adapter';

describe('GymDateAdapter', () => {
  let adapter: GymDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GymDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }] });
    adapter = TestBed.inject(GymDateAdapter);
  });

  it('reads typed dates as day/month/year', () => {
    const date = adapter.parse('15/06/1995', null) as Date;

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([1995, 5, 15]);
    expect((adapter.parse('3.10.2026', null) as Date).getMonth()).toBe(9);
  });

  it('rejects impossible dates', () => {
    expect(adapter.isValid(adapter.parse('31/02/2026', null) as Date)).toBe(false);
  });
});
