import { EmptySection } from '@/components/shared/EmptySection';
import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { requestPath } from '@/lib/request-path';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';

import { HomeSideBar } from '@/features/home/components/SideBar';
import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

export const metadata = pageMetadata({
  title: 'Bookmarks | Superteam Earn',
  description: 'Your bookmarks on Superteam Earn',
  canonical: 'https://superteam.fun/earn/bookmarks/',
});

const customEmptySection = (filters: EmptySectionFilters) => {
  const isAllCategory = filters.activeCategory === 'All';
  const title = isAllCategory
    ? "You don't have any bookmarks"
    : 'You have no bookmarks in this category';
  const message =
    'Add some to your bookmarks to keep track of your favorite opportunities';

  return <EmptySection title={title} message={message} />;
};

export default async function BookmarksPage({
  searchParams,
}: PageProps<'/earn/bookmarks'>) {
  const viewer = await getViewer();
  // Signed out, Earn showed the empty list; a lapsed session renews first.
  if (!viewer && (await canResume())) {
    const here = (await requestPath()) ?? '/earn/bookmarks/';
    return (
      <Default className="bg-white">
        <ResumingPage signIn={signInHref(here)} />
      </Default>
    );
  }

  return (
    <Default className="bg-white">
      <div className="mx-auto h-full w-full px-2 lg:px-6">
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="min-h-screen w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="w-full">
                  <ListingsSection
                    type="bookmarks"
                    searchParams={await searchParams}
                    customEmptySection={customEmptySection}
                  />
                </div>
              </div>
            </div>
            <div className="hidden lg:flex">
              <HomeSideBar type="landing" hideBookmarks />
            </div>
          </div>
        </div>
      </div>
    </Default>
  );
}
