import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ContentsService } from '../contents.service';
import { buildContentPayload, semanticBody } from './content-form.component';

describe('content form payload', () => {
  it('sends status=published when "Publish now" is chosen for a new item', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);

    const payload = buildContentPayload({ title: ' Open Day ', excerpt: '', saveAs: 'published' }, '<p>Hi</p>', true);
    TestBed.inject(ContentsService).create('news', payload, { file: null, removed: false }).subscribe();

    const body = http.expectOne(`${environment.apiBaseUrl}/contents`).request.body as FormData;
    expect(body.get('status')).toBe('published');
    expect(body.get('type')).toBe('news');
    expect(body.get('title')).toBe('Open Day');
    expect(body.get('excerpt')).toBe('');
    http.verify();
  });

  it('never sends status when updating', () => {
    expect(buildContentPayload({ title: 'X', excerpt: '', saveAs: 'published' }, '<p>x</p>', false)).not.toHaveProperty(
      'status',
    );
  });

  it('keeps semantic lists and turns &nbsp; back into spaces', () => {
    const quill = {
      getText: () => 'Hello world\n',
      getSemanticHTML: () => '<p>Hello&nbsp;world</p><ul><li>One</li></ul>',
    };

    expect(semanticBody(quill)).toBe('<p>Hello world</p><ul><li>One</li></ul>');
    expect(semanticBody({ getText: () => '\n', getSemanticHTML: () => '<p></p>' })).toBe('');
  });
});
