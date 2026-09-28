import { router } from 'expo-router';
import { useState } from 'react';

import { ContentPeriod } from '@/api/types';
import { ContentList } from '@/components/ContentList';
import { PeriodSwitch } from '@/components/PeriodSwitch';
import { PolicyRow } from '@/components/PolicyRow';

export default function PoliciesScreen() {
  const [period, setPeriod] = useState<ContentPeriod>('current');

  return (
    <ContentList
      key={period}
      type="policy"
      period={period}
      header={<PeriodSwitch value={period} onChange={setPeriod} currentLabel="Current" />}
      renderItem={(item) => <PolicyRow item={item} onPress={() => router.push(`/contents/${item.id}`)} />}
      empty={
        period === 'current'
          ? {
              icon: 'shield-check-outline',
              title: 'No policies yet',
              message: 'Gym rules and policies will appear here.',
            }
          : {
              icon: 'archive-outline',
              title: 'No older policies',
              message: 'Replaced policies are kept here for reference.',
            }
      }
    />
  );
}
