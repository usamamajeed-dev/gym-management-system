import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

import { GymDateAdapter } from '../utils/gym-date-adapter';
import { TimeFieldComponent } from './time-field.component';

@Component({
  imports: [ReactiveFormsModule, TimeFieldComponent],
  template: `<app-time-field [formControl]="control" />`,
})
class HostComponent {
  readonly control = new FormControl<string | null>('18:00');
}

describe('TimeFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
        { provide: DateAdapter, useClass: GymDateAdapter },
      ],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    return { fixture, input, control: fixture.componentInstance.control };
  }

  async function type(fixture: { whenStable(): Promise<unknown> }, input: HTMLInputElement, text: string) {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  it('shows the form value on a 12-hour clock', async () => {
    const { input } = await setup();

    expect(input.value).toBe('6:00 PM');
  });

  it('writes typed times back as "HH:mm", from 12- or 24-hour input', async () => {
    const { fixture, input, control } = await setup();

    await type(fixture, input, '6:15');
    expect(control.value).toBe('06:15');

    await type(fixture, input, '7:45 pm');
    expect(control.value).toBe('19:45');

    await type(fixture, input, '21:30');
    expect(control.value).toBe('21:30');

    await type(fixture, input, '12:00 AM');
    expect(control.value).toBe('00:00');
  });

  it('gives null for empty or unreadable input', async () => {
    const { fixture, input, control } = await setup();

    await type(fixture, input, 'abc');
    expect(control.value).toBeNull();

    await type(fixture, input, '');
    expect(control.value).toBeNull();
  });

  it('follows the form control disabled state', async () => {
    const { fixture, input, control } = await setup();

    control.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);

    control.enable();
    await fixture.whenStable();
    expect(input.disabled).toBe(false);
  });
});
