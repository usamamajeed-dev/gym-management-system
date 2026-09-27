import { inject, Injectable, signal } from '@angular/core';

import { ApiService } from '../api/api.service';
import { Paginated } from '../api/api.models';
import { AuthService } from '../auth/auth.service';

/** Number of members awaiting approval, for the sidebar badge and the Pending tab. */
@Injectable({ providedIn: 'root' })
export class PendingMembersService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly count = signal(0);

  refresh(): void {
    if (!this.auth.hasPermission('members.view')) {
      return;
    }

    this.api
      .get<Paginated<unknown>>('members', { status: 'pending', length: 1 }, { silent: true })
      .subscribe({ next: (page) => this.count.set(page.pagination.total), error: () => undefined });
  }
}
