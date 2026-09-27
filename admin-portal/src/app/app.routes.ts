import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { ShellComponent } from './core/layout/shell.component';
import { unsavedChangesGuard } from './core/utils/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Gym Admin',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [permissionGuard('dashboard.view')],
        title: 'Dashboard · Gym Admin',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'members',
        canActivate: [permissionGuard('members.view')],
        loadChildren: () => import('./features/members/members.routes').then((m) => m.MEMBERS_ROUTES),
      },
      {
        path: 'gym-timings',
        canActivate: [permissionGuard('timings.manage')],
        canDeactivate: [unsavedChangesGuard],
        title: 'Gym Timings · Gym Admin',
        loadComponent: () => import('./features/gym-timings/gym-timings.component').then((m) => m.GymTimingsComponent),
      },
      {
        path: 'events',
        canActivate: [permissionGuard('events.manage')],
        loadChildren: () => import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
      },
      {
        path: 'event-types',
        canActivate: [permissionGuard('events.manage')],
        title: 'Event Types · Gym Admin',
        loadComponent: () =>
          import('./features/event-types/event-type-list.component').then((m) => m.EventTypeListComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
