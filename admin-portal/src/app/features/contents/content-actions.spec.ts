import { actionLabel, contentActions } from './content-actions';

describe('contentActions', () => {
  it('draft: edit, publish, preview, delete', () => {
    expect(contentActions({ status: 'draft' })).toEqual(['edit', 'publish', 'preview', 'delete']);
  });

  it('published: edit, archive, preview, delete', () => {
    expect(contentActions({ status: 'published' })).toEqual(['edit', 'archive', 'preview', 'delete']);
  });

  it('archived: edit, re-publish, preview, delete', () => {
    expect(contentActions({ status: 'archived' })).toEqual(['edit', 'publish', 'preview', 'delete']);
    expect(actionLabel('publish', { status: 'archived' })).toBe('Re-publish');
    expect(actionLabel('publish', { status: 'draft' })).toBe('Publish');
  });
});
