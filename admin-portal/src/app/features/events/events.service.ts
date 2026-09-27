import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Paginated } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { EventListQuery, EventPayload, GymEvent, ImageState } from './event.model';

/**
 * Admin events. Create and update are multipart (they may carry an image):
 * updates go as POST with _method=PUT, and booleans are sent as 1/0.
 */
@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly api = inject(ApiService);

  list(query: EventListQuery = {}): Observable<Paginated<GymEvent>> {
    return this.api.get<Paginated<GymEvent>>('events', query);
  }

  get(id: number): Observable<GymEvent> {
    return this.api.get<GymEvent>(`events/${id}`);
  }

  create(payload: EventPayload, image: ImageState = { file: null, removed: false }): Observable<ApiResponse<GymEvent>> {
    return this.api.postFormEnvelope<GymEvent>('events', toFormData(payload, image));
  }

  update(
    id: number,
    payload: Partial<EventPayload>,
    image: ImageState = { file: null, removed: false },
  ): Observable<ApiResponse<GymEvent>> {
    const form = toFormData(payload, image);
    form.append('_method', 'PUT');
    return this.api.postFormEnvelope<GymEvent>(`events/${id}`, form);
  }

  /** Publish or unpublish without touching anything else. */
  setPublished(id: number, published: boolean): Observable<ApiResponse<GymEvent>> {
    return this.update(id, { is_published: published });
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.api.deleteEnvelope<null>(`events/${id}`);
  }
}

/**
 * Multipart body for the API. Null values are sent as empty strings (the API treats
 * them as null), booleans as 1/0. An untouched image is left out entirely.
 */
export function toFormData(payload: Partial<EventPayload>, image: ImageState): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0');
    } else {
      form.append(key, value === null ? '' : String(value));
    }
  }

  if (image.file) {
    form.append('image', image.file);
  } else if (image.removed) {
    form.append('remove_image', '1');
  }

  return form;
}
