import { useMutation } from '@tanstack/react-query';
import {
  ChevronLeft,
  Download,
  ExternalLink,
  MoreVertical,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { toast } from 'sonner';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { type Listing } from '@/features/listings/types';
import { isDeadlineOver } from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';

interface Props {
  bounty: Listing | undefined;
  isHackathonPage?: boolean;
}

export const SubmissionHeader = ({
  bounty,
  isHackathonPage = false,
}: Props) => {
  const router = useRouter();
  const { user } = useUser();

  const listingPath = `listing/${bounty?.slug}`;

  const bountyStatus = getListingStatus(bounty);

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
    onSuccess: async (data) => {
      const url = data?.url || '';
      if (url) {
        try {
          const response = await fetch(url, {
            headers: {
              Accept: 'text/csv,application/octet-stream',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const blob = await response.blob();

          const blobUrl = window.URL.createObjectURL(
            new Blob([blob], { type: 'text/csv' }),
          );

          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', `${bounty?.slug || 'submissions'}.csv`);

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(blobUrl);

          toast.success('CSV exported successfully');
        } catch (error) {
          console.error('Download error:', error);
          toast.error('Failed to download CSV. Please try again.');
        }
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
      <div className="mb-4">
        <Breadcrumb className="text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={
                    isHackathonPage
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
      <div className="mb-2 flex items-center gap-2">
        <div className="ml-1 flex items-center gap-2">
          {getListingIcon(bounty?.type!, 'size-5')}
          <p className="text-xl font-bold text-slate-800">{bounty?.title}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer rounded-md p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-500">
              <MoreVertical className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!isHackathonPage && (
              <DropdownMenuItem
                disabled={exportMutation.isPending}
                onClick={() => exportSubmissionsCsv()}
                className="cursor-pointer"
              >
                {exportMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() =>
                window.open(`${router.basePath}/${listingPath}`, '_blank')
              }
              className="cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Listing
            </DropdownMenuItem>

            {!!(
              (user?.role === 'GOD' && bounty?.type !== 'grant') ||
              (bounty?.isPublished && !pastDeadline && bounty.type !== 'grant')
            ) &&
              !isHackathonPage && (
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link
                    href={
                      bounty
                        ? `/dashboard/${isHackathonPage ? 'hackathon' : 'listings'}/${bounty.slug}/edit/`
                        : ''
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
        <p
          className={cn(
            'ml-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap',
            getColorStyles(bountyStatus).color,
            getColorStyles(bountyStatus).bgColor,
          )}
        >
          {bountyStatus}
        </p>
      </div>
    </>
  );
};
