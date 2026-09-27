import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { EventPayload } from './event.model';
import { EventsService, toFormData } from './events.service';

const API = environment.apiBaseUrl;
const PAYLOAD: EventPayload = {
  event_type_id: 3,
  title: 'Yoga Class',
  description: null,
  location: 'Studio 2',
  starts_at: '2026-10-05 18:00',
  ends_at: null,
  capacity: 20,
  is_published: true,
};

describe('EventsService', () => {
  let service: EventsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EventsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('update sends multipart POST with _method=PUT and omits an untouched image', () => {
    service.update(9, PAYLOAD).subscribe();

    const req = http.expectOne(`${API}/events/9`);
    const body = req.request.body as FormData;
    expect(req.request.method).toBe('POST');
    expect(body.get('_method')).toBe('PUT');
    expect(body.get('title')).toBe('Yoga Class');
    expect(body.get('is_published')).toBe('1');
    expect(body.get('description')).toBe('');
    expect(body.has('image')).toBe(false);
    expect(body.has('remove_image')).toBe(false);
    req.flush({ success: true, message: 'ok', data: {} });
  });

  it('update includes remove_image when the image was removed', () => {
    service.update(9, { title: 'X' }, { file: null, removed: true }).subscribe();

    const body = http.expectOne(`${API}/events/9`).request.body as FormData;
    expect(body.get('remove_image')).toBe('1');
    expect(body.has('image')).toBe(false);
  });

  it('create attaches a newly picked image', () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    service.create(PAYLOAD, { file, removed: false }).subscribe();

    const req = http.expectOne(`${API}/events`);
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('image')).toBeInstanceOf(File);
    expect((req.request.body as FormData).has('_method')).toBe(false);
  });

  it('publish toggle sends only is_published', () => {
    service.setPublished(4, false).subscribe();

    const body = http.expectOne(`${API}/events/4`).request.body as FormData;
    expect([...body.keys()].sort()).toEqual(['_method', 'is_published']);
    expect(body.get('is_published')).toBe('0');
  });

  it('toFormData sends booleans as 1/0', () => {
    expect(toFormData({ is_published: false }, { file: null, removed: false }).get('is_published')).toBe('0');
  });
});
