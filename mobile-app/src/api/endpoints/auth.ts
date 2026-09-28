import { http } from '../client';
import { LoginResult, Member, RegisterPayload } from '../types';

/** Creates a pending registration. Returns the server message; no token is issued. */
export async function register(payload: RegisterPayload): Promise<{ message: string; member: Member }> {
  const res = await http.post<Member>('/auth/register', payload);
  return { message: res.message, member: res.data };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return (await http.post<LoginResult>('/auth/login', { email, password })).data;
}

export async function logout(): Promise<void> {
  await http.post<null>('/auth/logout');
}

export async function me(): Promise<Member> {
  return (await http.get<Member>('/auth/me')).data;
}
