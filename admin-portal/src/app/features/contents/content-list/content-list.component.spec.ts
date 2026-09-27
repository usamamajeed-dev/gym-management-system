import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ContentsService } from '../contents.service';
import { ContentListComponent } from './content-list.component';

describe('ContentListComponent', () => {
  it('lists the type given by the route (policies)', async () => {
    const list = vi
      .fn()
      .mockReturnValue(
        of({ list: [], pagination: { total: 0, count: 0, per_page: 10, current_page: 1, total_pages: 1 } }),
      );

    TestBed.configureTestingModule({
      imports: [ContentListComponent],
      providers: [
        provideRouter([]),
        { provide: ContentsService, useValue: { list } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ status: 'archived' })) } },
      ],
    });

    const fixture = TestBed.createComponent(ContentListComponent);
    fixture.componentRef.setInput('type', 'policy');
    await fixture.whenStable();

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ type: 'policy', status: 'archived' }));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Policies');
    expect(el.querySelector('.info-banner')).toBeNull();
  });
});
