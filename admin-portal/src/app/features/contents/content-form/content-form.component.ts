import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import type Quill from 'quill';
import { startWith } from 'rxjs';

import { errorStatus, toApiError } from '../../../core/api/api-error';
import { EmptyStateComponent } from '../../../core/ui/empty-state.component';
import { FieldErrorComponent } from '../../../core/ui/field-error.component';
import { ImageChange, ImageUploadComponent } from '../../../core/ui/image-upload.component';
import { NotifyService } from '../../../core/ui/notify.service';
import { PageHeaderComponent } from '../../../core/ui/page-header.component';
import { StatusChipComponent } from '../../../core/ui/status-chip.component';
import { formatDate } from '../../../core/utils/date.utils';
import { applyServerErrors } from '../../../core/utils/form-errors';
import { HasUnsavedChanges } from '../../../core/utils/unsaved-changes.guard';
import { CONTENT_LABELS, Content, ContentImageState, ContentPayload, ContentType } from '../content.model';
import { ContentPreviewDialogComponent } from '../content-preview-dialog/content-preview-dialog.component';
import { ContentsService } from '../contents.service';

export type SaveAs = 'draft' | 'published';

/** Only the formats the API keeps after sanitising: p, br, strong, em, ul, ol, li, a, h2, h3, blockquote. */
export const EDITOR_FORMATS = ['header', 'bold', 'italic', 'list', 'blockquote', 'link'];

export const EDITOR_MODULES: QuillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

/**
 * Quill's semantic HTML uses real <ul>/<ol> lists (its editor HTML marks bullets with
 * data attributes the API would strip). Quill 2 also turns spaces into &nbsp;.
 */
export function semanticBody(quill: Pick<Quill, 'getSemanticHTML' | 'getText'>): string {
  if (quill.getText().trim() === '') return '';
  return quill.getSemanticHTML().replace(/&nbsp;/g, ' ');
}

/** Values sent to the API. Status is only included for new items. */
export function buildContentPayload(
  value: { title: string; excerpt: string; saveAs: SaveAs },
  body: string,
  isNew: boolean,
): ContentPayload {
  return {
    title: value.title.trim(),
    excerpt: value.excerpt.trim() || null,
    body,
    ...(isNew ? { status: value.saveAs } : {}),
  };
}

@Component({
  selector: 'app-content-form',
  imports: [
    ReactiveFormsModule,
    QuillEditorComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    FieldErrorComponent,
    ImageUploadComponent,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './content-form.component.html',
  styleUrl: './content-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentFormComponent implements OnInit, HasUnsavedChanges {
  private readonly contents = inject(ContentsService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** From the route data. */
  readonly type = input.required<ContentType>();
  /** Route param on :id/edit. */
  readonly id = input<string>();

  protected readonly labels = computed(() => CONTENT_LABELS[this.type()]);
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly modules = EDITOR_MODULES;
  protected readonly formats = EDITOR_FORMATS;
  protected readonly formatDate = formatDate;

  protected readonly content = signal<Content | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly transitioning = signal(false);
  protected readonly imageError = signal<string | null>(null);
  private readonly image = signal<ContentImageState>({ file: null, removed: false });
  private quill: Quill | null = null;
  private saved = false;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    excerpt: ['', Validators.maxLength(500)],
    body: ['', [Validators.required, Validators.maxLength(65000)]],
    saveAs: ['draft' as SaveAs],
  });

  protected readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    requireSync: true,
  });

  ngOnInit(): void {
    const id = Number(this.id());
    if (id) this.load(id);
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && (this.form.dirty || this.image().file !== null || this.image().removed);
  }

  protected onEditorCreated(quill: Quill): void {
    this.quill = quill;
  }

  protected onImage(change: ImageChange): void {
    this.image.set(change);
    this.imageError.set(null);
  }

  protected load(id: number): void {
    this.loading.set(true);
    this.contents.get(id).subscribe({
      next: (content) => {
        this.content.set(content);
        this.form.reset({ title: content.title, excerpt: content.excerpt ?? '', body: content.body, saveAs: 'draft' });
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loadError.set(
          errorStatus(e) === 404 ? `This ${this.labels().singular} no longer exists.` : toApiError(e).message,
        );
        this.loading.set(false);
      },
    });
  }

  protected preview(): void {
    const v = this.form.getRawValue();
    const existing = this.content();
    ContentPreviewDialogComponent.open(this.dialog, {
      type: this.type(),
      title: v.title,
      excerpt: v.excerpt || null,
      body: this.currentBody(),
      imageUrl: this.image().removed ? null : (existing?.image_url ?? null),
      status: existing?.status ?? (v.saveAs === 'published' ? 'published' : 'draft'),
      publishedAt: existing?.published_at ?? null,
    });
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.notify.error('Please fix the highlighted fields.');
      return;
    }

    const existing = this.content();
    const payload = buildContentPayload(this.form.getRawValue(), this.currentBody(), !existing);
    const request = existing
      ? this.contents.update(existing.id, payload, this.image())
      : this.contents.create(this.type(), payload, this.image());

    this.saving.set(true);
    request.subscribe({
      next: (res) => {
        this.saved = true;
        this.notify.success(res.message);
        void this.router.navigate([existing ? '../..' : '..'], { relativeTo: this.route });
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const apiError = toApiError(e);
        const errors = { ...(apiError.errors ?? {}) };
        if (errors['image']) this.imageError.set(errors['image'][0]);
        delete errors['image'];
        const unmatched = applyServerErrors(this.form, { errors });
        this.notify.error(unmatched[0] ?? (apiError.errors ? 'Please fix the highlighted fields.' : apiError.message));
      },
    });
  }

  /** Publish or archive an existing item from the editor. */
  protected transition(action: 'publish' | 'archive'): void {
    const existing = this.content();
    if (!existing) return;

    this.transitioning.set(true);
    const request = action === 'publish' ? this.contents.publish(existing.id) : this.contents.archive(existing.id);
    request.subscribe({
      next: (res) => {
        this.transitioning.set(false);
        this.content.set(res.data);
        this.notify.success(res.message);
      },
      error: (e: unknown) => {
        this.transitioning.set(false);
        this.notify.error(toApiError(e).message);
        this.load(existing.id);
      },
    });
  }

  protected cancel(): void {
    void this.router.navigate([this.isEdit() ? '../..' : '..'], { relativeTo: this.route });
  }

  private currentBody(): string {
    return this.quill ? semanticBody(this.quill) : this.form.controls.body.value;
  }
}
