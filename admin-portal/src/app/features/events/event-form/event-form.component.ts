import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';

import { errorStatus, toApiError } from '../../../core/api/api-error';
import { GymConfigService } from '../../../core/api/gym-config.service';
import { EmptyStateComponent } from '../../../core/ui/empty-state.component';
import { FieldErrorComponent } from '../../../core/ui/field-error.component';
import { ImageChange, ImageUploadComponent } from '../../../core/ui/image-upload.component';
import { NotifyService } from '../../../core/ui/notify.service';
import { PageHeaderComponent } from '../../../core/ui/page-header.component';
import { TimeFieldComponent } from '../../../core/ui/time-field.component';
import { applyServerErrors } from '../../../core/utils/form-errors';
import { formatClock, gymParts } from '../../../core/utils/date.utils';
import { HasUnsavedChanges } from '../../../core/utils/unsaved-changes.guard';
import { EventTypeOption } from '../../event-types/event-type.model';
import { EventTypesService } from '../../event-types/event-types.service';
import { EventPayload, GymEvent, ImageState } from '../event.model';
import { EventsService } from '../events.service';

function ymd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "YYYY-MM-DD HH:mm" from a date + time pair, or null when either is missing. */
export function combine(date: Date | null | undefined, time: string | null | undefined): string | null {
  return date && time ? `${ymd(date)} ${time}` : null;
}

/**
 * The event can't end before it starts. An end is optional, but if either the
 * end date or time is given, both are needed.
 */
export const scheduleValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const v = group.value as { start_date: Date | null; start_time: string; end_date: Date | null; end_time: string };
  const start = combine(v.start_date, v.start_time);
  const hasEndPart = !!v.end_date || !!v.end_time;

  if (!hasEndPart) return null;
  if (!v.end_date || !v.end_time) return { endIncomplete: 'Set both the end date and time, or leave both empty.' };

  const end = combine(v.end_date, v.end_time);
  return start && end && end < start ? { endBeforeStart: 'The event must end after it starts.' } : null;
};

@Component({
  selector: 'app-event-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    FieldErrorComponent,
    ImageUploadComponent,
    EmptyStateComponent,
    TimeFieldComponent,
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventFormComponent implements OnInit, HasUnsavedChanges {
  private readonly events = inject(EventsService);
  private readonly types = inject(EventTypesService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);

  /** Route param on /events/:id/edit; undefined on /events/new. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly timezone = toSignal(inject(GymConfigService).timezone(), { initialValue: '' });
  protected readonly options = signal<EventTypeOption[]>([]);
  protected readonly event = signal<GymEvent | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly imageError = signal<string | null>(null);
  private readonly image = signal<ImageState>({ file: null, removed: false });
  private saved = false;

  protected readonly form = inject(FormBuilder).group(
    {
      event_type_id: [null as number | null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.maxLength(5000)],
      location: ['', Validators.maxLength(150)],
      capacity: [null as number | null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
      start_date: [null as Date | null, Validators.required],
      start_time: ['18:00', Validators.required],
      end_date: [null as Date | null],
      end_time: [''],
      is_published: [false],
    },
    { validators: scheduleValidator },
  );

  protected readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    requireSync: true,
  });

  protected readonly selectedType = computed(() => this.options().find((o) => o.value === this.value().event_type_id));

  protected readonly scheduleError = computed(() => {
    this.value();
    const errors = this.form.errors;
    return errors ? (Object.values(errors)[0] as string) : null;
  });

  protected readonly previewDate = computed(() => {
    const v = this.value();
    if (!v.start_date) return 'Pick a date';
    const date = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(
      v.start_date,
    );
    const end =
      v.end_time && (!v.end_date || ymd(v.end_date) === ymd(v.start_date)) ? ` – ${formatClock(v.end_time)}` : '';
    return `${date} · ${v.start_time ? formatClock(v.start_time) : '--:--'}${end}`;
  });

  ngOnInit(): void {
    this.types.options().subscribe((options) => this.options.set(options));

    const id = Number(this.id());
    if (id) {
      this.loadEvent(id);
    } else {
      this.form.controls.start_date.setValue(new Date());
      this.form.markAsPristine();
    }
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && (this.form.dirty || this.image().file !== null || this.image().removed);
  }

  protected loadEvent(id: number): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.events.get(id).subscribe({
      next: (event) => {
        this.event.set(event);
        const start = gymParts(event.starts_at);
        const end = gymParts(event.ends_at);
        this.form.reset({
          event_type_id: event.event_type?.value ?? null,
          title: event.title,
          description: event.description ?? '',
          location: event.location ?? '',
          capacity: event.capacity,
          start_date: start ? toDate(start.date) : null,
          start_time: start?.time ?? '',
          end_date: end ? toDate(end.date) : null,
          end_time: end?.time ?? '',
          is_published: event.is_published,
        });
        // Keep an inactive type visible when editing an event that already uses it.
        if (event.event_type && !this.options().some((o) => o.value === event.event_type?.value)) {
          this.options.update((o) => [...o, event.event_type as EventTypeOption]);
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loadError.set(errorStatus(error) === 404 ? 'This event no longer exists.' : toApiError(error).message);
        this.loading.set(false);
      },
    });
  }

  protected onImage(change: ImageChange): void {
    this.image.set(change);
    this.imageError.set(null);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.notify.error('Please fix the highlighted fields.');
      return;
    }

    const v = this.form.getRawValue();
    const payload: EventPayload = {
      event_type_id: v.event_type_id as number,
      title: (v.title ?? '').trim(),
      description: v.description?.trim() || null,
      location: v.location?.trim() || null,
      starts_at: combine(v.start_date, v.start_time) as string,
      ends_at: combine(v.end_date, v.end_time),
      capacity: v.capacity ? Number(v.capacity) : null,
      is_published: !!v.is_published,
    };

    const existing = this.event();
    const request = existing
      ? this.events.update(existing.id, payload, this.image())
      : this.events.create(payload, this.image());

    this.saving.set(true);
    request.subscribe({
      next: (res) => {
        this.saved = true;
        this.notify.success(res.message);
        void this.router.navigate(['/events']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const apiError = toApiError(error);
        const errors = { ...(apiError.errors ?? {}) };
        // The API validates combined datetimes; show those messages on the date fields.
        if (errors['starts_at']) errors['start_date'] = errors['starts_at'];
        if (errors['ends_at']) errors['end_date'] = errors['ends_at'];
        if (errors['image']) this.imageError.set(errors['image'][0]);
        delete errors['starts_at'];
        delete errors['ends_at'];
        delete errors['image'];
        const unmatched = applyServerErrors(this.form, { errors });
        this.notify.error(unmatched[0] ?? (apiError.errors ? 'Please fix the highlighted fields.' : apiError.message));
      },
    });
  }

  protected cancel(): void {
    void this.router.navigate(['/events']);
  }
}
