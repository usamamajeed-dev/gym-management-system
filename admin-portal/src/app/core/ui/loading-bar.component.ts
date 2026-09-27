import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { LoadingService } from './loading.service';

/** Thin progress bar pinned to the top of the window while API requests are in flight. */
@Component({
  selector: 'app-loading-bar',
  imports: [MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading.isLoading()) {
      <mat-progress-bar mode="indeterminate" aria-label="Loading" />
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0 0 auto;
      z-index: 1100;
      height: 3px;
      pointer-events: none;
    }
  `,
})
export class LoadingBarComponent {
  protected readonly loading = inject(LoadingService);
}
