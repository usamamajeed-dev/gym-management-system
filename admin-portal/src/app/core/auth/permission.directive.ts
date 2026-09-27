import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';

import { AuthService } from './auth.service';

/** Renders its element only when the admin has the permission: `*appCan="'members.approve'"`. */
@Directive({ selector: '[appCan]' })
export class PermissionDirective {
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private rendered = false;

  readonly appCan = input.required<string>();

  constructor() {
    effect(() => {
      const allowed = this.auth.hasPermission(this.appCan());

      if (allowed && !this.rendered) {
        this.container.createEmbeddedView(this.template);
        this.rendered = true;
      } else if (!allowed && this.rendered) {
        this.container.clear();
        this.rendered = false;
      }
    });
  }
}
