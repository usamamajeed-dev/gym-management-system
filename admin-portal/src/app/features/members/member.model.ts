import { ListQuery } from '../../core/api/api.models';

export type MemberStatus = 'pending' | 'approved' | 'rejected';
export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  membership_number: string | null;
  status: MemberStatus;
  is_active: boolean;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface MemberListQuery extends ListQuery {
  status?: MemberStatus;
  is_active?: 'true' | 'false';
}

/** Profile fields an admin can edit; status changes go through the approval actions. */
export type MemberUpdate = Partial<
  Pick<
    Member,
    | 'name'
    | 'email'
    | 'phone'
    | 'date_of_birth'
    | 'gender'
    | 'address'
    | 'emergency_contact_name'
    | 'emergency_contact_phone'
  >
>;

export const GENDER_LABELS: Record<Gender, string> = { male: 'Male', female: 'Female', other: 'Other' };

/** Columns the API allows sorting by. */
export const MEMBER_SORTABLE = ['id', 'name', 'email', 'status', 'created_at', 'approved_at'] as const;
