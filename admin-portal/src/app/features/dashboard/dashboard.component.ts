import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { PageHeaderComponent } from '../../core/ui/page-header.component';

/** Landing page. The full overview is built on top of this. */
@Component({
  selector: 'app-dashboard',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-header title="Dashboard" [subtitle]="'Welcome back, ' + (auth.user()?.name ?? '') + '.'" />`,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
}
