import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map, startWith } from 'rxjs';

import { toApiError } from '../../core/api/api-error';
import { EmptyStateComponent } from '../../core/ui/empty-state.component';
import { NotifyService } from '../../core/ui/notify.service';
import { PageHeaderComponent } from '../../core/ui/page-header.component';
import { StatusChipComponent } from '../../core/ui/status-chip.component';
import { TimeFieldComponent } from '../../core/ui/time-field.component';
import { formatClock } from '../../core/utils/date.utils';
import { applyServerErrors, firstErrorMessage } from '../../core/utils/form-errors';
import { HasUnsavedChanges } from '../../core/utils/unsaved-changes.guard';
import { GymTiming, GymTimingInput } from './gym-timing.model';
import { GymTimingsService } from './gym-timings.service';
import { timingRowValidator } from './timing-row.validator';

export type TimingRow = FormGroup<{
  day_of_week: FormControl<number>;
  day_name: FormControl<string>;
  is_closed: FormControl<boolean>;
  opens_at: FormControl<string | null>;
  closes_at: FormControl<string | null>;
}>;

/** Weekdays copied from Monday by "Copy Monday to weekdays". */
const WEEKDAYS = [2, 3, 4, 5];

export function buildTimingRow(
  t: Pick<GymTiming, 'day_of_week' | 'day_name' | 'is_closed' | 'opens_at' | 'closes_at'>,
): TimingRow {
  const row: TimingRow = new FormGroup(
    {
      day_of_week: new FormControl(t.day_of_week, { nonNullable: true }),
      day_name: new FormControl(t.day_name, { nonNullable: true }),
      is_closed: new FormControl(t.is_closed, { nonNullable: true }),
      opens_at: new FormControl<string | null>(t.opens_at),
      closes_at: new FormControl<string | null>(t.closes_at),
    },
    { validators: timingRowValidator },
  );
  syncDisabled(row);
  return row;
}

/** Time inputs are disabled while a day is closed. */
function syncDisabled(row: TimingRow): void {
  const closed = row.controls.is_closed.value;
  for (const control of [row.controls.opens_at, row.controls.closes_at]) {
    if (closed) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }
}

/** Copies Monday's hours (open/closed and times) to Tuesday–Friday. */
export function copyMondayToWeekdays(rows: FormArray<TimingRow>): void {
  const monday = rows.controls.find((r) => r.controls.day_of_week.value === 1);
  if (!monday) return;

  const source = monday.getRawValue();
  for (const row of rows.controls) {
    if (WEEKDAYS.includes(row.controls.day_of_week.value)) {
      row.patchValue({ is_closed: source.is_closed, opens_at: source.opens_at, closes_at: source.closes_at });
      syncDisabled(row);
      row.markAsDirty();
    }
  }
}

function minutes(time: string | null): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

@Component({
  selector: 'app-gym-timings',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    StatusChipComponent,
    EmptyStateComponent,
    TimeFieldComponent,
  ],
  templateUrl: './gym-timings.component.html',
  styleUrl: './gym-timings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GymTimingsComponent implements HasUnsavedChanges {
  private readonly api = inject(GymTimingsService);
  private readonly notify = inject(NotifyService);

  protected readonly form = new FormGroup({ timings: new FormArray<TimingRow>([]) });
  protected readonly rows = this.form.controls.timings;

  protected readonly timezone = signal('');
  protected readonly isOpenNow = signal(false);
  protected readonly lastUpdated = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);

  /** Re-evaluated on every form change, so the template reflects dirty/valid state and the week preview. */
  private readonly formState = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => ({ dirty: this.form.dirty, valid: this.form.valid, rows: this.rows.getRawValue() })),
    ),
    { requireSync: true },
  );

  protected readonly canSave = computed(() => this.formState().dirty && this.formState().valid && !this.saving());

  protected readonly todayDay = new Date().getDay();

  /** Bars for the week-at-a-glance preview (percent of a 24h day). */
  protected readonly preview = computed(() =>
    this.formState().rows.map((r) => {
      const open = !r.is_closed && !!r.opens_at && !!r.closes_at && r.closes_at > r.opens_at;
      const start = minutes(r.opens_at);
      const end = minutes(r.closes_at);
      return {
        day: r.day_name.slice(0, 3),
        open,
        left: (start / 1440) * 100,
        width: open ? ((end - start) / 1440) * 100 : 0,
        label: open ? `${formatClock(r.opens_at)} – ${formatClock(r.closes_at)}` : 'Closed',
        today: r.day_of_week === this.todayDay,
      };
    }),
  );

  protected readonly weeklyHours = computed(() => {
    const total = this.formState()
      .rows.filter((r) => !r.is_closed && r.opens_at && r.closes_at && r.closes_at > r.opens_at)
      .reduce((sum, r) => sum + minutes(r.closes_at) - minutes(r.opens_at), 0);
    return Math.round((total / 60) * 10) / 10;
  });

  protected readonly firstErrorMessage = firstErrorMessage;

  constructor() {
    this.load();

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      for (const row of this.rows.controls) {
        syncDisabled(row);
      }
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.get().subscribe({
      next: (res) => {
        this.rows.clear({ emitEvent: false });
        for (const t of res.timings) {
          this.rows.push(buildTimingRow(t), { emitEvent: false });
        }
        this.timezone.set(res.timezone);
        this.isOpenNow.set(res.is_open_now);
        this.lastUpdated.set(this.latestUpdate(res.timings));
        this.form.markAsPristine();
        this.form.updateValueAndValidity();
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loadError.set(toApiError(error).message);
        this.loading.set(false);
      },
    });
  }

  protected copyMonday(): void {
    copyMondayToWeekdays(this.rows);
    this.form.markAsDirty();
    this.form.updateValueAndValidity();
    this.notify.info('Copied Monday to Tuesday – Friday. Save to apply.');
  }

  protected hours(row: TimingRow): string {
    const v = row.getRawValue();
    if (v.is_closed) return 'Closed';
    if (!v.opens_at || !v.closes_at || v.closes_at <= v.opens_at) return '—';
    const diff = minutes(v.closes_at) - minutes(v.opens_at);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const timings: GymTimingInput[] = this.rows.getRawValue().map((r) => ({
      day_of_week: r.day_of_week,
      is_closed: r.is_closed,
      opens_at: r.is_closed ? null : r.opens_at,
      closes_at: r.is_closed ? null : r.closes_at,
    }));

    this.saving.set(true);
    this.api.update(timings).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.isOpenNow.set(res.data.is_open_now);
        this.lastUpdated.set(this.latestUpdate(res.data.timings));
        this.form.markAsPristine();
        this.form.updateValueAndValidity();
        this.notify.success(res.message);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const apiError = toApiError(error);
        const unmatched = applyServerErrors(this.form, apiError);
        this.notify.error(unmatched[0] ?? (apiError.errors ? 'Please fix the highlighted days.' : apiError.message));
      },
    });
  }

  /** Error to show under a row: row-level rule first, then server messages on its fields. */
  protected rowError(row: TimingRow): string | null {
    if (row.errors && (row.touched || row.dirty)) {
      return String(Object.values(row.errors)[0]);
    }
    const serverField = [row.controls.opens_at, row.controls.closes_at].find((c) => c.errors?.['server']);
    return serverField ? String(serverField.errors?.['server']) : null;
  }

  private latestUpdate(timings: GymTiming[]): string | null {
    return (
      timings
        .map((t) => t.updated_at)
        .filter((v): v is string => !!v)
        .sort()
        .pop() ?? null
    );
  }
}
