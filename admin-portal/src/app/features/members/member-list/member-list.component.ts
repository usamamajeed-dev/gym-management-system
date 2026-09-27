import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

import { Paginated } from '../../../core/api/api.models';
import { toApiError } from '../../../core/api/api-error';
import { initialsOf } from '../../../core/auth/auth.service';
import { PermissionDirective } from '../../../core/auth/permission.directive';
import { PendingMembersService } from '../../../core/layout/pending-members.service';
import { EmptyStateComponent } from '../../../core/ui/empty-state.component';
import { PageHeaderComponent } from '../../../core/ui/page-header.component';
import { StatusChipComponent } from '../../../core/ui/status-chip.component';
import { formatDate, timeAgo } from '../../../core/utils/date.utils';
import { availableActions, MEMBER_ACTION_META, MemberAction } from '../member-actions';
import { MemberActionsService } from '../member-actions.service';
import { Member, MEMBER_SORTABLE, MemberListQuery, MemberStatus } from '../member.model';
import { MembersService } from '../members.service';

interface StatusTab {
  value: MemberStatus | '';
  label: string;
  icon: string;
}

const PAGE_SIZES = [10, 25, 50];
const STATUSES: MemberStatus[] = ['pending', 'approved', 'rejected'];

@Component({
  selector: 'app-member-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusChipComponent,
    EmptyStateComponent,
    PermissionDirective,
  ],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly members = inject(MembersService);
  private readonly actions = inject(MemberActionsService);
  protected readonly pending = inject(PendingMembersService);

  protected readonly tabs: StatusTab[] = [
    { value: '', label: 'All members', icon: 'group' },
    { value: 'pending', label: 'Pending', icon: 'hourglass_top' },
    { value: 'approved', label: 'Approved', icon: 'verified' },
    { value: 'rejected', label: 'Rejected', icon: 'block' },
  ];
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly actionMeta = MEMBER_ACTION_META;
  protected readonly skeletonRows = Array.from({ length: 6 }, (_, i) => i);

  // ------------------------------------------------------------ URL-driven state

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly status = computed<MemberStatus | ''>(() => {
    const value = this.params().get('status') as MemberStatus | null;
    return value && STATUSES.includes(value) ? value : '';
  });
  protected readonly activeFilter = computed<'true' | 'false' | ''>(() => {
    const value = this.params().get('is_active');
    return value === 'true' || value === 'false' ? value : '';
  });
  protected readonly page = computed(() => Math.max(1, Number(this.params().get('page')) || 1));
  protected readonly pageSize = computed(() => {
    const value = Number(this.params().get('length'));
    return PAGE_SIZES.includes(value) ? value : PAGE_SIZES[0];
  });
  protected readonly sortColumn = computed(() => {
    const value = this.params().get('column') ?? '';
    return (MEMBER_SORTABLE as readonly string[]).includes(value) ? value : '';
  });
  protected readonly sortDir = computed<'asc' | 'desc' | ''>(() => {
    const value = this.params().get('dir');
    return this.sortColumn() && (value === 'asc' || value === 'desc') ? value : '';
  });
  private readonly searchTerm = computed(() => this.params().get('search') ?? '');

  private readonly query = computed<MemberListQuery>(() => ({
    status: this.status() || undefined,
    is_active: this.activeFilter() || undefined,
    search: this.searchTerm() || undefined,
    column: this.sortColumn() || undefined,
    dir: this.sortDir() || undefined,
    page: this.page(),
    length: this.pageSize(),
  }));

  // ------------------------------------------------------------ data

  protected readonly result = signal<Paginated<Member> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly reloadTick = signal(0);

  protected readonly rows = computed(() => this.result()?.list ?? []);
  protected readonly total = computed(() => this.result()?.pagination.total ?? 0);
  protected readonly hasFilters = computed(() => !!(this.searchTerm() || this.activeFilter()));

  protected readonly searchControl = new FormControl(this.searchTerm(), { nonNullable: true });

  // ------------------------------------------------------------ responsive columns

  private readonly breakpoints = toSignal(
    inject(BreakpointObserver)
      .observe(['(max-width: 719.98px)', '(max-width: 1199.98px)'])
      .pipe(map((state) => state.breakpoints)),
    { initialValue: {} as Record<string, boolean> },
  );

  protected readonly columns = computed(() => {
    const bp = this.breakpoints();
    if (bp['(max-width: 719.98px)']) return ['name', 'actions'];
    if (bp['(max-width: 1199.98px)']) return ['name', 'membership_number', 'status', 'created_at', 'actions'];
    return ['name', 'phone', 'membership_number', 'status', 'created_at', 'actions'];
  });

  protected readonly compact = computed(() => !!this.breakpoints()['(max-width: 719.98px)']);

  protected readonly initials = initialsOf;
  protected readonly formatDate = formatDate;
  protected readonly timeAgo = timeAgo;
  protected readonly availableActions = availableActions;

  constructor() {
    toObservable(computed(() => ({ query: this.query(), tick: this.reloadTick() })))
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ query }) =>
          this.members.list(query).pipe(
            map((result) => ({ result, error: null as string | null })),
            catchError((error: unknown) => of({ result: null, error: toApiError(error).message })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ result, error }) => {
        this.loading.set(false);
        this.error.set(error);
        if (result) {
          this.result.set(result);
        }
      });

    this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((search) => this.updateQuery({ search: search || null, page: null }));
  }

  // ------------------------------------------------------------ UI events

  protected statusLink(value: MemberStatus | ''): Params {
    return { status: value || null, page: null };
  }

  protected onActiveFilter(value: 'true' | 'false' | ''): void {
    this.updateQuery({ is_active: value || null, page: null });
  }

  protected onSort(sort: Sort): void {
    this.updateQuery(
      sort.direction ? { column: sort.active, dir: sort.direction, page: null } : { column: null, dir: null },
    );
  }

  protected onPage(event: PageEvent): void {
    this.updateQuery({
      page: event.pageIndex + 1 > 1 ? event.pageIndex + 1 : null,
      length: event.pageSize !== PAGE_SIZES[0] ? event.pageSize : null,
    });
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.updateQuery({ search: null, is_active: null, page: null });
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
    this.pending.refresh();
  }

  protected open(member: Member): void {
    void this.router.navigate(['/members', member.id]);
  }

  protected runAction(action: MemberAction, member: Member): void {
    this.actions.run(action, member).subscribe(() => this.reload());
  }

  protected emptyTitle(): string {
    if (this.hasFilters()) return 'No members match your filters';
    switch (this.status()) {
      case 'pending':
        return 'No pending registrations';
      case 'approved':
        return 'No approved members yet';
      case 'rejected':
        return 'No rejected registrations';
      default:
        return 'No members yet';
    }
  }

  protected emptyMessage(): string {
    if (this.hasFilters()) return 'Try a different search term or clear the filters.';
    return this.status() === 'pending'
      ? "You're all caught up. New registrations from the member app will appear here."
      : 'Members appear here once they register in the member app.';
  }

  private updateQuery(queryParams: Params): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
