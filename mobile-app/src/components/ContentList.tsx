import { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ContentListItem, ContentPeriod, ContentType } from '../api/types';
import { useContents } from '../hooks/useContents';
import { useRefresh } from '../hooks/useRefresh';
import { useAppTheme } from '../theme/paperTheme';
import { spacing } from '../theme/spacing';
import { toApiError } from '../utils/errors';
import { EmptyState, IconName } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

interface ContentListProps {
  type: ContentType;
  period: ContentPeriod;
  renderItem: (item: ContentListItem) => ReactElement;
  header?: ReactNode;
  empty: { icon: IconName; title: string; message: string };
}

/** Infinite list of news or policies with pull-to-refresh and a loading footer. */
export function ContentList({ type, period, renderItem, header, empty }: ContentListProps) {
  const { app } = useAppTheme();
  const query = useContents(type, period);
  const { refreshing, onRefresh } = useRefresh(query.refetch);
  const items = query.data?.pages.flatMap((page) => page.list) ?? [];

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  };

  return (
    <FlatList
      style={{ backgroundColor: app.background }}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <View style={styles.item}>{renderItem(item)}</View>}
      ListHeaderComponent={<View style={styles.header}>{header}</View>}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={app.primary} colors={[app.primary]} />
      }
      ListFooterComponent={
        query.isFetchingNextPage ? <ActivityIndicator color={app.primary} style={styles.footer} /> : null
      }
      ListEmptyComponent={
        query.isPending ? (
          <LoadingState rows={3} />
        ) : query.isError ? (
          <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
        ) : (
          <EmptyState icon={empty.icon} title={empty.title} message={empty.message} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  item: { marginBottom: spacing.md },
  footer: { marginVertical: spacing.lg },
});
