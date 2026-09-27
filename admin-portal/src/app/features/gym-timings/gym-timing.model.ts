export interface GymTiming {
  /** 0 = Sunday … 6 = Saturday */
  day_of_week: number;
  day_name: string;
  is_closed: boolean;
  /** "HH:mm" in the gym's timezone, or null when closed. */
  opens_at: string | null;
  closes_at: string | null;
  updated_at: string | null;
}

export interface GymTimingsResponse {
  timings: GymTiming[];
  timezone: string;
  is_open_now: boolean;
}

export interface GymTimingInput {
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
}
