import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';

import { Paginated } from '../../../core/api/api.models';
import { errorCode, toApiError } from '../../../core/api/api-error';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../../../core/ui/empty-state.component';
import { NotifyService } from '../../../core/ui/notify.service';
import { PageHeaderComponent } from '../../../core/ui/page-header.component';
import { StatusChipComponent } from '../../../core/ui/status-chip.component';
import { formatDate } from '../../../core/utils/date.utils';
import { ACTION_ICONS, actionLabel, ContentAction, contentActions } from '../content-actions';
import { CONTENT_LABELS, CONTENT_SORTABLE, ContentListItem, ContentStatus, ContentType } from '../content.model';
import { ContentPreviewDialogComponent } from '../content-preview-dialog/content-preview-dialog.component';
import { ContentsService } from '../contents.service';

const PAGE_SIZES = [10, 25, 50];
const STATUSES: ContentStatus[] = ['draft', 'published', 'archived'];

@Component({
  selector: 'app-content-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    PageHeaderComponent,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './content-list.component.html',
  styleUrl: './content-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contents = inject(ContentsService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  /** From the route data: /news → 'news', /policies → 'policy'. */
  readonly type = input.required<ContentType>();

  protected readonly labels = computed(() => CONTENT_LABELS[this.type()]);
  protected readonly tabs: { value: ContentStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly actionIcons = ACTION_ICONS;
  protected readonly contentActions = contentActions;
  protected readonly actionLabel = actionLabel;
  protected readonly formatDate = formatDate;

  // ------------------------------------------------------------ URL state

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly status = computed<ContentStatus | ''>(() => {
    const v = this.params().get('status') as ContentStatus | null;
    return v && STATUSES.includes(v) ? v : '';
  });
  private readonly searchTerm = computed(() => this.params().get('search') ?? '');
  protected readonly page = computed(() => Math.max(1, Number(this.params().get('page')) || 1));
  protected readonly pageSize = computed(() => {
    const v = Number(this.params().get('length'));
    return PAGE_SIZES.includes(v) ? v : PAGE_SIZES[0];
  });
  protected readonly sortColumn = computed(() => {
    const v = this.params().get('column') ?? '';
    return (CONTENT_SORTABLE as readonly string[]).includes(v) ? v : '';
  });
  protected readonly sortDir = computed<'asc' | 'desc' | ''>(() => {
    const v = this.params().get('dir');
    return this.sortColumn() && (v === 'asc' || v === 'desc') ? v : '';
  });

  // ------------------------------------------------------------ data

  protected readonly result = signal<Paginated<ContentListItem> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly tick = signal(0);
  protected readonly rows = computed(() => this.result()?.list ?? []);
  protected readonly total = computed(() => this.result()?.pagination.total ?? 0);
  protected readonly searchControl = new FormControl(this.searchTerm(), { nonNullable: true });

  private readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 899.98px)')
      .pipe(map((s) => s.matches)),
    { initialValue: false },
  );
  protected readonly columns = computed(() =>
    this.compact() ? ['title', 'actions'] : ['title', 'status', 'published_at', 'archived_at', 'actions'],
  );

  constructor() {
    toObservable(
      computed(() => ({
        query: {
          type: this.type(),
          status: this.status() || undefined,
          search: this.searchTerm() || undefined,
          column: this.sortColumn() || undefined,
          dir: this.sortDir() || undefined,
          page: this.page(),
          length: this.pageSize(),
        },
        tick: this.tick(),
      })),
    )
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ query }) =>
          this.contents.list(query).pipe(
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
  }

  protected statusLink(value: ContentStatus | ''): Params {
    return { status: value || null, page: null };
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

  protected reload(): void {
    this.tick.update((n) => n + 1);
  }

  protected run(action: ContentAction, item: ContentListItem): void {
    switch (action) {
      case 'edit':
        void this.router.navigate([item.id, 'edit'], { relativeTo: this.route });
        return;
      case 'preview':
        this.preview(item);
        return;
      case 'publish':
        this.transition(this.contents.publish(item.id));
        return;
      case 'archive':
        ConfirmDialogComponent.open(this.dialog, {
          title: `Archive “${item.title}”?`,
          message: `It moves to “Older” in the member app${this.type() === 'news' ? '' : ' and should be replaced by a current policy'}.`,
          confirmText: 'Archive',
          tone: 'warning',
          icon: 'inventory_2',
        })
          .pipe(filter(Boolean))
          .subscribe(() => this.transition(this.contents.archive(item.id)));
        return;
      case 'delete':
        ConfirmDialogComponent.open(this.dialog, {
          title: `Delete “${item.title}”?`,
          message: 'It is removed from the portal and the member app. This cannot be undone.',
          confirmText: 'Delete',
          tone: 'danger',
        })
          .pipe(
            filter(Boolean),
            switchMap(() => this.contents.delete(item.id)),
          )
          .subscribe({
            next: (res) => {
              this.notify.success(res.message);
              this.reload();
            },
            error: (e: unknown) => this.notify.error(toApiError(e).message),
          });
    }
  }

  private transition(request: ReturnType<ContentsService['publish']>): void {
    request.subscribe({
      next: (res) => {
        this.notify.success(res.message);
        this.reload();
      },
      error: (e: unknown) => {
        this.notify.error(toApiError(e).message);
        if (errorCode(e) === 'INVALID_CONTENT_TRANSITION') this.reload();
      },
    });
  }

  private preview(item: ContentListItem): void {
    this.contents.get(item.id).subscribe((content) =>
      ContentPreviewDialogComponent.open(this.dialog, {
        type: content.type,
        title: content.title,
        excerpt: content.excerpt,
        body: content.body,
        imageUrl: content.image_url,
        status: content.status,
        publishedAt: content.published_at,
      }),
    );
  }

  private updateQuery(queryParams: Params): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
