import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Paginated } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { EventType, EventTypeListQuery, EventTypeOption, EventTypePayload } from './event-type.model';

@Injectable({ providedIn: 'root' })
export class EventTypesService {
  private readonly api = inject(ApiService);

  list(query: EventTypeListQuery = {}): Observable<Paginated<EventType>> {
    return this.api.get<Paginated<EventType>>('event-types', query);
  }

  /** Active types for dropdowns. */
  options(): Observable<EventTypeOption[]> {
    return this.api.get<EventTypeOption[]>('event-types/options');
  }

  get(id: number): Observable<EventType> {
    return this.api.get<EventType>(`event-types/${id}`);
  }

  create(body: EventTypePayload): Observable<ApiResponse<EventType>> {
    return this.api.postEnvelope<EventType>('event-types', body);
  }

  update(id: number, body: Partial<EventTypePayload>): Observable<ApiResponse<EventType>> {
    return this.api.putEnvelope<EventType>(`event-types/${id}`, body);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.api.deleteEnvelope<null>(`event-types/${id}`);
  }
}
