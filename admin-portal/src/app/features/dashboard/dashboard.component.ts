import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Params, RouterLink } from '@angular/router';

import { toApiError } from '../../core/api/api-error';
import { AuthService, initialsOf } from '../../core/auth/auth.service';
import { PermissionDirective } from '../../core/auth/permission.directive';
import { EmptyStateComponent } from '../../core/ui/empty-state.component';
import { PageHeaderComponent } from '../../core/ui/page-header.component';
import { StatusChipComponent } from '../../core/ui/status-chip.component';
import { formatDate, formatTimeRange, gymParts, timeAgo } from '../../core/utils/date.utils';
import { MemberActionsService } from '../members/member-actions.service';
import { Member } from '../members/member.model';
import { Dashboard } from './dashboard.model';
import { DashboardService } from './dashboard.service';

interface Kpi {
  label: string;
  value: number;
  hint: string;
  icon: string;
  tone: 'primary' | 'warning' | 'success' | 'info' | 'violet' | 'accent';
  link?: string;
  queryParams?: Params;
  alert?: boolean;
}

interface ChartBar {
  label: string;
  count: number;
  height: number;
  current: boolean;
}

const MONTH_FMT = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

@Component({
  selector: 'app-dashboard',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusChipComponent,
    EmptyStateComponent,
    PermissionDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly api = inject(DashboardService);
  private readonly memberActions = inject(MemberActionsService);
  protected readonly auth = inject(AuthService);

  protected readonly data = signal<Dashboard | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly initials = initialsOf;
  protected readonly formatDate = formatDate;
  protected readonly formatTimeRange = formatTimeRange;
  protected readonly timeAgo = timeAgo;
  protected readonly skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const first = this.auth.user()?.name.split(' ')[0] ?? '';
    return first ? `${part}, ${first}` : part;
  });

  protected readonly kpis = computed<Kpi[]>(() => {
    const d = this.data();
    if (!d) return [];
    const m = d.members;
    return [
      {
        label: 'Total members',
        value: m.total,
        hint: `${m.approved} approved · ${m.rejected} rejected`,
        icon: 'group',
        tone: 'primary',
        link: '/members',
      },
      {
        label: 'Pending approvals',
        value: m.pending,
        hint: m.pending ? 'Waiting for your review' : "You're all caught up",
        icon: 'hourglass_top',
        tone: 'warning',
        link: '/members',
        queryParams: { status: 'pending' },
        alert: m.pending > 0,
      },
      {
        label: 'Active members',
        value: m.active,
        hint: `${m.inactive} deactivated`,
        icon: 'bolt',
        tone: 'success',
        link: '/members',
        queryParams: { status: 'approved', is_active: 'true' },
      },
      {
        label: 'New this month',
        value: m.new_this_month,
        hint: 'Registrations since the 1st',
        icon: 'person_add',
        tone: 'info',
      },
      {
        label: 'Events this month',
        value: d.events.this_month,
        hint: `${d.events.upcoming} upcoming · ${d.events.drafts} drafts`,
        icon: 'event',
        tone: 'violet',
        link: '/events',
      },
      {
        label: 'Published news',
        value: d.contents.news_published,
        hint: `${d.contents.policies_published} policies live`,
        icon: 'newspaper',
        tone: 'accent',
        link: '/news',
      },
    ];
  });

  protected readonly chart = computed<{ bars: ChartBar[]; max: number; total: number }>(() => {
    const months = this.data()?.registrations_by_month ?? [];
    const max = Math.max(4, ...months.map((m) => m.count));
    const niceMax = Math.ceil(max / 4) * 4;
    return {
      max: niceMax,
      total: months.reduce((sum, m) => sum + m.count, 0),
      bars: months.map((m, i) => ({
        label: MONTH_FMT.format(new Date(`${m.month}-01T00:00:00Z`)),
        count: m.count,
        height: (m.count / niceMax) * 100,
        current: i === months.length - 1,
      })),
    };
  });

  protected readonly gridLines = computed(() => {
    const max = this.chart().max;
    return [max, (max * 3) / 4, max / 2, max / 4, 0];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiError(error).message);
        this.loading.set(false);
      },
    });
  }

  protected approve(member: Member): void {
    this.memberActions.run('approve', member).subscribe(() => this.load());
  }

  protected reject(member: Member): void {
    this.memberActions.run('reject', member).subscribe(() => this.load());
  }

  protected day(iso: string): string {
    return gymParts(iso)?.date.slice(8, 10) ?? '';
  }

  protected month(iso: string): string {
    const parts = gymParts(iso);
    return parts ? MONTH_FMT.format(new Date(`${parts.date}T00:00:00Z`)) : '';
  }
}
