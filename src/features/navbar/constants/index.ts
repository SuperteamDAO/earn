interface NavItem {
  label: string;
  posthog: string;
  children?: Array<NavItem>;
  href: string;
  altActive?: string[];
}

export const LISTING_NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Bounties',
    href: '/bounties/',
    posthog: 'bounties_navbar',
  },
  {
    label: 'Projects',
    href: '/projects/',
    posthog: 'projects_navbar',
  },
  {
    label: 'Grants',
    href: '/grants/',
    posthog: 'grants_navbar',
  },
];

export const CATEGORY_NAV_ITEMS: Array<NavItem & { pillPH: string }> = [
  {
    label: 'Content',
    href: '/category/content/',
    posthog: 'content_navbar',
    pillPH: 'content_navpill',
    altActive: ['/category/design/all/'],
  },
  {
    label: 'Design',
    href: '/category/design/',
    posthog: 'design_navbar',
    pillPH: 'design_navpill',
    altActive: ['/category/design/all/'],
  },
  {
    label: 'Development',
    href: '/category/development/',
    posthog: 'development_navbar',
    pillPH: 'development_navpill',
    altActive: ['/category/development/all/'],
  },
  {
    label: 'Other',
    href: '/category/other/',
    posthog: 'other_navbar',
    pillPH: 'other_navpill',
    altActive: ['/category/other/all/'],
  },
];

export function renderLabel(navItem: NavItem) {
  switch (navItem.label) {
    // case 'Renaissance':
    //   return (
    //     <RenaissanceSecondaryLogo styles={{ width: '116px', height: 'auto' }} />
    //   );
    default:
      return navItem.label;
  }
}
