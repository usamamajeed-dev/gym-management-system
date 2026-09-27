import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { errorStatus, toApiError } from '../../../core/api/api-error';
import { initialsOf } from '../../../core/auth/auth.service';
import { PermissionDirective } from '../../../core/auth/permission.directive';
import { EmptyStateComponent } from '../../../core/ui/empty-state.component';
import { PageHeaderComponent } from '../../../core/ui/page-header.component';
import { StatusChipComponent } from '../../../core/ui/status-chip.component';
import { formatDate, formatDateTime, timeAgo } from '../../../core/utils/date.utils';
import { availableActions, MEMBER_ACTION_META, MemberAction } from '../member-actions';
import { MemberActionsService } from '../member-actions.service';
import { GENDER_LABELS, Member } from '../member.model';
import { MembersService } from '../members.service';

interface TimelineStep {
  icon: string;
  title: string;
  detail: string;
  tone: 'done' | 'success' | 'danger' | 'waiting' | 'muted';
  note?: string;
}

@Component({
  selector: 'app-member-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusChipComponent,
    EmptyStateComponent,
    PermissionDirective,
  ],
  templateUrl: './member-detail.component.html',
  styleUrl: './member-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailComponent {
  private readonly membersApi = inject(MembersService);
  private readonly actions = inject(MemberActionsService);
  private readonly router = inject(Router);

  /** Route param, bound by the router. */
  readonly id = input.required<string>();

  protected readonly member = signal<Member | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<{ message: string; notFound: boolean } | null>(null);
  private readonly reloadTick = signal(0);

  protected readonly actionMeta = MEMBER_ACTION_META;
  protected readonly initials = initialsOf;
  protected readonly formatDate = formatDate;
  protected readonly formatDateTime = formatDateTime;
  protected readonly timeAgo = timeAgo;

  /** State-changing actions shown as buttons; view/edit/delete live elsewhere on the page. */
  protected readonly primaryActions = computed(() => {
    const m = this.member();
    return m ? availableActions(m).filter((a) => ['approve', 'reject', 'activate', 'deactivate'].includes(a)) : [];
  });
  protected readonly canEdit = computed(() => {
    const m = this.member();
    return !!m && availableActions(m).includes('edit');
  });

  protected readonly details = computed(() => {
    const m = this.member();
    if (!m) return [];
    return [
      { icon: 'mail', label: 'Email', value: m.email },
      { icon: 'call', label: 'Phone', value: m.phone },
      { icon: 'cake', label: 'Date of birth', value: m.date_of_birth ? formatDate(m.date_of_birth) : null },
      { icon: 'wc', label: 'Gender', value: m.gender ? GENDER_LABELS[m.gender] : null },
      { icon: 'home', label: 'Address', value: m.address },
      { icon: 'contact_emergency', label: 'Emergency contact', value: m.emergency_contact_name },
      { icon: 'phone_in_talk', label: 'Emergency phone', value: m.emergency_contact_phone },
    ];
  });

  protected readonly timeline = computed<TimelineStep[]>(() => {
    const m = this.member();
    if (!m) return [];

    const steps: TimelineStep[] = [
      { icon: 'app_registration', title: 'Registered', detail: formatDateTime(m.created_at), tone: 'done' },
    ];

    if (m.status === 'pending') {
      steps.push({
        icon: 'hourglass_top',
        title: 'Awaiting review',
        detail: 'Needs an admin decision',
        tone: 'waiting',
      });
    } else if (m.status === 'rejected') {
      steps.push({
        icon: 'block',
        title: 'Rejected',
        detail: formatDateTime(m.rejected_at),
        tone: 'danger',
        note: m.rejection_reason ?? undefined,
      });
    } else {
      steps.push({ icon: 'verified', title: 'Approved', detail: formatDateTime(m.approved_at), tone: 'success' });
      steps.push(
        m.is_active
          ? { icon: 'bolt', title: 'Membership active', detail: 'Can use the member app', tone: 'success' }
          : { icon: 'pause_circle', title: 'Deactivated', detail: "Can't log in until activated", tone: 'muted' },
      );
    }

    steps.push(
      m.last_login_at
        ? {
            icon: 'login',
            title: 'Last login',
            detail: `${formatDateTime(m.last_login_at)} · ${timeAgo(m.last_login_at)}`,
            tone: 'done',
          }
        : { icon: 'login', title: 'Last login', detail: 'Never logged in to the app', tone: 'muted' },
    );

    return steps;
  });

  constructor() {
    toObservable(computed(() => ({ id: Number(this.id()), tick: this.reloadTick() })))
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(({ id }) =>
          this.membersApi.get(id).pipe(
            map((member) => ({ member, error: null })),
            catchError((error: unknown) =>
              of({
                member: null,
                error: { message: toApiError(error).message, notFound: errorStatus(error) === 404 },
              }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ member, error }) => {
        this.loading.set(false);
        this.error.set(error);
        this.member.set(member);
      });
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }

  protected run(action: MemberAction): void {
    const member = this.member();
    if (!member) return;

    this.actions.run(action, member).subscribe((result) => {
      if (result.kind === 'deleted') {
        void this.router.navigate(['/members']);
      } else if (result.kind === 'updated') {
        this.member.set(result.member);
      } else {
        this.reload();
      }
    });
  }
}
