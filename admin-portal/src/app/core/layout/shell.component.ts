import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, filter, map, of } from 'rxjs';

import { GymConfigService } from '../api/gym-config.service';
import { AuthService } from '../auth/auth.service';
import { NAV_ITEMS, NAV_SECTIONS, NavItem } from './nav-items';
import { PendingMembersService } from './pending-members.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatRippleModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly pending = inject(PendingMembersService);
  private readonly router = inject(Router);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly mobileMenuOpen = signal(false);
  protected readonly sidenavOpened = computed(() => !this.isHandset() || this.mobileMenuOpen());

  /** Sections filtered to what this admin may open. */
  protected readonly sections = computed(() => {
    this.auth.user();
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => this.auth.hasPermission(item.permission)),
    })).filter((section) => section.items.length > 0);
  });

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly current = computed<NavItem | undefined>(() =>
    NAV_ITEMS.find((item) => this.url().split('?')[0].startsWith(item.path)),
  );

  /** Today's date in the gym's timezone (the browser's own zone if it can't be loaded). */
  protected readonly today = toSignal(
    inject(GymConfigService)
      .timezone()
      .pipe(
        catchError(() => of(undefined)),
        map((timeZone) =>
          new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone }).format(
            new Date(),
          ),
        ),
      ),
    { initialValue: '' },
  );

  constructor() {
    this.pending.refresh();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.mobileMenuOpen.set(false);
        this.pending.refresh();
      });
  }

  protected toggleMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected onSidenavClosed(): void {
    this.mobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
