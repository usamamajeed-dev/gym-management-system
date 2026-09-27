import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { RejectDialogComponent } from './reject-dialog.component';

describe('RejectDialogComponent', () => {
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [RejectDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { memberName: 'Jane Doe' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
  });

  function submitButton(el: HTMLElement): HTMLButtonElement {
    return Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Reject member'))!;
  }

  async function typeReason(el: HTMLElement, text: string, fixture: { whenStable(): Promise<unknown> }): Promise<void> {
    const textarea = el.querySelector('textarea')!;
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('keeps submit disabled until the reason is valid', async () => {
    const fixture = TestBed.createComponent(RejectDialogComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Jane Doe');
    expect(submitButton(el).disabled).toBe(true);

    await typeReason(el, 'Bad', fixture);
    expect(submitButton(el).disabled).toBe(true);

    await typeReason(el, 'Photo ID was unreadable.', fixture);
    expect(submitButton(el).disabled).toBe(false);

    submitButton(el).click();
    expect(close).toHaveBeenCalledWith('Photo ID was unreadable.');
  });

  it('fills the reason from a suggestion', async () => {
    const fixture = TestBed.createComponent(RejectDialogComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('.suggestion') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(el.querySelector('textarea')!.value).toBe('Incomplete registration details.');
    expect(submitButton(el).disabled).toBe(false);
  });
});
