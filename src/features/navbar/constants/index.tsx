import { RenaissanceSecondaryLogo } from '@/svg/renaissance-secondary';
import { ScribesLogo } from '@/svg/scribes-logo';

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
];

export const HACKATHON_NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Renaissance',
    href: '/renaissance/',
    posthog: 'renaissance_navbar',
  },
  {
    label: 'Scribes',
    href: '/scribes/',
    posthog: 'scribes_navbar',
  },
];

export function renderLabel(navItem: NavItem) {
  switch (navItem.label) {
    case 'Renaissance':
      return (
        <RenaissanceSecondaryLogo styles={{ width: '116px', height: 'auto' }} />
      );
    case 'Scribes':
      return (
        <ScribesLogo
          styles={{ width: '60px', height: 'auto' }}
          variant="#a459ff"
        />
      );
    default:
      return navItem.label;
  }
}
