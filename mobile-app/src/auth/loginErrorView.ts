import { ApiError } from '../api/types';
import { fieldMessage } from '../utils/errors';

export type LoginErrorView =
  | { kind: 'inline'; message: string }
  | { kind: 'banner'; tone: 'warning' | 'danger' | 'info'; title: string; message: string };

/** What the login screen shows for each refusal from the API. */
export function loginErrorView(error: ApiError): LoginErrorView {
  if (error.network) {
    return { kind: 'banner', tone: 'info', title: 'No connection', message: error.message };
  }

  switch (error.error_code) {
    case 'INVALID_CREDENTIALS':
      return { kind: 'inline', message: error.message };
    case 'MEMBER_PENDING':
      return {
        kind: 'banner',
        tone: 'warning',
        title: 'Awaiting approval',
        message: 'Your registration is awaiting admin approval.',
      };
    case 'MEMBER_REJECTED': {
      const reason = fieldMessage(error, 'rejection_reason');
      return {
        kind: 'banner',
        tone: 'danger',
        title: 'Registration not approved',
        message: `${reason ? `${reason} ` : ''}Contact the gym for details.`,
      };
    }
    case 'MEMBER_INACTIVE':
      return {
        kind: 'banner',
        tone: 'danger',
        title: 'Membership inactive',
        message: 'Your membership is inactive. Please contact the gym.',
      };
  }

  if (error.status === 429) {
    const seconds = error.retry_after ?? 60;
    return { kind: 'inline', message: `Too many attempts. Try again in ${seconds} seconds.` };
  }

  return { kind: 'inline', message: error.message };
}
