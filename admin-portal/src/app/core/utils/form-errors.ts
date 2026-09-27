import { AbstractControl, FormGroup } from '@angular/forms';

import { ApiErrorBody } from '../api/api.models';

/**
 * Puts 422 `errors` from the API onto the matching controls as `{ server: message }`.
 * Keys may be nested paths such as `timings.3.closes_at`. Returns the messages
 * that matched no control, so the page can show them elsewhere.
 */
export function applyServerErrors(form: FormGroup, error: Pick<ApiErrorBody, 'errors'>): string[] {
  const unmatched: string[] = [];

  for (const [key, messages] of Object.entries(error.errors ?? {})) {
    const message = messages[0];
    const control = form.get(key);

    if (!control || !message) {
      if (message) {
        unmatched.push(message);
      }
      continue;
    }

    control.setErrors({ ...(control.errors ?? {}), server: message });
    control.markAsTouched();
  }

  return unmatched;
}

/** Human-readable message for the first error on a control. */
export function firstErrorMessage(control: AbstractControl | null, label = 'This field'): string {
  const errors = control?.errors;

  if (!errors) {
    return '';
  }

  if (errors['server']) return String(errors['server']);
  if (errors['required']) return `${label} is required.`;
  if (errors['email']) return 'Enter a valid email address.';
  if (errors['minlength']) return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
  if (errors['maxlength']) return `${label} must be at most ${errors['maxlength'].requiredLength} characters.`;
  if (errors['min']) return `${label} must be at least ${errors['min'].min}.`;
  if (errors['max']) return `${label} must be at most ${errors['max'].max}.`;
  if (errors['pattern']) return `${label} has an invalid format.`;

  const custom = Object.values(errors).find((value) => typeof value === 'string');

  return typeof custom === 'string' ? custom : `${label} is invalid.`;
}
