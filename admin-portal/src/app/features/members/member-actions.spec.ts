import { availableActions } from './member-actions';

describe('availableActions', () => {
  it('pending: approve, reject, view, delete', () => {
    expect(availableActions({ status: 'pending', is_active: false })).toEqual(['approve', 'reject', 'view', 'delete']);
  });

  it('rejected: approve, view, delete', () => {
    expect(availableActions({ status: 'rejected', is_active: false })).toEqual(['approve', 'view', 'delete']);
  });

  it('approved and active: deactivate, view, edit, delete', () => {
    expect(availableActions({ status: 'approved', is_active: true })).toEqual(['deactivate', 'view', 'edit', 'delete']);
  });

  it('approved and inactive: activate, view, edit, delete', () => {
    expect(availableActions({ status: 'approved', is_active: false })).toEqual(['activate', 'view', 'edit', 'delete']);
  });
});
