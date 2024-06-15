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

export const CATEGORY_NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Content',
    href: '/category/content/',
    posthog: 'content_navbar',
    altActive: ['/category/design/all/'],
  },
  {
    label: 'Design',
    href: '/category/design/',
    posthog: 'design_navbar',
    altActive: ['/category/design/all/'],
  },
  {
    label: 'Development',
    href: '/category/development/',
    posthog: 'development_navbar',
    altActive: ['/category/development/all/'],
  },
  {
    label: 'Other',
    href: '/category/other/',
    posthog: 'other_navbar',
    altActive: ['/category/other/all/'],
  },
];

// export const HACKATHON_NAV_ITEMS: Array<NavItem> = [
// {
//   label: 'Renaissance',
//   href: '/renaissance/',
//   posthog: 'renaissance_navbar',
// },
// {
//   label: 'Scribes',
//   href: '/scribes/',
//   posthog: 'scribes_navbar',
// },
// ];

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
