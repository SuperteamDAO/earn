import { EmptySection } from '@/components/shared/EmptySection';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { HomeSideBar } from '@/features/home/components/SideBar';
import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

export default function BookmarksPage() {
  const customEmptySection = (filters: EmptySectionFilters) => {
    const isAllCategory = filters.activeCategory === 'All';
    const title = isAllCategory
      ? "You don't have any bookmarks"
      : 'You have no bookmarks in this category';
    const message =
      'Add some to your bookmarks to keep track of your favorite opportunities';

    return <EmptySection title={title} message={message} />;
  };

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Bookmarks | Superteam Earn"
          description="Your bookmarks on Superteam Earn"
          canonical="https://earn.superteam.fun/earn/bookmarks"
        />
      }
    >
      <div className="mx-auto h-full w-full px-2 lg:px-6">
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="min-h-screen w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="w-full">
                  <ListingsSection
                    type="bookmarks"
                    customEmptySection={customEmptySection}
                  />
                </div>
              </div>
            </div>
            <div className="hidden lg:flex">
              <HomeSideBar type="landing" />
            </div>
          </div>
        </div>
      </div>
    </Default>
  );
}
