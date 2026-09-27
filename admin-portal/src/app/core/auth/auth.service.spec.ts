import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService, initialsOf } from './auth.service';
import { TokenStorage } from './token.storage';

const API = environment.apiBaseUrl;
const ADMIN = { id: 1, name: 'Gym Admin', email: 'admin@gym.test', roles: ['admin'], permissions: ['members.view'] };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorage);
  });

  afterEach(() => http.verify());

  it('login stores the token and loads the admin', () => {
    service.login('admin@gym.test', 'Admin@12345').subscribe();

    const login = http.expectOne(`${API}/auth/login`);
    expect(login.request.body).toEqual({ email: 'admin@gym.test', password: 'Admin@12345' });
    login.flush({ success: true, message: 'Logged in successfully', data: { token: 'tok-123', user: ADMIN } });

    expect(storage.get()).toBe('tok-123');

    http.expectOne(`${API}/auth/me`).flush({ success: true, message: 'ok', data: ADMIN });

    expect(service.user()).toEqual(ADMIN);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.hasPermission('members.view')).toBe(true);
    expect(service.hasPermission('members.approve')).toBe(false);
  });

  it('logout revokes the token, clears the session and goes to login', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    storage.set('tok-123');
    service.user.set(ADMIN);

    service.logout();
    http.expectOne(`${API}/auth/logout`).flush({ success: true, message: 'Logged out successfully', data: null });

    expect(storage.get()).toBeNull();
    expect(service.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logout still clears the session when the API call fails', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    storage.set('tok-123');
    service.user.set(ADMIN);

    service.logout();
    http.expectOne(`${API}/auth/logout`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(storage.get()).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('restoreSession forgets an invalid token', async () => {
    storage.set('expired');

    const done = service.restoreSession();
    http.expectOne(`${API}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await done;

    expect(storage.get()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('builds initials from a name', () => {
    expect(initialsOf('Jane Mary Doe')).toBe('JD');
    expect(initialsOf('admin')).toBe('A');
    expect(initialsOf('  ')).toBe('?');
  });
});
