interface NavItem {
  label: string;
  posthog: string;
  children?: Array<NavItem>;
  href: string;
  altActive?: string[];
}

export const LISTING_NAV_ITEMS: Array<NavItem> = [
  {
    label: '悬赏',
    href: '/bounties/',
    posthog: 'bounties_navbar',
  },
  {
    label: '项目',
    href: '/projects/',
    posthog: 'projects_navbar',
  },
  {
    label: '资助',
    href: '/grants/',
    posthog: 'grants_navbar',
  },
];

export const CATEGORY_NAV_ITEMS: Array<NavItem & { pillPH: string }> = [
  {
    label: '内容',
    href: '/category/content/',
    posthog: 'content_navbar',
    pillPH: 'content_navpill',
    altActive: ['/category/design/all/'],
  },
  {
    label: '设计',
    href: '/category/design/',
    posthog: 'design_navbar',
    pillPH: 'design_navpill',
    altActive: ['/category/design/all/'],
  },
  {
    label: '开发',
    href: '/category/development/',
    posthog: 'development_navbar',
    pillPH: 'development_navpill',
    altActive: ['/category/development/all/'],
  },
  {
    label: '其他',
    href: '/category/other/',
    posthog: 'other_navbar',
    pillPH: 'other_navpill',
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
