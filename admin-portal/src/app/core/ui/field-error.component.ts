import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { of, startWith, switchMap } from 'rxjs';

import { firstErrorMessage } from '../utils/form-errors';

/** The first validation (or server) message for a control: place inside `<mat-error>`. */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ message() }}`,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  readonly label = input('This field');

  private readonly status = toSignal(
    toObservable(this.control).pipe(switchMap((c) => (c ? c.statusChanges.pipe(startWith(c.status)) : of(null)))),
  );

  protected readonly message = computed(() => {
    this.status();
    return firstErrorMessage(this.control(), this.label());
  });
}
