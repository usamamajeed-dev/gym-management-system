import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '../../core/utils/unsaved-changes.guard';

export const EVENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Events · Gym Admin',
    loadComponent: () => import('./event-list/event-list.component').then((m) => m.EventListComponent),
  },
  {
    path: 'new',
    title: 'New event · Gym Admin',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./event-form/event-form.component').then((m) => m.EventFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit event · Gym Admin',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./event-form/event-form.component').then((m) => m.EventFormComponent),
  },
];
