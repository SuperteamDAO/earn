import { useQuery } from '@tanstack/react-query';
import parse, {
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SuperteamIcon from '@/components/icons/SuperteamIcon';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { type BountyType } from '@/generated/prisma/enums';
import { useMediaQuery } from '@/hooks/use-media-query';
import { domPurify } from '@/lib/domPurify';
import { useUser } from '@/store/user';
import styles from '@/styles/listing-description.module.css';
import { cn } from '@/utils/cn';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { ProBadge } from '@/features/pro/components/ProBadge';
import { ProIntro } from '@/features/pro/components/ProIntro';

interface Props {
  description?: string;
  type: BountyType | 'grant';
  sponsorId: string;
  isPro?: boolean;
}

export function DescriptionUI({
  description,
  type,
  sponsorId,
  isPro = false,
}: Props) {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: stats, isLoading: isStatsLoading } = useQuery(userStatsQuery);

  const options: HTMLReactParserOptions = {
    replace: (domNode: any) => {
      const { name, children, attribs } = domNode;
      if (name === 'p' && (!children || children.length === 0)) {
        return <br />;
      }
      if (name === 'a' && attribs) {
        return (
          <a {...attribs} target="_blank" rel="noopener noreferrer">
            {domToReact(children, options)}
          </a>
        );
      }
      return domNode;
    },
  };

  //to resolve a chain of hydration errors
  const [isMounted, setIsMounted] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [showCollapser, setShowCollapser] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isNotMD = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const decideCollapser = useCallback(() => {
    if (descriptionRef.current) {
      const fiftyVH = window.innerHeight / 2;
      if (isNotMD && descriptionRef.current.clientHeight > fiftyVH) {
        setShowCollapser(true);
        setShowMore(false);
      }
    }
  }, [isNotMD, setShowCollapser, setShowMore]);

  useEffect(() => {
    // Use a timeout to ensure the DOM has been updated
    const timer = setTimeout(() => {
      decideCollapser();
    }, 0);

    return () => clearTimeout(timer);
  }, [decideCollapser, isMounted]);

  const descriptionContent = useMemo(() => {
    if (!isMounted) return null;

    // Safely parse JSON-encoded descriptions with fallback
    let normalizedDescription = description ?? '';
    if (normalizedDescription.startsWith('"')) {
      try {
        normalizedDescription = JSON.parse(normalizedDescription) as string;
      } catch {
        // Fallback: use original string if JSON parsing fails
        normalizedDescription = description ?? '';
      }
    }

    return parse(
      domPurify(normalizedDescription, {
        ALLOWED_TAGS: [
          'a',
          'p',
          'br',
          'strong',
          'em',
          'b',
          'i',
          'u',
          's',
          'blockquote',
          'pre',
          'code',
          'ul',
          'ol',
          'li',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'hr',
          'table',
          'thead',
          'tbody',
          'tr',
          'td',
          'th',
          'span',
          'img',
        ],
        ALLOWED_ATTR: [
          'href',
          'target',
          'rel',
          'src',
          'alt',
          'title',
          'width',
          'height',
          'colspan',
          'rowspan',
          'class',
        ],
        FORBID_TAGS: [
          'script',
          'iframe',
          'style',
          'meta',
          'link',
          'object',
          'embed',
          'base',
          'form',
        ],
      }),
      options,
    );
  }, [isMounted, description, options]);

  const isProEligibilityLoading = isPro && (isUserLoading || isStatsLoading);
  if (isProEligibilityLoading) {
    return (
      <div className="w-full overflow-visible border-b-2 border-slate-200 pb-4 md:border-0">
        <div className="relative w-full overflow-visible rounded-xl bg-white">
          <div className="mt-4 w-full overflow-visible pb-7">
            <div className="space-y-4">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUserSponsor = user?.currentSponsorId === sponsorId;
  if (isPro && !user?.isPro && !isUserSponsor) {
    const randomText =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. <br/> Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.';

    const isUserEligibleForPro =
      (stats && (stats.totalWinnings ?? 0) >= 1000) ||
      user?.superteamLevel?.includes('Superteam');

    return (
      <div className="relative h-180 w-full overflow-hidden border-b-2 border-slate-200 md:border-0">
        <div className="absolute inset-0 p-4">
          <div className="mx-auto max-w-4xl text-lg leading-relaxed font-medium text-slate-600 blur-sm select-none">
            {randomText}
          </div>
          <div className="mx-auto max-w-4xl text-lg leading-relaxed font-medium text-slate-600 blur-sm select-none">
            {randomText}
          </div>
          <div className="mx-auto max-w-4xl text-lg leading-relaxed font-medium text-slate-600 blur-sm select-none">
            {randomText}
          </div>
        </div>
        <div className="absolute inset-0 bg-white/0 backdrop-blur-sm" />
        <div className="absolute right-1/2 bottom-1/2 translate-x-1/2 translate-y-1/2 shadow-lg">
          {!isUserEligibleForPro ? (
            <div className="w-100 rounded-xl bg-white px-8 pt-6 pb-10">
              <ProBadge
                containerClassName="bg-zinc-200 w-fit px-2 py-0.5 gap-1"
                iconClassName="size-3 text-zinc-500"
                textClassName="text-sm text-zinc-800 text-medium"
              />
              <p className="mt-4 text-xl font-medium text-zinc-800">
                This {type} is only eligible for PRO members
              </p>
              <p className="text-md mt-4 mb-4 font-medium text-slate-500">
                To be eligible for Pro, you need to:
              </p>
              <div className="mt-4 flex items-center gap-3">
                <CircularProgress
                  className="size-7 shrink-0"
                  value={stats ? ((stats.totalWinnings ?? 0) / 1000) * 100 : 0}
                  color="#6366f1"
                />
                <div className="flex flex-col">
                  {stats ? (
                    <p className="text-md text-slate-500">
                      Earn{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(1000 - (stats.totalWinnings ?? 0))}{' '}
                      more, or
                    </p>
                  ) : (
                    <p className="text-md text-slate-500">Win $1,000 on Earn</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <SuperteamIcon className="text-brand-purple ml-0.5 size-9" />
                <div className="flex flex-col">
                  <p className="text-md text-slate-500">
                    Become a Superteam member of your region
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ProIntro origin="sidebar" className="w-80" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full overflow-visible border-b-2 border-slate-200 md:border-0',
        showMore && 'pb-4',
      )}
    >
      <div
        ref={descriptionRef}
        className="relative w-full overflow-visible rounded-xl bg-white"
      >
        <div
          className={cn(
            'transition-all duration-200',
            !showMore && 'h-[50vh] overflow-hidden',
          )}
        >
          <div
            className={`${styles.content} mt-4 w-full overflow-visible pb-7`}
          >
            {descriptionContent}
          </div>
          {!showMore && (
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 h-[40%]"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.9))',
              }}
            />
          )}
        </div>
        {showCollapser && (
          <Button
            className={cn(
              'absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border-slate-300 bg-white text-sm font-medium text-slate-500',
              showMore && '-bottom-8',
            )}
            onClick={() => setShowMore(!showMore)}
            size="sm"
            variant="outline"
          >
            <span>Read {showMore ? <span>Less</span> : <span>More</span>}</span>
            <ChevronDown
              className={`ml-0 h-5 w-5 text-slate-500 transition-transform duration-200 ${
                showMore ? 'rotate-180' : ''
              }`}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
