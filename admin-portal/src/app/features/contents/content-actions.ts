import { ContentListItem } from './content.model';

export type ContentAction = 'edit' | 'publish' | 'archive' | 'preview' | 'delete';

/** Actions per status, matching the backend lifecycle: draft/archived → published → archived. */
export function contentActions(item: Pick<ContentListItem, 'status'>): ContentAction[] {
  switch (item.status) {
    case 'draft':
      return ['edit', 'publish', 'preview', 'delete'];
    case 'published':
      return ['edit', 'archive', 'preview', 'delete'];
    case 'archived':
      return ['edit', 'publish', 'preview', 'delete'];
  }
}

export function actionLabel(action: ContentAction, item: Pick<ContentListItem, 'status'>): string {
  switch (action) {
    case 'edit':
      return 'Edit';
    case 'publish':
      return item.status === 'archived' ? 'Re-publish' : 'Publish';
    case 'archive':
      return 'Archive';
    case 'preview':
      return 'Preview';
    case 'delete':
      return 'Delete';
  }
}

export const ACTION_ICONS: Record<ContentAction, string> = {
  edit: 'edit',
  publish: 'publish',
  archive: 'inventory_2',
  preview: 'visibility',
  delete: 'delete',
};
