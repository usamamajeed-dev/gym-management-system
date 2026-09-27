import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { NotifyService } from '../ui/notify.service';
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE, toApiError } from './api-error';

/**
 * Global API error handling:
 * 401 → clear the session and go to login (except for the login call itself),
 * 403, 429, network and 5xx → a toast. 409 and 422 pass through for the page to handle.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotifyService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !req.url.startsWith(environment.apiBaseUrl)) {
        return throwError(() => error);
      }

      const isLoginRequest = req.url.endsWith('/auth/login');
      const isLogoutRequest = req.url.endsWith('/auth/logout');

      switch (true) {
        case error.status === 401 && !isLoginRequest && !isLogoutRequest: {
          const onLoginPage = router.url.startsWith('/login');
          auth.clearSession();
          if (!onLoginPage) {
            notify.info('Your session has ended. Please sign in again.');
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          break;
        }
        case error.status === 403:
          notify.error('You do not have permission to do that.');
          break;
        case error.status === 429: {
          const seconds = toApiError(error).retry_after ?? 60;
          notify.error(`Too many attempts. Try again in ${seconds} seconds.`);
          break;
        }
        case error.status === 0:
          notify.error(NETWORK_ERROR_MESSAGE);
          break;
        case error.status >= 500:
          notify.error(GENERIC_ERROR_MESSAGE);
          break;
      }

      return throwError(() => error);
    }),
  );
};
