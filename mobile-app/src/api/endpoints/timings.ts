import { http } from '../client';
import { GymTimingsResponse } from '../types';

export async function getGymTimings(): Promise<GymTimingsResponse> {
  return (await http.get<GymTimingsResponse>('/gym-timings')).data;
}
