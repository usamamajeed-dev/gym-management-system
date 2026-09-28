import { NETWORK_ERROR_MESSAGE } from '../utils/errors';
import { loginErrorView } from './loginErrorView';

describe('loginErrorView', () => {
  it('INVALID_CREDENTIALS → inline server message', () => {
    expect(
      loginErrorView({ status: 401, error_code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }),
    ).toEqual({ kind: 'inline', message: 'Invalid email or password.' });
  });

  it('MEMBER_PENDING → yellow awaiting-approval banner', () => {
    expect(loginErrorView({ status: 403, error_code: 'MEMBER_PENDING', message: 'x' })).toEqual({
      kind: 'banner',
      tone: 'warning',
      title: 'Awaiting approval',
      message: 'Your registration is awaiting admin approval.',
    });
  });

  it('MEMBER_REJECTED → red banner with the reason', () => {
    const view = loginErrorView({
      status: 403,
      error_code: 'MEMBER_REJECTED',
      message: 'x',
      errors: { rejection_reason: 'Photo ID was unreadable.' },
    });

    expect(view).toMatchObject({ kind: 'banner', tone: 'danger' });
    expect(view.message).toBe('Photo ID was unreadable. Contact the gym for details.');
  });

  it('MEMBER_REJECTED also accepts the reason as an array', () => {
    const view = loginErrorView({
      status: 403,
      error_code: 'MEMBER_REJECTED',
      message: 'x',
      errors: { rejection_reason: ['Missing ID.'] },
    });

    expect(view.message).toBe('Missing ID. Contact the gym for details.');
  });

  it('MEMBER_INACTIVE → red inactive banner', () => {
    expect(loginErrorView({ status: 403, error_code: 'MEMBER_INACTIVE', message: 'x' })).toMatchObject({
      kind: 'banner',
      tone: 'danger',
      message: 'Your membership is inactive. Please contact the gym.',
    });
  });

  it('429 → try again in N seconds', () => {
    expect(loginErrorView({ status: 429, message: 'Too many', retry_after: 42 })).toEqual({
      kind: 'inline',
      message: 'Too many attempts. Try again in 42 seconds.',
    });
  });

  it('network failure → no connection', () => {
    expect(loginErrorView({ message: NETWORK_ERROR_MESSAGE, network: true })).toMatchObject({
      kind: 'banner',
      message: NETWORK_ERROR_MESSAGE,
    });
  });
});
