import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { Dashboard } from './dashboard.model';
import { DashboardService } from './dashboard.service';

const DATA: Dashboard = {
  members: { total: 12, pending: 3, approved: 8, rejected: 1, active: 7, inactive: 1, new_this_month: 4 },
  registrations_by_month: [
    { month: '2026-05', count: 0 },
    { month: '2026-06', count: 2 },
    { month: '2026-07', count: 1 },
    { month: '2026-08', count: 0 },
    { month: '2026-09', count: 5 },
    { month: '2026-10', count: 4 },
  ],
  pending_members: [],
  recent_members: [],
  events: { this_month: 6, upcoming: 4, drafts: 2, next: [] },
  contents: { news_published: 9, policies_published: 3, drafts: 1, archived: 2, latest: [] },
  gym: { is_open_now: true, timezone: 'UTC', today_timing: null },
};

describe('DashboardComponent', () => {
  function setup(response: ReturnType<DashboardService['get']>) {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardService, useValue: { get: () => response } },
      ],
    });
    return TestBed.createComponent(DashboardComponent);
  }

  it('shows every KPI from the API response', async () => {
    const fixture = setup(of(DATA));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const kpis = Array.from(el.querySelectorAll('.kpi')).map((k) => [
      k.querySelector('.kpi__label')?.textContent?.trim(),
      Number(k.querySelector('.kpi__value')?.textContent),
    ]);

    expect(Object.fromEntries(kpis)).toEqual({
      'Total members': 12,
      'Pending approvals': 3,
      'Active members': 7,
      'New this month': 4,
      'Events this month': 6,
      'Published news': 9,
    });
    expect(el.querySelector('.kpi--alert')?.textContent).toContain('Pending approvals');
  });

  it('draws six bars and highlights the current month', async () => {
    const fixture = setup(of(DATA));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const values = Array.from(el.querySelectorAll('.chart__value')).map((v) => Number(v.textContent));
    expect(values).toEqual([0, 2, 1, 0, 5, 4]);
    expect(el.querySelectorAll('.chart__bar--current').length).toBe(1);
  });

  it('shows a retry state when loading fails', async () => {
    const fixture = setup(throwError(() => new Error('offline')));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain("Couldn't load the dashboard");
  });
});
