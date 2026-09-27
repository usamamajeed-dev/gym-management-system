import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EventTypeFormDialogComponent } from './event-type-form-dialog.component';

describe('EventTypeFormDialogComponent colour field', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EventTypeFormDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
  });

  it('keeps the colour picker and hex field in sync both ways', async () => {
    const fixture = TestBed.createComponent(EventTypeFormDialogComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const picker = el.querySelector('input[type="color"]') as HTMLInputElement;
    const hex = el.querySelector('#type-color-hex') as HTMLInputElement;

    // picker → hex
    picker.value = '#ea580c';
    picker.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(hex.value).toBe('#EA580C');

    // hex → picker
    hex.value = '#059669';
    hex.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(picker.value).toBe('#059669');

    // an incomplete hex keeps the picker on a valid colour
    hex.value = '#05';
    hex.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(picker.value).toMatch(/^#[0-9a-f]{6}$/);
  });
});
