import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivateFn } from '@angular/router';

import { ConfirmDialogComponent } from '../ui/confirm-dialog.component';

/** Implemented by pages with editable forms. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a page whose form has unsaved changes. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return ConfirmDialogComponent.open(inject(MatDialog), {
    title: 'Discard unsaved changes?',
    message: "You've made changes that haven't been saved. If you leave now, they'll be lost.",
    confirmText: 'Discard changes',
    cancelText: 'Keep editing',
    tone: 'warning',
    icon: 'edit_off',
  });
};
