import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { NAV_ITEMS } from '../layout/nav-items';
import { AuthService } from './auth.service';

/**
 * Route guard factory: `canActivate: [permissionGuard('members.view')]`.
 * Without the permission, the admin is sent to the dashboard, or to the first
 * section they may open when the dashboard itself is the forbidden page.
 */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasPermission(permission)) {
      return true;
    }

    if (permission !== 'dashboard.view' && auth.hasPermission('dashboard.view')) {
      return router.createUrlTree(['/dashboard']);
    }

    const fallback = NAV_ITEMS.find((item) => auth.hasPermission(item.permission));

    return router.createUrlTree([fallback ? fallback.path : '/login']);
  };
}
