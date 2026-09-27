import { Routes } from '@angular/router';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Members · Gym Admin',
    loadComponent: () => import('./member-list/member-list.component').then((m) => m.MemberListComponent),
  },
  {
    path: ':id',
    title: 'Member · Gym Admin',
    loadComponent: () => import('./member-detail/member-detail.component').then((m) => m.MemberDetailComponent),
  },
];
