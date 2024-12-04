import { ArrowRight } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

type ListingSectionProps = {
  children?: React.ReactNode;
  title: string;
  sub: string;
  showEmoji?: boolean;
  type: 'bounties' | 'grants';
  showViewAll?: boolean;
  viewAllLink?: string;
};

export const ListingSection = ({
  children,
  title,
  sub,
  showEmoji = false,
  type,
  showViewAll,
  viewAllLink,
}: ListingSectionProps) => {
  const router = useRouter();
  const posthog = usePostHog();

  const shouldDisplay = router.query.category
    ? router.query.category === type || router.query.category === 'all'
    : true;

  const viewAllHref =
    viewAllLink ||
    (router?.query?.filter
      ? `/${type}/${router?.query?.filter}/`
      : `/${type}/`);

  const showViewAllButton = showViewAll && router?.query?.category !== type;

  const emoji =
    type === 'bounties' ? '/assets/listing-tab.webp' : '/assets/grant-tab.webp';

  return (
    <div
      className={cn(
        'mx-auto my-10 w-[98%] md:w-full',
        shouldDisplay ? 'block' : 'hidden',
      )}
    >
      <div className="mb-4 flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center">
          {showEmoji && (
            <img
              className="mr-3 h-[1.4375rem] w-[1.4375rem]"
              alt="emoji"
              src={emoji}
              loading="lazy"
            />
          )}
          <p className="text-sm font-semibold text-[#334155] md:text-base">
            {title}
          </p>
          <span className="mx-3 hidden text-[0.625rem] text-slate-300 md:block">
            |
          </span>
          <p className="hidden text-xs text-slate-400 md:block md:text-sm">
            {sub}
          </p>
        </div>
        <div
          className={cn(
            'ph-no-capture',
            showViewAllButton ? 'block' : 'hidden',
          )}
        >
          <NextLink href={viewAllHref}>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400"
              onClick={() => {
                if (type === 'grants') {
                  posthog.capture('grants_viewall_top');
                }
              }}
            >
              View All
            </Button>
          </NextLink>
        </div>
      </div>

      <div className="flex flex-col gap-1">{children}</div>

      <div
        className={cn('ph-no-capture', showViewAllButton ? 'block' : 'hidden')}
      >
        <NextLink href={viewAllHref}>
          <Button
            variant="outline"
            size="sm"
            className="my-8 w-full border-slate-300 py-5 text-slate-400"
            onClick={() => {
              if (type === 'grants') {
                posthog.capture('grants_viewall_bottom');
              }
            }}
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </NextLink>
      </div>
    </div>
  );
};
