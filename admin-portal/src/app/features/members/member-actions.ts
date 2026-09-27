import { Permission } from '../../core/auth/auth.models';
import { Member } from './member.model';

export type MemberAction = 'approve' | 'reject' | 'activate' | 'deactivate' | 'view' | 'edit' | 'delete';

export interface MemberActionMeta {
  label: string;
  icon: string;
  permission: Permission;
  danger?: boolean;
}

export const MEMBER_ACTION_META: Record<MemberAction, MemberActionMeta> = {
  approve: { label: 'Approve', icon: 'check_circle', permission: 'members.approve' },
  reject: { label: 'Reject', icon: 'cancel', permission: 'members.approve', danger: true },
  activate: { label: 'Activate', icon: 'play_circle', permission: 'members.approve' },
  deactivate: { label: 'Deactivate', icon: 'pause_circle', permission: 'members.approve' },
  view: { label: 'View profile', icon: 'person', permission: 'members.view' },
  edit: { label: 'Edit details', icon: 'edit', permission: 'members.manage' },
  delete: { label: 'Delete', icon: 'delete', permission: 'members.manage', danger: true },
};

/**
 * What an admin can do with a member in its current state. Mirrors the backend's rules:
 * approve from pending or rejected, reject from pending, activate/deactivate approved members.
 */
export function availableActions(member: Pick<Member, 'status' | 'is_active'>): MemberAction[] {
  switch (member.status) {
    case 'pending':
      return ['approve', 'reject', 'view', 'delete'];
    case 'rejected':
      return ['approve', 'view', 'delete'];
    case 'approved':
      return member.is_active ? ['deactivate', 'view', 'edit', 'delete'] : ['activate', 'view', 'edit', 'delete'];
  }
}
