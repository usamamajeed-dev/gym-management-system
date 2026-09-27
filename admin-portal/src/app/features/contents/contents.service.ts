import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Paginated } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import {
  Content,
  ContentImageState,
  ContentListItem,
  ContentListQuery,
  ContentPayload,
  ContentType,
} from './content.model';

/**
 * Admin news & policies. Create and update are multipart (they may carry an image);
 * updates go as POST with _method=PUT. Status changes use publish() / archive().
 */
@Injectable({ providedIn: 'root' })
export class ContentsService {
  private readonly api = inject(ApiService);

  list(query: ContentListQuery): Observable<Paginated<ContentListItem>> {
    return this.api.get<Paginated<ContentListItem>>('contents', query);
  }

  get(id: number): Observable<Content> {
    return this.api.get<Content>(`contents/${id}`);
  }

  create(type: ContentType, payload: ContentPayload, image: ContentImageState): Observable<ApiResponse<Content>> {
    const form = toContentFormData(payload, image);
    form.append('type', type);
    return this.api.postFormEnvelope<Content>('contents', form);
  }

  /** Text and image only; the API ignores type and status on update. */
  update(
    id: number,
    payload: Omit<ContentPayload, 'status'>,
    image: ContentImageState,
  ): Observable<ApiResponse<Content>> {
    const form = toContentFormData(payload, image);
    form.append('_method', 'PUT');
    return this.api.postFormEnvelope<Content>(`contents/${id}`, form);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.api.deleteEnvelope<null>(`contents/${id}`);
  }

  publish(id: number): Observable<ApiResponse<Content>> {
    return this.api.postEnvelope<Content>(`contents/${id}/publish`);
  }

  archive(id: number): Observable<ApiResponse<Content>> {
    return this.api.postEnvelope<Content>(`contents/${id}/archive`);
  }
}

export function toContentFormData(payload: Partial<ContentPayload>, image: ContentImageState): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) form.append(key, value === null ? '' : String(value));
  }

  if (image.file) {
    form.append('image', image.file);
  } else if (image.removed) {
    form.append('remove_image', '1');
  }

  return form;
}
