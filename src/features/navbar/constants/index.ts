interface NavItem {
  label: string;
  mobileLabel?: string;
  posthog: string;
  children?: Array<NavItem>;
  href: string;
}

export const LISTING_NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Bounties',
    posthog: 'bounties_navbar',
    href: '/earn/all?tab=bounties',
  },
  {
    label: 'Projects',
    posthog: 'projects_navbar',
    href: '/earn/all?tab=projects',
  },
  {
    label: 'Grants',
    posthog: 'grants_navbar',
    href: '/earn/grants',
  },
];

export const CATEGORY_NAV_ITEMS: Array<NavItem & { pillPH: string }> = [
  {
    label: 'Content',
    posthog: 'content_navbar',
    pillPH: 'content_navpill',
    href: '/earn/all?category=Content',
  },
  {
    label: 'Design',
    posthog: 'design_navbar',
    pillPH: 'design_navpill',
    href: '/earn/all?category=Design',
  },
  {
    label: 'Development',
    mobileLabel: 'Dev',
    posthog: 'development_navbar',
    pillPH: 'development_navpill',
    href: '/earn/all?category=Development',
  },
  {
    label: 'Other',
    posthog: 'other_navbar',
    pillPH: 'other_navpill',
    href: '/earn/all?category=Other',
  },
];

export function renderLabel(navItem: NavItem) {
  return navItem.label;
}
