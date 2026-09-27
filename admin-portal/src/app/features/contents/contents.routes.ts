import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '../../core/utils/unsaved-changes.guard';

/** Mounted twice: /news (data.type = 'news') and /policies (data.type = 'policy'). */
export const CONTENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./content-list/content-list.component').then((m) => m.ContentListComponent),
  },
  {
    path: 'new',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./content-form/content-form.component').then((m) => m.ContentFormComponent),
  },
  {
    path: ':id/edit',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./content-form/content-form.component').then((m) => m.ContentFormComponent),
  },
];
