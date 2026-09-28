import { http } from '../client';
import { Dashboard } from '../types';

export async function getDashboard(): Promise<Dashboard> {
  return (await http.get<Dashboard>('/dashboard')).data;
}
