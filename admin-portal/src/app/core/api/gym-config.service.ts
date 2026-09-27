import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';

import { ApiService } from './api.service';

/** Gym-wide settings the portal needs in several places (currently the timezone), fetched once. */
@Injectable({ providedIn: 'root' })
export class GymConfigService {
  private readonly api = inject(ApiService);
  private timezone$?: Observable<string>;
  private cached?: string;

  /** The gym's timezone, e.g. "Asia/Karachi". Times entered in the portal are in this zone. */
  timezone(): Observable<string> {
    if (this.cached) {
      return of(this.cached);
    }

    this.timezone$ ??= this.api.get<{ timezone: string }>('gym-timings', undefined, { silent: true }).pipe(
      map((res) => res.timezone),
      tap((tz) => (this.cached = tz)),
      shareReplay(1),
    );

    return this.timezone$;
  }
}
