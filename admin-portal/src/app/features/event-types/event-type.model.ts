import { ListQuery } from '../../core/api/api.models';

export interface EventType {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  is_active: boolean;
  events_count?: number;
  created_at: string;
  updated_at: string;
}

/** Compact shape used by dropdowns and badges. */
export interface EventTypeOption {
  value: number;
  title: string;
  color: string;
}

export interface EventTypePayload {
  name: string;
  color: string;
  description: string | null;
  is_active: boolean;
}

export type EventTypeListQuery = ListQuery;
