import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SILENT_REQUEST } from '../ui/loading.service';
import { ApiResponse } from './api.models';

type QueryParams = Record<string, unknown>;

/**
 * Thin wrapper around HttpClient for the admin API. Every call returns the
 * unwrapped `data` of the response envelope.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** `silent` keeps the request from showing the global loading bar (background refreshes). */
  get<T>(path: string, params?: QueryParams, options: { silent?: boolean } = {}): Observable<T> {
    const context = new HttpContext().set(SILENT_REQUEST, options.silent ?? false);

    return this.http
      .get<ApiResponse<T>>(this.url(path), { params: this.toParams(params), context })
      .pipe(map((r) => r.data));
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.url(path), body).pipe(map((r) => r.data));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.url(path), body).pipe(map((r) => r.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(this.url(path)).pipe(map((r) => r.data));
  }

  /** Multipart POST for uploads. For updates, append `_method=PUT` to the form data. */
  postForm<T>(path: string, form: FormData): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.url(path), form).pipe(map((r) => r.data));
  }

  // Envelope variants keep `message` for actions whose snackbar shows the server's own text.

  postEnvelope<T>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), body);
  }

  putEnvelope<T>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.url(path), body);
  }

  deleteEnvelope<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.url(path));
  }

  postFormEnvelope<T>(path: string, form: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), form);
  }

  url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  /** Drops undefined, null and empty-string values so they never reach the query string. */
  private toParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
