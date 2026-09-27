import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map } from 'rxjs';

export type ConfirmTone = 'primary' | 'danger' | 'warning' | 'success';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  icon?: string;
}

const DEFAULT_ICONS: Record<ConfirmTone, string> = {
  primary: 'help',
  danger: 'delete',
  warning: 'warning',
  success: 'check_circle',
};

/** Yes/no confirmation. Resolves to true only when the admin confirms. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-head">
      <span class="dialog-icon" [class]="'dialog-icon dialog-icon--' + tone">
        <mat-icon class="icon-filled">{{ data.icon ?? defaultIcon }}</mat-icon>
      </span>
      <div>
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <p class="dialog-sub">{{ data.message }}</p>
      </div>
    </div>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText ?? 'Cancel' }}</button>
      <button
        mat-flat-button
        [class.btn-danger]="tone === 'danger'"
        [class.btn-success]="tone === 'success'"
        [class.btn-warning]="tone === 'warning'"
        [mat-dialog-close]="true"
        cdkFocusInitial
      >
        {{ data.confirmText ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-sub {
      margin-top: 6px;
      line-height: 1.6;
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  protected readonly tone: ConfirmTone = this.data.tone ?? 'primary';
  protected readonly defaultIcon = DEFAULT_ICONS[this.tone];

  static open(dialog: MatDialog, data: ConfirmDialogData): Observable<boolean> {
    return dialog
      .open(ConfirmDialogComponent, { data, width: '440px', maxWidth: '92vw', autoFocus: false })
      .afterClosed()
      .pipe(map((result) => result === true));
  }
}
