import { ChangeDetectionStrategy, Component, computed, input, OnDestroy, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageChange {
  /** The newly picked file, or null when the image was removed. */
  file: File | null;
  /** True when the existing image should be deleted. */
  removed: boolean;
}

/** Returns an error message when the file can't be uploaded, otherwise null. */
export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'Use a JPG, PNG or WebP image.';
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'The image must be 5 MB or smaller.';
  }
  return null;
}

/** Image picker with preview, drag & drop, replace and remove. Emits changes; the parent uploads. */
@Component({
  selector: 'app-image-upload',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="upload"
      [class.upload--has-image]="!!previewUrl()"
      [class.upload--drag]="dragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      @if (previewUrl(); as src) {
        <img [src]="src" alt="Selected image preview" />
        <div class="upload__actions">
          <button mat-flat-button type="button" (click)="picker.click()">
            <mat-icon>swap_horiz</mat-icon>
            Replace
          </button>
          <button mat-stroked-button type="button" class="remove" (click)="remove()">
            <mat-icon>delete</mat-icon>
            Remove
          </button>
        </div>
      } @else {
        <button type="button" class="upload__empty" (click)="picker.click()">
          <span class="upload__icon"><mat-icon>add_photo_alternate</mat-icon></span>
          <strong>Click to upload or drag an image here</strong>
          <small>JPG, PNG or WebP · up to 5 MB</small>
        </button>
      }
      <input #picker type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onPick($event)" />
    </div>
    @if (error()) {
      <p class="upload__error"><mat-icon>error</mat-icon>{{ error() }}</p>
    }
  `,
  styles: `
    .upload {
      position: relative;
      overflow: hidden;
      border: 1.5px dashed var(--app-border-strong);
      border-radius: 14px;
      background: var(--app-surface-muted);
      transition:
        border-color 140ms ease,
        background-color 140ms ease;
    }
    .upload--drag {
      border-color: var(--app-primary);
      background: var(--app-primary-soft);
    }
    .upload--has-image {
      border-style: solid;
    }
    img {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
    .upload__actions {
      position: absolute;
      right: 12px;
      bottom: 12px;
      display: flex;
      gap: 8px;
    }
    .upload__actions .remove {
      --mat-button-outlined-label-text-color: var(--app-danger);
      background: #fff;
    }
    .upload__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 32px 16px;
      border: 0;
      background: none;
      color: var(--app-text-secondary);
      font: inherit;
      cursor: pointer;
    }
    .upload__empty:hover strong {
      color: var(--app-primary);
    }
    .upload__icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: 6px;
      border-radius: 14px;
      background: var(--app-primary-soft);
      color: var(--app-primary);
    }
    strong {
      font-size: 13.5px;
    }
    small {
      color: var(--app-text-faint);
      font-size: 12px;
    }
    .upload__error {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      color: var(--app-danger);
      font-size: 12.5px;
    }
    .upload__error mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
  `,
})
export class ImageUploadComponent implements OnDestroy {
  /** URL of the image already saved on the server, if any. */
  readonly imageUrl = input<string | null>(null);
  readonly changed = output<ImageChange>();

  private readonly pickedUrl = signal<string | null>(null);
  private readonly removed = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dragging = signal(false);

  protected readonly previewUrl = computed(() => this.pickedUrl() ?? (this.removed() ? null : this.imageUrl()));

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.accept(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.accept(file);
  }

  protected remove(): void {
    this.revoke();
    this.pickedUrl.set(null);
    this.removed.set(true);
    this.error.set(null);
    this.changed.emit({ file: null, removed: true });
  }

  private accept(file: File): void {
    const problem = validateImage(file);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.revoke();
    this.error.set(null);
    this.pickedUrl.set(URL.createObjectURL(file));
    this.changed.emit({ file, removed: false });
  }

  private revoke(): void {
    const url = this.pickedUrl();
    if (url) URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    this.revoke();
  }
}
