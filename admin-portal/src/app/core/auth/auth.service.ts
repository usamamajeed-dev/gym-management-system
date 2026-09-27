import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';

import { ApiService } from '../api/api.service';
import { AdminUser, AuthToken } from './auth.models';
import { TokenStorage } from './token.storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(TokenStorage);
  private readonly router = inject(Router);

  readonly user = signal<AdminUser | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly initials = computed(() => initialsOf(this.user()?.name ?? ''));

  /** Logs in, stores the token, then loads the admin profile. */
  login(email: string, password: string): Observable<AdminUser> {
    return this.api.post<AuthToken>('auth/login', { email, password }).pipe(
      tap((result) => this.storage.set(result.token)),
      switchMap(() => this.api.get<AdminUser>('auth/me')),
      tap((user) => this.user.set(user)),
    );
  }

  /** Revokes the token on the server (best effort), clears the session and returns to login. */
  logout(): void {
    const hadToken = this.storage.get() !== null;
    const done = () => {
      this.clearSession();
      void this.router.navigate(['/login']);
    };

    if (!hadToken) {
      done();
      return;
    }

    this.api
      .post<null>('auth/logout')
      .pipe(catchError(() => of(null)))
      .subscribe(() => done());
  }

  /** On app start: turn a stored token back into a signed-in admin, or forget it. */
  restoreSession(): Promise<void> {
    if (this.storage.get() === null) {
      return Promise.resolve();
    }

    return firstValueFrom(
      this.api.get<AdminUser>('auth/me').pipe(
        tap((user) => this.user.set(user)),
        map(() => undefined),
        catchError(() => {
          this.clearSession();
          return of(undefined);
        }),
      ),
    );
  }

  clearSession(): void {
    this.storage.clear();
    this.user.set(null);
  }

  hasPermission(permission: string): boolean {
    return this.user()?.permissions.includes(permission) ?? false;
  }
}

/** "Jane Mary Doe" → "JD". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';

  return (first + last).toUpperCase();
}
