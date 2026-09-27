import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { StatusChipComponent } from '../../../core/ui/status-chip.component';
import { formatDate } from '../../../core/utils/date.utils';
import { ContentStatus, ContentType } from '../content.model';

export interface ContentPreviewData {
  type: ContentType;
  title: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  status: ContentStatus;
  publishedAt: string | null;
}

/** Renders the item at phone width to approximate what members see in the app. */
@Component({
  selector: 'app-content-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, StatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-head">
      <span class="dialog-icon"><mat-icon class="icon-filled">smartphone</mat-icon></span>
      <div>
        <h2 mat-dialog-title>App preview</h2>
        <p class="dialog-sub">Roughly how members will see this {{ data.type === 'news' ? 'news item' : 'policy' }}.</p>
      </div>
    </div>
    <mat-dialog-content>
      <div class="phone">
        <div class="phone__notch"></div>
        <div class="phone__screen">
          @if (data.status === 'archived') {
            <div class="archived">
              This {{ data.type === 'news' ? 'news item' : 'policy' }} has been archived and may be out of date.
            </div>
          }
          @if (data.imageUrl) {
            <img [src]="data.imageUrl" alt="" />
          }
          <div class="phone__content">
            <div class="meta">
              <app-status-chip [status]="data.type" />
              <span>{{ data.publishedAt ? formatDate(data.publishedAt) : 'Not published yet' }}</span>
            </div>
            <h1>{{ data.title || 'Untitled' }}</h1>
            @if (data.excerpt) {
              <p class="excerpt">{{ data.excerpt }}</p>
            }
            <div class="body" [innerHTML]="data.body"></div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .phone {
      width: 375px;
      max-width: 100%;
      margin: 8px auto;
      padding: 12px;
      border-radius: 40px;
      background: #0f172a;
      box-shadow: var(--app-shadow-lg);
    }
    .phone__notch {
      width: 120px;
      height: 22px;
      margin: 0 auto 8px;
      border-radius: 0 0 14px 14px;
      background: #020617;
    }
    .phone__screen {
      height: 560px;
      overflow-y: auto;
      border-radius: 28px;
      background: #fff;
    }
    img {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
    .archived {
      padding: 10px 16px;
      background: var(--app-warning-soft);
      color: #92400e;
      font-size: 12.5px;
      font-weight: 500;
    }
    .phone__content {
      padding: 16px 18px 24px;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--app-text-muted);
      font-size: 12px;
    }
    h1 {
      margin-top: 10px;
      font-size: 21px;
      font-weight: 700;
      line-height: 1.25;
    }
    .excerpt {
      margin-top: 8px;
      color: var(--app-text-secondary);
      font-size: 14px;
    }
    .body {
      margin-top: 14px;
      color: var(--app-text);
      font-size: 14.5px;
      line-height: 1.65;
      overflow-wrap: anywhere;
    }
    .body ::ng-deep :is(h2, h3) {
      margin: 16px 0 6px;
    }
    .body ::ng-deep :is(p, ul, ol, blockquote) {
      margin: 0 0 10px;
    }
    .body ::ng-deep blockquote {
      padding-left: 12px;
      border-left: 3px solid var(--app-primary);
      color: var(--app-text-secondary);
    }
  `,
})
export class ContentPreviewDialogComponent {
  protected readonly data = inject<ContentPreviewData>(MAT_DIALOG_DATA);
  protected readonly formatDate = formatDate;

  static open(dialog: MatDialog, data: ContentPreviewData): void {
    dialog.open(ContentPreviewDialogComponent, { data, width: '480px' });
  }
}
