import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, EMPTY, filter, map, Observable, of, switchMap } from 'rxjs';

import { ApiResponse } from '../../core/api/api.models';
import { errorCode, errorStatus, toApiError } from '../../core/api/api-error';
import { PendingMembersService } from '../../core/layout/pending-members.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../core/ui/confirm-dialog.component';
import { NotifyService } from '../../core/ui/notify.service';
import { MemberAction } from './member-actions';
import { Member } from './member.model';
import { MembersService } from './members.service';
import { MemberEditDialogComponent } from './member-edit-dialog/member-edit-dialog.component';
import { RejectDialogComponent } from './reject-dialog/reject-dialog.component';

/** What happened after running an action. Cancelled dialogs emit nothing. */
export type MemberActionResult =
  | { kind: 'updated'; member: Member }
  | { kind: 'deleted'; member: Member }
  /** Someone else changed the member first (409): reload to show the current state. */
  | { kind: 'stale' };

/**
 * Runs a member action end to end: confirmation or reason dialog, API call,
 * success toast with the server message, and a refresh of the pending badge.
 * Shared by the members list, the member page and the dashboard.
 */
@Injectable({ providedIn: 'root' })
export class MemberActionsService {
  private readonly members = inject(MembersService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);
  private readonly pending = inject(PendingMembersService);
  private readonly router = inject(Router);

  run(action: MemberAction, member: Member): Observable<MemberActionResult> {
    switch (action) {
      case 'view':
        void this.router.navigate(['/members', member.id]);
        return EMPTY;
      case 'edit':
        return MemberEditDialogComponent.open(this.dialog, member).pipe(
          filter((updated): updated is Member => updated !== undefined),
          map((updated) => ({ kind: 'updated' as const, member: updated })),
        );
      case 'approve':
        return this.confirmThen(
          {
            title: `Approve ${member.name}?`,
            message:
              "They'll be activated, get a membership number and can log in to the member app. They'll also receive an email.",
            confirmText: 'Approve',
            tone: 'success',
            icon: 'how_to_reg',
          },
          () => this.members.approve(member.id),
        );
      case 'reject':
        return RejectDialogComponent.open(this.dialog, { memberName: member.name }).pipe(
          filter((reason): reason is string => !!reason),
          switchMap((reason) => this.execute(this.members.reject(member.id, reason))),
        );
      case 'activate':
        return this.execute(this.members.activate(member.id));
      case 'deactivate':
        return this.confirmThen(
          {
            title: `Deactivate ${member.name}?`,
            message: "They'll be signed out of the app right away and can't log in until you activate them again.",
            confirmText: 'Deactivate',
            tone: 'warning',
            icon: 'pause_circle',
          },
          () => this.members.deactivate(member.id),
        );
      case 'delete':
        return this.confirmThen(
          {
            title: `Delete ${member.name}?`,
            message: 'The member is removed and signed out of the app. This cannot be undone from the portal.',
            confirmText: 'Delete member',
            tone: 'danger',
          },
          () => this.members.delete(member.id),
        ).pipe(map((result) => (result.kind === 'stale' ? result : { kind: 'deleted' as const, member })));
    }
  }

  private confirmThen(
    data: ConfirmDialogData,
    request: () => Observable<ApiResponse<Member | null>>,
  ): Observable<MemberActionResult> {
    return ConfirmDialogComponent.open(this.dialog, data).pipe(
      filter(Boolean),
      switchMap(() => this.execute(request())),
    );
  }

  private execute(request: Observable<ApiResponse<Member | null>>): Observable<MemberActionResult> {
    return request.pipe(
      map((response) => {
        this.notify.success(response.message);
        this.pending.refresh();
        return { kind: 'updated' as const, member: response.data as Member };
      }),
      catchError((error: unknown) => {
        if (errorStatus(error) === 409 || errorCode(error) === 'INVALID_MEMBER_TRANSITION') {
          this.notify.error(toApiError(error).message);
          this.pending.refresh();
          return of({ kind: 'stale' as const });
        }
        if (errorStatus(error) === 404) {
          this.notify.error('This member no longer exists.');
          return of({ kind: 'stale' as const });
        }
        if (errorStatus(error) === 422) {
          const apiError = toApiError(error);
          this.notify.error(Object.values(apiError.errors ?? {})[0]?.[0] ?? apiError.message);
        }
        return EMPTY;
      }),
    );
  }
}
