import { http } from '../client';
import { Member } from '../types';

export async function getProfile(): Promise<Member> {
  return (await http.get<Member>('/profile')).data;
}
