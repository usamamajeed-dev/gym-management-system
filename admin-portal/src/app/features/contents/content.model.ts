import { ListQuery } from '../../core/api/api.models';

export type ContentType = 'news' | 'policy';
export type ContentStatus = 'draft' | 'published' | 'archived';

/** List item: everything except the body. */
export interface ContentListItem {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string | null;
  status: ContentStatus;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface Content extends ContentListItem {
  /** Sanitised HTML (p, br, strong, em, ul, ol, li, a, h2, h3, blockquote). */
  body: string;
  updated_at: string;
}

export interface ContentListQuery extends ListQuery {
  type: ContentType;
  status?: ContentStatus;
}

/** Create/update values. `status` is only sent when creating. */
export interface ContentPayload {
  title: string;
  excerpt: string | null;
  body: string;
  status?: 'draft' | 'published';
}

export interface ContentImageState {
  file: File | null;
  removed: boolean;
}

/** Wording that depends on the content type. */
export const CONTENT_LABELS: Record<ContentType, { singular: string; plural: string; newLabel: string; icon: string }> =
  {
    news: { singular: 'news item', plural: 'News', newLabel: 'New news item', icon: 'newspaper' },
    policy: { singular: 'policy', plural: 'Policies', newLabel: 'New policy', icon: 'policy' },
  };

export const CONTENT_SORTABLE = ['id', 'title', 'published_at', 'created_at'] as const;
