import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { applyServerErrors, firstErrorMessage } from './form-errors';

describe('applyServerErrors', () => {
  it('maps API errors onto matching controls as a server error', () => {
    const form = new FormGroup({ email: new FormControl(''), name: new FormControl('') });

    const unmatched = applyServerErrors(form, { errors: { email: ['An account with this email already exists.'] } });

    expect(form.controls.email.errors).toEqual({ server: 'An account with this email already exists.' });
    expect(form.controls.email.touched).toBe(true);
    expect(form.controls.name.errors).toBeNull();
    expect(unmatched).toEqual([]);
  });

  it('follows nested paths like timings.3.closes_at', () => {
    const form = new FormGroup({
      timings: new FormArray([0, 1, 2, 3].map(() => new FormGroup({ closes_at: new FormControl('') }))),
    });

    applyServerErrors(form, {
      errors: { 'timings.3.closes_at': ['Closing time must be after opening time for Thursday.'] },
    });

    expect(form.get('timings.3.closes_at')?.errors).toEqual({
      server: 'Closing time must be after opening time for Thursday.',
    });
  });

  it('returns messages that match no control', () => {
    const form = new FormGroup({ email: new FormControl('') });

    expect(applyServerErrors(form, { errors: { reason: ['Required.'] } })).toEqual(['Required.']);
  });
});

describe('firstErrorMessage', () => {
  it('prefers the server message, then built-in validators', () => {
    const control = new FormControl('', [Validators.required]);
    control.markAsTouched();

    expect(firstErrorMessage(control, 'Email')).toBe('Email is required.');

    control.setErrors({ server: 'Taken.' });
    expect(firstErrorMessage(control, 'Email')).toBe('Taken.');
  });
});
