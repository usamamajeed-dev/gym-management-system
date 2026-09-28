import { router } from 'expo-router';
import { useState } from 'react';

import { ContentPeriod } from '@/api/types';
import { ContentCard } from '@/components/ContentCard';
import { ContentList } from '@/components/ContentList';
import { PeriodSwitch } from '@/components/PeriodSwitch';

export default function NewsScreen() {
  const [period, setPeriod] = useState<ContentPeriod>('current');

  return (
    <ContentList
      // A new key resets the list (and scroll position) when switching Latest / Older.
      key={period}
      type="news"
      period={period}
      header={<PeriodSwitch value={period} onChange={setPeriod} currentLabel="Latest" />}
      renderItem={(item) => <ContentCard item={item} onPress={() => router.push(`/contents/${item.id}`)} />}
      empty={
        period === 'current'
          ? {
              icon: 'newspaper-variant-outline',
              title: 'No news right now',
              message: 'Updates from the gym will show up here.',
            }
          : { icon: 'archive-outline', title: 'No older news', message: 'News from previous months is kept here.' }
      }
    />
  );
}
