import { useMutation } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'sonner';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { tokenList } from '@/constants/tokenList';
import { useClipboard } from '@/hooks/use-clipboard';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';
import { tweetEmbedLink } from '@/utils/socialEmbeds';
import { getURL } from '@/utils/validUrl';

import { type Listing } from '@/features/listings/types';
import {
  formatDeadline,
  isDeadlineOver,
} from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';

import { SponsorPrize } from '../SponsorPrize';

interface Props {
  bounty: Listing | undefined;
  totalSubmissions: number;
  isHackathonPage?: boolean;
}

export const SubmissionHeader = ({
  bounty,
  totalSubmissions,
  isHackathonPage = false,
}: Props) => {
  const { data: session } = useSession();
  const router = useRouter();

  const deadline = formatDeadline(bounty?.deadline, bounty?.type);

  const listingPath = `listings/${bounty?.type}/${bounty?.slug}`;
  const { hasCopied, onCopy } = useClipboard(`${getURL()}${listingPath}`);

  const bountyStatus = getListingStatus(bounty);

  const listingLink =
    bounty?.type === 'grant'
      ? `${getURL()}grants/${bounty.slug}/`
      : `${getURL()}listings/${bounty?.type}/${bounty?.slug}/`;

  const socialListingLink = (medium?: 'twitter' | 'telegram') =>
    `${listingLink}${medium ? `?utm_source=superteamearn&utm_medium=${medium}&utm_campaign=sharelisting/` : ``}`;

  const tweetShareContent = `Check out my newly added @SuperteamEarn opportunity!

${socialListingLink('twitter')}
`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/api/sponsor-dashboard/submission/export/`,
        {
          params: {
            listingId: bounty?.id,
          },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      if (url) {
        window.open(url, '_blank');
        toast.success('CSV exported successfully');
      } else {
        toast.error('Export URL is empty');
      }
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const exportSubmissionsCsv = () => {
    exportMutation.mutate();
  };

  const pastDeadline = isDeadlineOver(bounty?.deadline);

  return (
    <>
      <div className="mb-2">
        <Breadcrumb className="text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={
                    bounty?.type === 'hackathon'
                      ? `/dashboard/hackathon/`
                      : '/dashboard/listings'
                  }
                  className="flex items-center"
                >
                  <ChevronLeft className="mr-1 h-6 w-6" />
                  All Listings
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img className="h-6" alt="" src={getListingIcon(bounty?.type!)} />
          <p className="text-xl font-bold text-slate-800">{bounty?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="text-slate-400 hover:bg-indigo-100 hover:text-brand-purple"
            disabled={exportMutation.isPending}
            onClick={() => exportSubmissionsCsv()}
            variant="ghost"
          >
            {exportMutation.isPending ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>

          <Button
            className="text-slate-400 hover:bg-indigo-100 hover:text-brand-purple"
            onClick={() =>
              window.open(`${router.basePath}/${listingPath}`, '_blank')
            }
            variant="ghost"
          >
            <ExternalLink className="h-4 w-4" />
            View Listing
          </Button>
          {!!(
            (session?.user?.role === 'GOD' && bounty?.type !== 'grant') ||
            (bounty?.isPublished && !pastDeadline && bounty.type !== 'grant')
          ) && (
            <Link
              className="hover:no-underline"
              href={
                bounty
                  ? `/dashboard/${isHackathonPage ? 'hackathon' : 'listings'}/${bounty.slug}/edit/`
                  : ''
              }
            >
              <Button
                variant="ghost"
                className="text-slate-400 hover:bg-indigo-100 hover:text-brand-purple"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>
      <Separator />
      <div className="mb-8 mt-4 flex items-center gap-12">
        <div>
          <p className="text-slate-500">Submissions</p>
          <p className="mt-3 font-semibold text-slate-600">
            {totalSubmissions}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Deadline</p>
          <p className="mt-3 whitespace-nowrap font-semibold text-slate-600">
            {deadline}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Status</p>
          <p
            className={cn(
              'mt-3 inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium',
              getColorStyles(bountyStatus).color,
              getColorStyles(bountyStatus).bgColor,
            )}
          >
            {bountyStatus}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Prize</p>
          <div className="mt-3 flex items-center justify-start gap-1">
            <img
              className="h-5 w-5 rounded-full"
              alt={'green dollar'}
              src={
                tokenList.filter((e) => e?.tokenSymbol === bounty?.token)[0]
                  ?.icon ?? '/assets/dollar.svg'
              }
            />
            <SponsorPrize
              compensationType={bounty?.compensationType}
              maxRewardAsk={bounty?.maxRewardAsk}
              minRewardAsk={bounty?.minRewardAsk}
              rewardAmount={bounty?.rewardAmount}
              className="font-semibold text-slate-700"
            />
            <p className="font-semibold text-slate-400">{bounty?.token}</p>
          </div>
        </div>
        <div className="ml-auto">
          <p className="text-slate-500">Share</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative border-slate-100 bg-slate-50">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Link2 className="h-4 w-4 text-slate-400" />
              </div>

              <Input
                className="w-80 overflow-hidden text-ellipsis whitespace-nowrap border-slate-100 pl-10 pr-10 text-slate-500 focus-visible:ring-[#CFD2D7] focus-visible:ring-offset-0"
                readOnly
                value={`${getURL()}${listingPath}`}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {hasCopied ? (
                  <Check className="h-4 w-4 text-slate-400" />
                ) : (
                  <Copy
                    className="h-5 w-5 cursor-pointer text-slate-400"
                    onClick={onCopy}
                  />
                )}
              </div>
            </div>
            <Link
              className="flex h-fit w-fit items-center gap-1 rounded-full bg-slate-500 p-1.5 text-white hover:bg-slate-400"
              href={twitterShareLink}
              target="_blank"
            >
              <FaXTwitter style={{ width: '0.9rem', height: '0.8rem' }} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
