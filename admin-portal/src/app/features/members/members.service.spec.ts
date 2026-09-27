import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { MembersService } from './members.service';

const API = environment.apiBaseUrl;

describe('MembersService', () => {
  let service: MembersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MembersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists members with filters and drops empty ones', () => {
    service
      .list({ status: 'pending', search: '', is_active: undefined, column: 'name', dir: 'asc', page: 2, length: 25 })
      .subscribe();

    const req = http.expectOne((r) => r.url === `${API}/members`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(['column', 'dir', 'length', 'page', 'status']);
    expect(req.request.params.get('status')).toBe('pending');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ success: true, message: 'ok', data: { list: [], pagination: {} } });
  });

  it('builds the action URLs', () => {
    service.approve(7).subscribe();
    service.reject(7, 'Missing ID').subscribe();
    service.activate(7).subscribe();
    service.deactivate(7).subscribe();
    service.update(7, { name: 'New' }).subscribe();
    service.delete(7).subscribe();

    expect(http.expectOne(`${API}/members/7/approve`).request.method).toBe('POST');
    const reject = http.expectOne(`${API}/members/7/reject`);
    expect(reject.request.body).toEqual({ reason: 'Missing ID' });
    expect(http.expectOne(`${API}/members/7/activate`).request.method).toBe('POST');
    expect(http.expectOne(`${API}/members/7/deactivate`).request.method).toBe('POST');
    expect(http.expectOne((r) => r.method === 'PUT' && r.url === `${API}/members/7`).request.body).toEqual({
      name: 'New',
    });
    expect(http.expectOne((r) => r.method === 'DELETE' && r.url === `${API}/members/7`)).toBeTruthy();
  });
});
