/** Success envelope returned by every endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export interface Paginated<T> {
  list: T[];
  pagination: Pagination;
}

/**
 * Normalised error: server message, field errors and machine-readable error code.
 * Validation errors are string arrays; a few codes (e.g. MEMBER_REJECTED) carry a plain string.
 */
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[] | string>;
  error_code?: string;
  retry_after?: number;
  network?: boolean;
}

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

export interface LoginResult {
  token: string;
  token_type: 'Bearer';
  expires_at: string | null;
  user: Member;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  date_of_birth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface GymTiming {
  /** 0 = Sunday … 6 = Saturday */
  day_of_week: number;
  day_name: string;
  is_closed: boolean;
  /** "HH:mm" in the gym's timezone. */
  opens_at: string | null;
  closes_at: string | null;
  updated_at: string | null;
}

export interface GymTimingsResponse {
  timings: GymTiming[];
  today_day_of_week: number;
  is_open_now: boolean;
  timezone: string;
}

export interface EventTypeOption {
  value: number;
  title: string;
  color: string;
}

export interface GymEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  is_published: boolean;
  event_type?: EventTypeOption;
  /** ISO-8601 with the gym's offset. */
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventsResponse {
  /** YYYY-MM */
  month: string;
  events: GymEvent[];
}

export type ContentType = 'news' | 'policy';
export type ContentPeriod = 'current' | 'archive';

export interface ContentListItem {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string | null;
  status: 'published' | 'archived' | 'draft';
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface Content extends ContentListItem {
  body: string;
  updated_at: string;
}

export interface Dashboard {
  member: Member;
  gym: { name: string; timezone: string };
  today_timing: GymTiming | null;
  is_open_now: boolean;
  upcoming_events: GymEvent[];
  latest_news: ContentListItem[];
  counts: { events_this_month: number; policies: number };
}
