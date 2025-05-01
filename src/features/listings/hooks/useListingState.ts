import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';

import type {
  ListingSortOption,
  ListingStatus,
  OrderDirection,
} from './useListings';

interface UseListingStateProps {
  defaultTab?: string;
  defaultPill?: string;
}

export const useListingState = ({
  defaultTab = 'all_open',
  defaultPill = 'All',
}: UseListingStateProps) => {
  const posthog = usePostHog();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activePill, setActivePill] = useState(defaultPill);
  const [activeStatus, setActiveStatus] = useState<ListingStatus>('open');
  const [activeSortBy, setActiveSortBy] =
    useState<ListingSortOption>('Due Date');
  const [activeOrder, setActiveOrder] = useState<OrderDirection>('asc');

  const handleTabChange = (tabId: string, posthogEvent: string) => {
    setActiveTab(tabId);
    posthog.capture(posthogEvent);
  };

  const handlePillChange = (pill: string, posthogEvent?: string) => {
    setActivePill(pill);
    if (posthogEvent) {
      posthog.capture(posthogEvent);
    }
  };

  const handleStatusChange = (status: ListingStatus) => {
    setActiveStatus(status);
  };

  const handleSortChange = (
    sortBy: ListingSortOption,
    order: OrderDirection,
  ) => {
    setActiveSortBy(sortBy);
    setActiveOrder(order);
  };

  return {
    activeTab,
    activePill,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleTabChange,
    handlePillChange,
    handleStatusChange,
    handleSortChange,
  };
};
