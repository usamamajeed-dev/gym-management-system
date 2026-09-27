import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable, startWith } from 'rxjs';

import { toApiError } from '../../core/api/api-error';
import { FieldErrorComponent } from '../../core/ui/field-error.component';
import { NotifyService } from '../../core/ui/notify.service';
import { applyServerErrors } from '../../core/utils/form-errors';
import { EventType, EventTypePayload } from './event-type.model';
import { EventTypesService } from './event-types.service';

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export const COLOR_PRESETS = [
  '#4F46E5',
  '#2563EB',
  '#0891B2',
  '#059669',
  '#65A30D',
  '#D97706',
  '#EA580C',
  '#DC2626',
  '#DB2777',
  '#7C3AED',
];

/** Create or edit an event type. Resolves to the saved type, or undefined when cancelled. */
@Component({
  selector: 'app-event-type-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    FieldErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-type-form-dialog.component.html',
  styleUrl: './event-type-form-dialog.component.scss',
})
export class EventTypeFormDialogComponent {
  protected readonly existing = inject<EventType | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EventTypeFormDialogComponent, EventType>);
  private readonly service = inject(EventTypesService);
  private readonly notify = inject(NotifyService);

  protected readonly presets = COLOR_PRESETS;
  protected readonly saving = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.existing?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    color: [this.existing?.color ?? COLOR_PRESETS[0], [Validators.required, Validators.pattern(HEX_COLOR)]],
    description: [this.existing?.description ?? '', [Validators.maxLength(1000)]],
    is_active: [this.existing?.is_active ?? true],
  });

  protected readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    requireSync: true,
  });

  static open(dialog: MatDialog, existing: EventType | null): Observable<EventType | undefined> {
    return dialog.open(EventTypeFormDialogComponent, { data: existing, width: '560px' }).afterClosed();
  }

  /** Colour picker → hex field. */
  onPickerInput(value: string): void {
    this.form.controls.color.setValue(value.toUpperCase());
    this.form.controls.color.markAsDirty();
  }

  /** The picker only accepts complete hex values; keep the last valid one while typing. */
  pickerValue(): string {
    const color = this.value().color ?? '';
    return HEX_COLOR.test(color) ? color.toLowerCase() : '#4f46e5';
  }

  protected choosePreset(color: string): void {
    this.onPickerInput(color);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const body: EventTypePayload = {
      name: v.name.trim(),
      color: v.color.toUpperCase(),
      description: v.description.trim() || null,
      is_active: v.is_active,
    };

    this.saving.set(true);
    const request = this.existing ? this.service.update(this.existing.id, body) : this.service.create(body);
    request.subscribe({
      next: (res) => {
        this.notify.success(res.message);
        this.dialogRef.close(res.data);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const apiError = toApiError(error);
        const unmatched = applyServerErrors(this.form, apiError);
        if (!apiError.errors || unmatched.length) this.notify.error(unmatched[0] ?? apiError.message);
      },
    });
  }
}
