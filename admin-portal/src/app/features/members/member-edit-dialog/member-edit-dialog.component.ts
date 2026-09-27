import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

import { toApiError } from '../../../core/api/api-error';
import { FieldErrorComponent } from '../../../core/ui/field-error.component';
import { NotifyService } from '../../../core/ui/notify.service';
import { applyServerErrors } from '../../../core/utils/form-errors';
import { GENDER_LABELS, Gender, Member, MemberUpdate } from '../member.model';
import { MembersService } from '../members.service';

const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

/** Edits a member's profile. Resolves to the updated member, or undefined when cancelled. */
@Component({
  selector: 'app-member-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FieldErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-edit-dialog.component.html',
})
export class MemberEditDialogComponent {
  private readonly member = inject<Member>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MemberEditDialogComponent, Member>);
  private readonly members = inject(MembersService);
  private readonly notify = inject(NotifyService);

  protected readonly genders = Object.entries(GENDER_LABELS) as [Gender, string][];
  protected readonly today = new Date();
  protected readonly saving = signal(false);

  protected readonly form = inject(FormBuilder).group({
    name: [this.member.name, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: [this.member.email, [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: [this.member.phone ?? '', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    date_of_birth: [this.member.date_of_birth ? parseDate(this.member.date_of_birth) : null],
    gender: [this.member.gender as Gender | null],
    address: [this.member.address ?? '', [Validators.maxLength(255)]],
    emergency_contact_name: [this.member.emergency_contact_name ?? '', [Validators.maxLength(100)]],
    emergency_contact_phone: [this.member.emergency_contact_phone ?? '', [Validators.pattern(PHONE_PATTERN)]],
  });

  static open(dialog: MatDialog, member: Member): Observable<Member | undefined> {
    return dialog.open(MemberEditDialogComponent, { data: member, width: '640px' }).afterClosed();
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: MemberUpdate = {
      name: value.name?.trim(),
      email: value.email?.trim(),
      phone: value.phone?.replace(/[^\d+]/g, '') || null,
      date_of_birth: value.date_of_birth ? formatDate(value.date_of_birth) : null,
      gender: value.gender ?? null,
      address: value.address?.trim() || null,
      emergency_contact_name: value.emergency_contact_name?.trim() || null,
      emergency_contact_phone: value.emergency_contact_phone?.replace(/[^\d+]/g, '') || null,
    };

    this.saving.set(true);
    this.members.update(this.member.id, body).subscribe({
      next: (response) => {
        this.notify.success(response.message);
        this.dialogRef.close(response.data);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const apiError = toApiError(error);
        const unmatched = applyServerErrors(this.form, apiError);
        if (!apiError.errors || unmatched.length) {
          this.notify.error(unmatched[0] ?? apiError.message);
        }
      },
    });
  }
}

function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
