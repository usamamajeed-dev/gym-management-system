import { Member } from '../members/member.model';

/** Response of GET /dashboard. */
export interface Dashboard {
  members: MemberCounts;
  registrations_by_month: MonthCount[];
  pending_members: Member[];
  recent_members: Member[];
  events: EventCounts;
  contents: ContentCounts;
  gym: GymStatus;
}

export interface MemberCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  active: number;
  inactive: number;
  new_this_month: number;
}

export interface MonthCount {
  /** YYYY-MM */
  month: string;
  count: number;
}

export interface EventTypeOption {
  value: number;
  title: string;
  color: string;
}

export interface DashboardEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  is_published: boolean;
  event_type?: EventTypeOption;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
}

export interface EventCounts {
  this_month: number;
  upcoming: number;
  drafts: number;
  next: DashboardEvent[];
}

export interface DashboardContent {
  id: number;
  type: 'news' | 'policy';
  title: string;
  slug: string;
  excerpt: string;
  image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface ContentCounts {
  news_published: number;
  policies_published: number;
  drafts: number;
  archived: number;
  latest: DashboardContent[];
}

export interface GymTimingDay {
  day_of_week: number;
  day_name: string;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
  updated_at: string | null;
}

export interface GymStatus {
  is_open_now: boolean;
  today_timing: GymTimingDay | null;
  timezone: string;
}
