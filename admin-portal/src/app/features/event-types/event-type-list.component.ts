import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';

import { Paginated } from '../../core/api/api.models';
import { errorCode, toApiError } from '../../core/api/api-error';
import { ConfirmDialogComponent } from '../../core/ui/confirm-dialog.component';
import { EmptyStateComponent } from '../../core/ui/empty-state.component';
import { NotifyService } from '../../core/ui/notify.service';
import { PageHeaderComponent } from '../../core/ui/page-header.component';
import { EventTypeFormDialogComponent } from './event-type-form-dialog.component';
import { EventType } from './event-type.model';
import { EventTypesService } from './event-types.service';

@Component({
  selector: 'app-event-type-list',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './event-type-list.component.html',
  styleUrl: './event-type-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventTypeListComponent {
  private readonly service = inject(EventTypesService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  protected readonly columns = ['name', 'description', 'events_count', 'is_active', 'actions'];
  protected readonly search = new FormControl('', { nonNullable: true });

  private readonly query = signal({ search: '', page: 1, length: 25 });
  private readonly tick = signal(0);

  protected readonly result = signal<Paginated<EventType> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly rows = computed(() => this.result()?.list ?? []);
  protected readonly total = computed(() => this.result()?.pagination.total ?? 0);
  protected readonly page = computed(() => this.query().page);
  protected readonly pageSize = computed(() => this.query().length);
  protected readonly hasSearch = computed(() => !!this.query().search);

  constructor() {
    toObservable(computed(() => ({ q: this.query(), t: this.tick() })))
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ q }) =>
          this.service
            .list({ search: q.search || undefined, page: q.page, length: q.length, column: 'name', dir: 'asc' })
            .pipe(
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

    this.search.valueChanges
      .pipe(
        map((v) => v.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((search) => this.query.update((q) => ({ ...q, search, page: 1 })));
  }

  protected reload(): void {
    this.tick.update((n) => n + 1);
  }

  protected onPage(event: PageEvent): void {
    this.query.update((q) => ({ ...q, page: event.pageIndex + 1, length: event.pageSize }));
  }

  protected create(): void {
    EventTypeFormDialogComponent.open(this.dialog, null)
      .pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }

  protected edit(type: EventType): void {
    EventTypeFormDialogComponent.open(this.dialog, type)
      .pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }

  protected toggleActive(type: EventType, change: MatSlideToggleChange): void {
    this.service.update(type.id, { is_active: change.checked }).subscribe({
      next: (res) => {
        this.notify.success(change.checked ? `${type.name} is active again` : `${type.name} deactivated`);
        this.result.update((r) =>
          r
            ? {
                ...r,
                list: r.list.map((t) => (t.id === type.id ? { ...t, ...res.data, events_count: t.events_count } : t)),
              }
            : r,
        );
      },
      error: () => {
        change.source.checked = !change.checked;
      },
    });
  }

  protected remove(type: EventType): void {
    ConfirmDialogComponent.open(this.dialog, {
      title: `Delete “${type.name}”?`,
      message: 'This event type will be removed. Types that are used by events cannot be deleted.',
      confirmText: 'Delete type',
      tone: 'danger',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(type.id)),
      )
      .subscribe({
        next: (res) => {
          this.notify.success(res.message);
          this.reload();
        },
        error: (error: unknown) => {
          if (errorCode(error) === 'EVENT_TYPE_IN_USE') {
            const n = type.events_count ?? 0;
            this.notify.error(`This type is used by ${n} ${n === 1 ? 'event' : 'events'} — deactivate it instead.`);
          } else {
            this.notify.error(toApiError(error).message);
          }
        },
      });
  }
}
