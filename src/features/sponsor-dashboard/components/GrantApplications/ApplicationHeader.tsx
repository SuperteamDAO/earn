import { useMutation } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  Copy,
  Download,
  ExternalLink,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import router from 'next/router';
import React from 'react';
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
import { getURL } from '@/utils/validUrl';

import { type Grant } from '@/features/grants/types';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingStatus } from '@/features/listings/utils/status';

import { SponsorPrize } from '../SponsorPrize';

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
}

interface Props {
  grant: GrantWithApplicationCount | undefined;
}

export const ApplicationHeader = ({ grant }: Props) => {
  const listingPath = `grants/${grant?.slug}`;
  const { hasCopied, onCopy } = useClipboard(`${getURL()}${listingPath}`);
  const grantStatus = getListingStatus(grant, true);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/api/sponsor-dashboard/application/export/`,
        {
          params: { grantId: grant?.id },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      window.open(url, '_blank');
      toast.success('CSV exported successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <>
      <div className="mb-2">
        <Breadcrumb className="text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/listings" className="flex items-center">
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
          <img className="h-6" alt="" src={`/assets/grant-icon.svg`} />
          <p className="text-slate text-xl font-bold">{grant?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="text-slate-400 hover:bg-indigo-100 hover:text-brand-purple"
            disabled={exportMutation.isPending}
            onClick={handleExport}
            variant="ghost"
          >
            {exportMutation.isPending ? (
              <>
                <span className="loading loading-spinner" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
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
            <ExternalLink className="mr-2 h-4 w-4" />
            View Grant
          </Button>
        </div>
      </div>
      <Separator />
      <div className="mb-8 mt-4 flex items-center gap-12">
        <div>
          <p className="text-slate-500">Applications</p>
          <p className="mt-3 font-semibold text-slate-600">
            {grant?.totalApplications}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Deadline</p>
          <p className="mt-3 whitespace-nowrap font-semibold text-slate-600">
            Rolling
          </p>
        </div>
        <div>
          <p className="text-slate-500">Status</p>
          <p
            className={cn(
              'mt-3 inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium',
              getColorStyles(grantStatus).color,
              getColorStyles(grantStatus).bgColor,
            )}
          >
            {grantStatus}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Grant Size</p>
          <div className="mt-3 flex items-center justify-start gap-1">
            <img
              className="h-5 w-5 rounded-full"
              alt={'green dollar'}
              src={
                tokenList.filter((e) => e?.tokenSymbol === grant?.token)[0]
                  ?.icon ?? '/assets/dollar.svg'
              }
            />
            <SponsorPrize
              compensationType={'range'}
              maxRewardAsk={grant?.maxReward}
              minRewardAsk={grant?.minReward ?? 0}
              className="font-semibold text-slate-700"
            />
            <p className="font-semibold text-slate-400">{grant?.token}</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Share</p>
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
        </div>
      </div>
    </>
  );
};
