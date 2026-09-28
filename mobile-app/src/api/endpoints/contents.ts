import { http } from '../client';
import { Content, ContentListItem, ContentPeriod, ContentType, Paginated } from '../types';

export async function getContents(
  type: ContentType,
  period: ContentPeriod,
  page = 1,
): Promise<Paginated<ContentListItem>> {
  return (await http.get<Paginated<ContentListItem>>('/contents', { type, period, page })).data;
}

export async function getContent(id: number): Promise<Content> {
  return (await http.get<Content>(`/contents/${id}`)).data;
}
