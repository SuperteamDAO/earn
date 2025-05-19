import { cn } from '@/utils/cn';

import { type ListingTab } from '../hooks/useListings';

const TABS = [
  { id: 'all', title: 'All', posthog: 'all_listings' },
  { id: 'bounties', title: 'Bounties', posthog: 'bounties_listings' },
  { id: 'projects', title: 'Projects', posthog: 'projects_listings' },
] as const;

interface ListingTabTriggerProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ListingTabTrigger = ({
  isActive,
  onClick,
  children,
}: ListingTabTriggerProps) => (
  <button
    onClick={onClick}
    className={cn(
      'group ring-offset-background relative inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-all',
      'hover:text-brand-purple',
      isActive && [
        'text-brand-purple',
        'after:bg-brand-purple/80 after:absolute after:bottom-[-5px] after:left-0 after:h-[1px] after:w-full md:after:bottom-[-9px]',
      ],
      !isActive && 'text-slate-500',
    )}
  >
    {children}
  </button>
);

interface ListingTabsProps {
  activeTab: ListingTab;
  handleTabChange: (tabId: ListingTab, posthog: string) => void;
}

export const ListingTabs = ({
  activeTab,
  handleTabChange,
}: ListingTabsProps) => {
  return (
    <div className="flex items-center gap-2">
      {TABS.map((tab) => (
        <ListingTabTrigger
          key={tab.id}
          isActive={activeTab === tab.id}
          onClick={() => handleTabChange(tab.id, tab.posthog)}
        >
          <span>{tab.title}</span>
        </ListingTabTrigger>
      ))}
    </div>
  );
};
