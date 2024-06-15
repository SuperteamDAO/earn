interface NavItem {
  label: string;
  posthog: string;
  children?: Array<NavItem>;
  href?: string;
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
  },
  {
    label: 'Design',
    href: '/category/design/',
    posthog: 'design_navbar',
  },
  {
    label: 'Development',
    href: '/category/development/',
    posthog: 'development_navbar',
  },
  {
    label: 'Other',
    href: '/category/other/',
    posthog: 'other_navbar',
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
