import { ListQuery } from '../../core/api/api.models';
import { EventTypeOption } from '../event-types/event-type.model';

/** A gym event. Named GymEvent to avoid clashing with the DOM's Event type. */
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
  created_by?: { id: number; name: string } | null;
}

export interface EventListQuery extends ListQuery {
  event_type_id?: number;
  is_published?: 'true' | 'false';
  /** Y-m-d in gym time. */
  from?: string;
  to?: string;
}

/** Form values sent to the API. Dates are "YYYY-MM-DD HH:mm" in gym time. */
export interface EventPayload {
  event_type_id: number;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  is_published: boolean;
}

/** What happened to the image in the form. */
export interface ImageState {
  file: File | null;
  removed: boolean;
}

export const EVENT_SORTABLE = ['id', 'title', 'starts_at', 'created_at'] as const;
