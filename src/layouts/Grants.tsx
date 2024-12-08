import { useAtom } from 'jotai';
import { ExternalLink } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { tokenList } from '@/constants/tokenList';
import {
  DollarIcon,
  grantAmount,
  GrantApplicationButton,
  GrantsHeader,
  type GrantWithApplicationCount,
  PayoutIcon,
  TimeToPayIcon,
} from '@/features/grants';
import { LiveGrants } from '@/features/home';
import { ExtraInfoSection } from '@/features/listings';
import { grantSnackbarAtom } from '@/features/navbar';
import { cn } from '@/utils';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

import { Default } from './Default';

interface GrantPageProps {
  grant: GrantWithApplicationCount | null;
  children: React.ReactNode;
}
export function GrantPageLayout({
  grant: initialGrant,
  children,
}: GrantPageProps) {
  const [grant] = useState<typeof initialGrant>(initialGrant);
  const encodedTitle = encodeURIComponent(initialGrant?.title || '');
  const posthog = usePostHog();
  const [, setGrantSnackbar] = useAtom(grantSnackbarAtom);

  const iterableSkills = initialGrant?.skills?.map((e) => e.skills) ?? [];

  useEffect(() => {
    if (initialGrant) {
      setGrantSnackbar({
        isPublished: !!initialGrant?.isPublished,
      });
    }
  }, [initialGrant]);

  return (
    <Default
      meta={
        <Head>
          <title>{`${initialGrant?.title || 'Grant'} | Superteam Earn`}</title>
          <meta
            property="og:title"
            content={`${initialGrant?.title || 'Grant'} | Superteam Earn`}
          />
          <meta
            property="og:image"
            content={`${getURL()}api/dynamic-og/grant/?title=${encodedTitle}&token=${initialGrant?.token}&sponsor=${initialGrant?.sponsor?.name}&logo=${initialGrant?.sponsor?.logo}&minReward=${initialGrant?.minReward}&maxReward=${initialGrant?.maxReward}&isSponsorVerified=${initialGrant?.sponsor?.isVerified}`}
          />
          <meta
            name="twitter:title"
            content={`${initialGrant?.title || 'Grant'} | Superteam Earn`}
          />
          <meta
            name="twitter:image"
            content={`${getURL()}api/dynamic-og/grant/?title=${encodedTitle}&token=${initialGrant?.token}&sponsor=${initialGrant?.sponsor?.name}&logo=${initialGrant?.sponsor?.logo}&minReward=${initialGrant?.minReward}&maxReward=${initialGrant?.maxReward}&isSponsorVerified=${initialGrant?.sponsor?.isVerified}`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Superteam Grant" />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      <div className="bg-white">
        {grant === null && <LoadingSection />}
        {grant !== null && !grant?.id && <EmptySection />}
        {grant !== null && !!grant?.id && (
          <div className="mx-auto w-full px-2 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">
              <GrantsHeader
                title={grant?.title ?? ''}
                sponsor={grant?.sponsor}
                status={grant?.status}
                region={grant?.region}
                slug={grant?.slug}
                references={grant.references}
                isPublished={grant.isPublished || false}
              />

              <div className="mb-10 flex max-w-6xl flex-col items-center justify-center gap-0 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="static top-14 w-full px-3 md:sticky md:w-auto">
                  <div className="flex flex-col gap-2">
                    <div className="md:[22rem] flex w-full flex-col justify-center rounded-xl bg-white py-4">
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img
                            className="h-9 w-9 rounded-full"
                            alt={'green doller'}
                            src={
                              tokenList.filter(
                                (e) => e?.tokenSymbol === grant.token,
                              )[0]?.icon ?? '/assets/dollar.svg'
                            }
                          />
                          <p className="text-lg font-semibold text-brand-slate-700 md:text-xl">
                            {grantAmount({
                              maxReward: grant.maxReward!,
                              minReward: grant.minReward!,
                            })}{' '}
                            <span className="text-slate-500">
                              {grant.token}
                            </span>
                          </p>
                        </div>
                        <p className="-mt-1 text-sm font-medium text-slate-500">
                          Cheque Size
                        </p>
                      </div>
                      <div
                        className={cn(
                          'flex w-full justify-between py-4',
                          'md:mb-2',
                          grant?.link && !grant?.isNative && 'hidden',
                        )}
                      >
                        <div className="flex w-fit flex-col gap-4">
                          <div className="flex w-fit flex-col">
                            <div className="flex w-fit">
                              <TimeToPayIcon />
                              <p className="text-lg font-medium text-brand-slate-700 md:text-xl">
                                {grant?.avgResponseTime}
                              </p>
                            </div>
                            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
                              Avg. Response Time
                            </p>
                          </div>
                          <div className="flex w-fit flex-col">
                            <div className="flex">
                              <PayoutIcon />
                              <p className="text-lg font-medium text-slate-700 md:text-xl">
                                {grant.totalApproved
                                  ? new Intl.NumberFormat('en-US', {
                                      maximumFractionDigits: 0,
                                      currency: 'USD',
                                      style: 'currency',
                                    }).format(
                                      Math.round(
                                        grant?.totalApproved /
                                          grant?.totalApplications,
                                      ),
                                    )
                                  : '—'}
                              </p>
                            </div>
                            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
                              Avg. Grant Size
                            </p>
                          </div>
                        </div>
                        <div className="flex w-fit flex-col gap-4">
                          <div className="flex flex-col">
                            <div className="flex">
                              <DollarIcon />
                              <p className="text-lg font-medium text-slate-700 md:text-xl">
                                $
                                {formatNumberWithSuffix(
                                  Math.round(grant?.totalApproved || 0),
                                  1,
                                  true,
                                )}
                              </p>
                            </div>
                            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
                              Approved So Far
                            </p>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex">
                              <TimeToPayIcon />
                              <p className="text-lg font-medium text-slate-700 md:text-xl">
                                {grant?.totalApplications}
                              </p>
                            </div>
                            <p className="w-max pl-2 text-sm font-medium uppercase text-slate-500">
                              Recipients
                            </p>
                          </div>
                        </div>
                      </div>
                      <GrantApplicationButton grant={grant} />
                      <div>
                        <ExtraInfoSection
                          skills={iterableSkills}
                          region={grant.region}
                          requirements={grant.requirements}
                          pocSocials={grant.pocSocials}
                          isGrant
                        />
                      </div>
                      <div className="hidden w-full pt-8 md:block">
                        <LiveGrants
                          excludeIds={grant.id ? [grant.id] : undefined}
                        >
                          <p className="h-full text-start text-sm font-semibold text-slate-600">
                            LIVE GRANTS
                          </p>
                        </LiveGrants>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-l-1 flex w-full flex-col gap-8 border-slate-100 px-2 md:px-5">
                  {children}
                  <div className="flex flex-col items-start md:hidden">
                    <p className="h-full text-center text-sm font-semibold text-slate-600">
                      SKILLS NEEDED
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {iterableSkills?.map((skill) => (
                        <div
                          className="m-0 rounded-sm bg-[#F1F5F9] px-4 py-1 text-sm font-medium"
                          key={skill}
                        >
                          <p className="text-xs text-[#475569]">{skill}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {initialGrant?.pocSocials && (
                    <div className="flex w-full flex-col items-start text-sm md:hidden">
                      <p className="h-full text-center font-semibold text-slate-600">
                        CONTACT
                      </p>
                      <p>
                        <Link
                          className="ph-no-capture font-medium text-[#64768b]"
                          href={getURLSanitized(initialGrant.pocSocials)}
                          onClick={() => posthog.capture('reach out_listing')}
                        >
                          Reach out
                          <ExternalLink className="mx-1 mb-1 inline text-[#64768b]" />
                        </Link>
                        <span
                          className="text-slate-500"
                          color={'brand.slate.500'}
                        >
                          if you have any questions about this listing
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Default>
  );
}
