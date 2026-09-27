import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { TokenStorage } from '../auth/token.storage';
import { NotifyService } from '../ui/notify.service';
import { apiErrorInterceptor } from './api-error.interceptor';

const API = environment.apiBaseUrl;

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let notify: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    notify = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotifyService, useValue: notify },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => controller.verify());

  function fail(path: string, status: number, body: object = { success: false, message: 'x' }): void {
    http.get(`${API}/${path}`).subscribe({ error: () => undefined });
    controller.expectOne(`${API}/${path}`).flush(body, { status, statusText: 'Error' });
  }

  it('clears the session and redirects to login on 401', () => {
    const auth = TestBed.inject(AuthService);
    TestBed.inject(TokenStorage).set('tok-123');
    auth.user.set({ id: 1, name: 'A', email: 'a@b.c', roles: [], permissions: [] });

    fail('members', 401);

    expect(TestBed.inject(TokenStorage).get()).toBeNull();
    expect(auth.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.objectContaining({ queryParams: expect.anything() }));
  });

  it('does not redirect when the login call itself returns 401', () => {
    fail('auth/login', 401);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a toast on 403', () => {
    fail('members', 403);

    expect(notify.error).toHaveBeenCalledWith('You do not have permission to do that.');
  });

  it('shows retry_after on 429', () => {
    fail('auth/login', 429, { success: false, message: 'Too many', retry_after: 42 });

    expect(notify.error).toHaveBeenCalledWith('Too many attempts. Try again in 42 seconds.');
  });

  it('passes 422 through for the form to handle', () => {
    fail('members/1', 422, { success: false, message: 'Validation failed', errors: { email: ['Taken'] } });

    expect(notify.error).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
