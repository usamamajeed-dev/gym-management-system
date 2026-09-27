import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ChipTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'accent';

const PRESETS: Record<string, { label: string; tone: ChipTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'info' },
  open: { label: 'Open now', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  news: { label: 'News', tone: 'primary' },
  policy: { label: 'Policy', tone: 'accent' },
};

/** Soft, dotted pill for statuses: `<app-status-chip status="pending" />`. */
@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [attr.data-tone]="resolvedTone()"><i></i>{{ resolvedLabel() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
    }
    .chip {
      --fg: var(--app-neutral);
      --bg: var(--app-neutral-soft);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      background: var(--bg);
      color: var(--fg);
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
    }
    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    [data-tone='success'] {
      --fg: #047857;
      --bg: var(--app-success-soft);
    }
    [data-tone='warning'] {
      --fg: #b45309;
      --bg: var(--app-warning-soft);
    }
    [data-tone='danger'] {
      --fg: #b91c1c;
      --bg: var(--app-danger-soft);
    }
    [data-tone='info'] {
      --fg: #0369a1;
      --bg: var(--app-info-soft);
    }
    [data-tone='primary'] {
      --fg: var(--app-primary-strong);
      --bg: var(--app-primary-soft);
    }
    [data-tone='accent'] {
      --fg: var(--app-accent-strong);
      --bg: var(--app-accent-soft);
    }
  `,
})
export class StatusChipComponent {
  readonly status = input<string>('');
  readonly label = input<string>();
  readonly tone = input<ChipTone>();

  protected readonly resolvedTone = computed(() => this.tone() ?? PRESETS[this.status()]?.tone ?? 'neutral');
  protected readonly resolvedLabel = computed(() => this.label() ?? PRESETS[this.status()]?.label ?? this.status());
}
