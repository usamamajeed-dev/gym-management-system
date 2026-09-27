export interface AdminUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthToken {
  token: string;
  token_type: 'Bearer';
  expires_at: string | null;
  user: AdminUser;
}

/** Permission names seeded on the backend (guard: api). */
export type Permission =
  | 'dashboard.view'
  | 'members.view'
  | 'members.manage'
  | 'members.approve'
  | 'timings.manage'
  | 'events.manage'
  | 'contents.manage';
