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
    href: '/all?tab=bounties',
  },
  {
    label: 'Projects',
    posthog: 'projects_navbar',
    href: '/all?tab=projects',
  },
  {
    label: 'Grants',
    posthog: 'grants_navbar',
    href: '/grants',
  },
];

export const CATEGORY_NAV_ITEMS: Array<NavItem & { pillPH: string }> = [
  {
    label: 'Content',
    posthog: 'content_navbar',
    pillPH: 'content_navpill',
    href: '/all?category=Content',
  },
  {
    label: 'Design',
    posthog: 'design_navbar',
    pillPH: 'design_navpill',
    href: '/all?category=Design',
  },
  {
    label: 'Development',
    mobileLabel: 'Dev',
    posthog: 'development_navbar',
    pillPH: 'development_navpill',
    href: '/all?category=Development',
  },
  {
    label: 'Other',
    posthog: 'other_navbar',
    pillPH: 'other_navpill',
    href: '/all?category=Other',
  },
];

export function renderLabel(navItem: NavItem) {
  return navItem.label;
}
