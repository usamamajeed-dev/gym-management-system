import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
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
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';

import { Paginated } from '../../../core/api/api.models';
import { toApiError } from '../../../core/api/api-error';
import { GymConfigService } from '../../../core/api/gym-config.service';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../../../core/ui/empty-state.component';
import { NotifyService } from '../../../core/ui/notify.service';
import { PageHeaderComponent } from '../../../core/ui/page-header.component';
import { StatusChipComponent } from '../../../core/ui/status-chip.component';
import { formatDay, formatTimeRange, gymParts } from '../../../core/utils/date.utils';
import { EventTypesService } from '../../event-types/event-types.service';
import { EVENT_SORTABLE, EventListQuery, GymEvent } from '../event.model';
import { EventsService } from '../events.service';

const PAGE_SIZES = [10, 25, 50];

function toYmd(date: Date | null): string | null {
  if (!date) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromYmd(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

@Component({
  selector: 'app-event-list',
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
    MatButtonToggleModule,
    MatDatepickerModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly events = inject(EventsService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  protected readonly typeOptions = toSignal(inject(EventTypesService).options(), { initialValue: [] });
  protected readonly timezone = toSignal(inject(GymConfigService).timezone(), { initialValue: '' });
  protected readonly pageSizes = PAGE_SIZES;

  // ------------------------------------------------------------ URL state

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly typeId = computed(() => Number(this.params().get('event_type_id')) || null);
  protected readonly published = computed<'true' | 'false' | ''>(() => {
    const v = this.params().get('is_published');
    return v === 'true' || v === 'false' ? v : '';
  });
  private readonly from = computed(() => this.params().get('from'));
  private readonly to = computed(() => this.params().get('to'));
  private readonly searchTerm = computed(() => this.params().get('search') ?? '');
  protected readonly page = computed(() => Math.max(1, Number(this.params().get('page')) || 1));
  protected readonly pageSize = computed(() => {
    const v = Number(this.params().get('length'));
    return PAGE_SIZES.includes(v) ? v : PAGE_SIZES[0];
  });
  protected readonly sortColumn = computed(() => {
    const v = this.params().get('column') ?? '';
    return (EVENT_SORTABLE as readonly string[]).includes(v) ? v : '';
  });
  protected readonly sortDir = computed<'asc' | 'desc' | ''>(() => {
    const v = this.params().get('dir');
    return this.sortColumn() && (v === 'asc' || v === 'desc') ? v : '';
  });

  protected readonly hasFilters = computed(
    () => !!(this.searchTerm() || this.typeId() || this.published() || this.from() || this.to()),
  );

  private readonly query = computed<EventListQuery>(() => ({
    search: this.searchTerm() || undefined,
    event_type_id: this.typeId() ?? undefined,
    is_published: this.published() || undefined,
    from: this.from() ?? undefined,
    to: this.to() ?? undefined,
    column: this.sortColumn() || undefined,
    dir: this.sortDir() || undefined,
    page: this.page(),
    length: this.pageSize(),
  }));

  // ------------------------------------------------------------ data

  protected readonly result = signal<Paginated<GymEvent> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly tick = signal(0);
  protected readonly rows = computed(() => this.result()?.list ?? []);
  protected readonly total = computed(() => this.result()?.pagination.total ?? 0);

  protected readonly searchControl = new FormControl(this.searchTerm(), { nonNullable: true });
  protected readonly range = new FormGroup({
    start: new FormControl<Date | null>(fromYmd(this.from())),
    end: new FormControl<Date | null>(fromYmd(this.to())),
  });

  private readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 899.98px)')
      .pipe(map((s) => s.matches)),
    { initialValue: false },
  );
  protected readonly columns = computed(() =>
    this.compact() ? ['title', 'actions'] : ['title', 'type', 'starts_at', 'status', 'actions'],
  );

  protected readonly formatDay = formatDay;
  protected readonly formatTimeRange = formatTimeRange;

  constructor() {
    toObservable(computed(() => ({ q: this.query(), t: this.tick() })))
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ q }) =>
          this.events.list(q).pipe(
            map((result) => ({ result, error: null as string | null })),
            catchError((e: unknown) => of({ result: null, error: toApiError(e).message })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ result, error }) => {
        this.loading.set(false);
        this.error.set(error);
        if (result) this.result.set(result);
      });

    this.searchControl.valueChanges
      .pipe(
        map((v) => v.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((search) => this.updateQuery({ search: search || null, page: null }));

    this.range.valueChanges.pipe(debounceTime(50), takeUntilDestroyed()).subscribe(({ start, end }) => {
      if (start && !end) return;
      this.updateQuery({ from: toYmd(start ?? null), to: toYmd(end ?? null), page: null });
    });
  }

  // ------------------------------------------------------------ UI events

  protected onType(id: number | null): void {
    this.updateQuery({ event_type_id: id, page: null });
  }

  protected onPublished(value: 'true' | 'false' | ''): void {
    this.updateQuery({ is_published: value || null, page: null });
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
    this.range.setValue({ start: null, end: null }, { emitEvent: false });
    this.updateQuery({ search: null, event_type_id: null, is_published: null, from: null, to: null, page: null });
  }

  protected reload(): void {
    this.tick.update((n) => n + 1);
  }

  protected edit(event: GymEvent): void {
    void this.router.navigate(['/events', event.id, 'edit']);
  }

  protected togglePublished(event: GymEvent): void {
    const publish = !event.is_published;
    this.events.setPublished(event.id, publish).subscribe({
      next: () => {
        this.notify.success(
          publish ? `“${event.title}” is now visible in the app` : `“${event.title}” was unpublished`,
        );
        this.reload();
      },
      error: (e: unknown) => this.notify.error(toApiError(e).message),
    });
  }

  protected remove(event: GymEvent): void {
    ConfirmDialogComponent.open(this.dialog, {
      title: `Delete “${event.title}”?`,
      message: 'The event and its image are removed and disappear from the member app.',
      confirmText: 'Delete event',
      tone: 'danger',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.events.delete(event.id)),
      )
      .subscribe({
        next: (res) => {
          this.notify.success(res.message);
          this.reload();
        },
        error: (e: unknown) => this.notify.error(toApiError(e).message),
      });
  }

  protected isPast(event: GymEvent): boolean {
    const end = event.ends_at ?? event.starts_at;
    return new Date(end).getTime() < Date.now();
  }

  protected day(iso: string): string {
    return gymParts(iso)?.date.slice(8, 10) ?? '';
  }

  private updateQuery(queryParams: Params): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
