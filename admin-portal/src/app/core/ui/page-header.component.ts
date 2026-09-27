import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** Page title, optional subtitle and back link, with projected action buttons on the right. */
@Component({
  selector: 'app-page-header',
  imports: [MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__text">
        @if (backLink()) {
          <a class="page-header__back" [routerLink]="backLink()">
            <mat-icon>arrow_back</mat-icon>
            {{ backLabel() }}
          </a>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    .page-header__text {
      min-width: 0;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.25;
    }
    p {
      margin-top: 4px;
      color: var(--app-text-muted);
      font-size: 14px;
    }
    .page-header__back {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
      color: var(--app-text-muted);
      font-size: 13px;
      font-weight: 500;
    }
    .page-header__back:hover {
      color: var(--app-primary);
    }
    .page-header__back mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
    .page-header__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }
    .page-header__actions:empty {
      display: none;
    }
    @media (max-width: 599.98px) {
      h1 {
        font-size: 21px;
      }
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly backLink = input<string>();
  readonly backLabel = input('Back');
}
