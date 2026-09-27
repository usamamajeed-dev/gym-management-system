import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { GymTimingInput, GymTimingsResponse } from './gym-timing.model';

@Injectable({ providedIn: 'root' })
export class GymTimingsService {
  private readonly api = inject(ApiService);

  /** The week, Monday first, with the gym timezone and open-now status. */
  get(): Observable<GymTimingsResponse> {
    return this.api.get<GymTimingsResponse>('gym-timings');
  }

  /** Replaces all seven days. */
  update(timings: GymTimingInput[]): Observable<ApiResponse<GymTimingsResponse>> {
    return this.api.putEnvelope<GymTimingsResponse>('gym-timings', { timings });
  }
}
