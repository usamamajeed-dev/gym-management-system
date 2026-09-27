import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LoadingBarComponent } from './core/ui/loading-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-loading-bar />
    <router-outlet />
  `,
})
export class AppComponent {}
