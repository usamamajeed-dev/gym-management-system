import { Permission } from '../auth/auth.models';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission: Permission;
  /** Shows the pending-members count as a badge. */
  badge?: 'pendingMembers';
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'space_dashboard', permission: 'dashboard.view' }],
  },
  {
    title: 'People',
    items: [{ label: 'Members', path: '/members', icon: 'group', permission: 'members.view', badge: 'pendingMembers' }],
  },
  {
    title: 'Gym',
    items: [
      { label: 'Gym Timings', path: '/gym-timings', icon: 'schedule', permission: 'timings.manage' },
      { label: 'Events', path: '/events', icon: 'event', permission: 'events.manage' },
      { label: 'Event Types', path: '/event-types', icon: 'category', permission: 'events.manage' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'News', path: '/news', icon: 'newspaper', permission: 'contents.manage' },
      { label: 'Policies', path: '/policies', icon: 'policy', permission: 'contents.manage' },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
