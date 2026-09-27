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
    <div class="confirm" [attr.data-tone]="tone">
      <div class="confirm__icon">
        <mat-icon class="icon-filled">{{ data.icon ?? defaultIcon }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">{{ data.cancelText ?? 'Cancel' }}</button>
        <button mat-flat-button [class.btn-danger]="tone === 'danger'" [mat-dialog-close]="true" cdkFocusInitial>
          {{ data.confirmText ?? 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .confirm {
      padding-top: 24px;
      --tone: var(--app-primary);
      --tone-soft: var(--app-primary-soft);
    }
    .confirm[data-tone='danger'] {
      --tone: var(--app-danger);
      --tone-soft: var(--app-danger-soft);
    }
    .confirm[data-tone='warning'] {
      --tone: var(--app-warning);
      --tone-soft: var(--app-warning-soft);
    }
    .confirm[data-tone='success'] {
      --tone: var(--app-success);
      --tone-soft: var(--app-success-soft);
    }
    .confirm__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin: 0 24px 12px;
      border-radius: 14px;
      background: var(--tone-soft);
      color: var(--tone);
    }
    p {
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
