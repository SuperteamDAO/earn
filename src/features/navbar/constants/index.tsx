interface NavItem {
  label: string;
  children?: Array<NavItem>;
  href?: string;
}

export const LISTING_NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Bounties',
    href: '/bounties/',
  },
  {
    label: 'Projects',
    href: '/projects/',
  },
];

export const CATEGORY_NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Content',
    href: '/category/content/',
  },
  {
    label: 'Design',
    href: '/category/design/',
  },
  {
    label: 'Development',
    href: '/category/development/',
  },
  {
    label: 'Other',
    href: '/category/other/',
  },
];

export const HACKATHON_NAV_ITEMS: Array<NavItem> = [
  // {
  //   label: 'Renaissance',
  //   href: '/renaissance/',
  // },
  // {
  //   label: 'Scribes',
  //   href: '/scribes/',
  // },
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
