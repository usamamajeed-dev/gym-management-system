import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Friendly placeholder for empty lists and errors, with optional projected actions. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty" [class.empty--compact]="compact()" [attr.data-tone]="tone()">
      <div class="empty__icon">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <div class="empty__actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 56px 24px;
      text-align: center;
    }
    .empty--compact {
      padding: 28px 16px;
    }
    .empty__icon {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      margin-bottom: 16px;
      border-radius: 16px;
      background: var(--app-primary-soft);
      color: var(--app-primary);
    }
    [data-tone='danger'] .empty__icon {
      background: var(--app-danger-soft);
      color: var(--app-danger);
    }
    .empty--compact .empty__icon {
      width: 44px;
      height: 44px;
      margin-bottom: 12px;
      border-radius: 12px;
    }
    h3 {
      font-size: 16px;
      font-weight: 600;
    }
    p {
      max-width: 380px;
      margin-top: 6px;
      color: var(--app-text-muted);
      font-size: 14px;
    }
    .empty__actions {
      display: flex;
      gap: 8px;
      margin-top: 18px;
    }
    .empty__actions:empty {
      display: none;
    }
  `,
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly compact = input(false, { transform: booleanAttribute });
  readonly tone = input<'primary' | 'danger'>('primary');
}
