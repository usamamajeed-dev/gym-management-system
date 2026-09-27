import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Paginated } from '../../core/api/api.models';
import { ApiService } from '../../core/api/api.service';
import { Member, MemberListQuery, MemberUpdate } from './member.model';

/** Admin member endpoints. Actions return the full envelope so the server message can be shown. */
@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly api = inject(ApiService);

  list(query: MemberListQuery = {}): Observable<Paginated<Member>> {
    return this.api.get<Paginated<Member>>('members', query);
  }

  get(id: number): Observable<Member> {
    return this.api.get<Member>(`members/${id}`);
  }

  update(id: number, body: MemberUpdate): Observable<ApiResponse<Member>> {
    return this.api.putEnvelope<Member>(`members/${id}`, body);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.api.deleteEnvelope<null>(`members/${id}`);
  }

  approve(id: number): Observable<ApiResponse<Member>> {
    return this.api.postEnvelope<Member>(`members/${id}/approve`);
  }

  reject(id: number, reason: string): Observable<ApiResponse<Member>> {
    return this.api.postEnvelope<Member>(`members/${id}/reject`, { reason });
  }

  activate(id: number): Observable<ApiResponse<Member>> {
    return this.api.postEnvelope<Member>(`members/${id}/activate`);
  }

  deactivate(id: number): Observable<ApiResponse<Member>> {
    return this.api.postEnvelope<Member>(`members/${id}/deactivate`);
  }
}
