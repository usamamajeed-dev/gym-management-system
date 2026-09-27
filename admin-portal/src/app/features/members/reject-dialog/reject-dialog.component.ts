import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';

import { FieldErrorComponent } from '../../../core/ui/field-error.component';

export interface RejectDialogData {
  memberName: string;
}

export const REJECT_REASON_MIN = 5;
export const REJECT_REASON_MAX = 500;

/** Asks for the rejection reason (shown to the member when they try to log in). Resolves to the reason or undefined. */
@Component({
  selector: 'app-reject-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FieldErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reject-dialog.component.html',
  styleUrl: './reject-dialog.component.scss',
})
export class RejectDialogComponent {
  protected readonly data = inject<RejectDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RejectDialogComponent, string>);

  protected readonly max = REJECT_REASON_MAX;
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(REJECT_REASON_MIN), Validators.maxLength(REJECT_REASON_MAX)],
  });
  protected readonly value = toSignal(this.reason.valueChanges, { initialValue: '' });

  protected readonly suggestions = [
    'Incomplete registration details.',
    'Could not verify your identity.',
    'Membership is currently full.',
  ];

  static open(dialog: MatDialog, data: RejectDialogData): Observable<string | undefined> {
    return dialog.open(RejectDialogComponent, { data, width: '520px' }).afterClosed();
  }

  protected useSuggestion(text: string): void {
    this.reason.setValue(text);
    this.reason.markAsDirty();
  }

  protected submit(): void {
    const reason = this.reason.value.trim();

    if (this.reason.invalid || reason.length < REJECT_REASON_MIN) {
      this.reason.markAsTouched();
      return;
    }

    this.dialogRef.close(reason);
  }
}
