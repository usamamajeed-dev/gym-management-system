import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';

import { FieldErrorComponent } from './field-error.component';

/** "18:30" → a Date on a fixed day carrying that time, for the timepicker. */
function toDate(time: string | null): Date | null {
  const match = time?.match(/^(\d{1,2}):(\d{2})/);
  return match ? new Date(2000, 0, 1, Number(match[1]), Number(match[2])) : null;
}

function toTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Time input with a dropdown of times (every `interval`) that also accepts typing,
 * e.g. "7:15" or "19:15". Bind it with formControlName: the form value stays an "HH:mm"
 * string (or null when empty), the format the API uses.
 */
@Component({
  selector: 'app-time-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatTimepickerModule, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    mat-form-field {
      width: 100%;
    }
  `,
  template: `
    <mat-form-field>
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <input
        matInput
        [matTimepicker]="picker"
        [formControl]="inner"
        [errorStateMatcher]="matcher"
        [attr.aria-label]="ariaLabel() || null"
        placeholder="--:--"
        (blur)="onTouched()"
      />
      <mat-timepicker-toggle matIconSuffix [for]="picker" />
      <mat-timepicker #picker [interval]="interval()" />
      @if (errorLabel() && outer) {
        <mat-error><app-field-error [control]="outer" [label]="errorLabel()" /></mat-error>
      }
    </mat-form-field>
  `,
})
export class TimeFieldComponent implements ControlValueAccessor, OnInit {
  readonly label = input('');
  readonly ariaLabel = input('');
  /** Gap between the times in the dropdown, e.g. "30m" or "15m". */
  readonly interval = input('30m');
  /** Field name used in the error message under the field; no message is shown when empty. */
  readonly errorLabel = input('');

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly adapter = inject<DateAdapter<Date>>(DateAdapter);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly inner = new FormControl<Date | null>(null);
  protected outer: FormControl | null = null;

  /** Show the error styling from the bound form control (including server errors). */
  protected readonly matcher: ErrorStateMatcher = {
    isErrorState: () => !!this.outer && this.outer.invalid && (this.outer.touched || this.outer.dirty),
  };

  private onChange: (value: string | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    this.inner.valueChanges.pipe(takeUntilDestroyed()).subscribe((date) => {
      this.onChange(date && this.adapter.isValid(date) ? toTime(date) : null);
    });
  }

  ngOnInit(): void {
    this.outer = (this.ngControl?.control as FormControl | undefined) ?? null;
    // Parent forms can mark the control touched or add server errors without an input change.
    this.outer?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  writeValue(value: string | null): void {
    this.inner.setValue(toDate(value), { emitEvent: false });
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    if (disabled) {
      this.inner.disable({ emitEvent: false });
    } else {
      this.inner.enable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }
}
