import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { TokenStorage } from './token.storage';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('attaches the bearer token and JSON accept header to API requests', () => {
    TestBed.inject(TokenStorage).set('tok-123');

    http.get(`${environment.apiBaseUrl}/members`).subscribe();
    const req = controller.expectOne(`${environment.apiBaseUrl}/members`);

    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({});
  });

  it('sends no Authorization header without a token', () => {
    http.get(`${environment.apiBaseUrl}/auth/login`).subscribe();
    const req = controller.expectOne(`${environment.apiBaseUrl}/auth/login`);

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('leaves requests to other hosts untouched', () => {
    TestBed.inject(TokenStorage).set('tok-123');

    http.get('https://example.com/data.json').subscribe();
    const req = controller.expectOne('https://example.com/data.json');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
