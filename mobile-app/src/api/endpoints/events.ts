import { http } from '../client';
import { EventsResponse, GymEvent } from '../types';

/** Published events overlapping a month (YYYY-MM, default current). */
export async function getEvents(month?: string): Promise<EventsResponse> {
  return (await http.get<EventsResponse>('/events', month ? { month } : undefined)).data;
}

export async function getEvent(id: number): Promise<GymEvent> {
  return (await http.get<GymEvent>(`/events/${id}`)).data;
}
