import { useMutation } from '@tanstack/react-query';
import {
  ChevronLeft,
  CopyIcon,
  Download,
  ExternalLink,
  MoreVertical,
  Sheet,
} from 'lucide-react';
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
import { StatusPill } from '@/components/ui/status-pill';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { type Grant } from '@/features/grants/types';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';
import { ExportSheetsModal } from '@/features/sponsor-dashboard/components/Modals/ExportSheetsModal';

import { type GrantApplicationWithUser } from '../../types';
import AiReviewModal from './Modals/AiReview';

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
}

interface Props {
  grant: GrantWithApplicationCount | undefined;
  applications: GrantApplicationWithUser[] | undefined;
  showAiReview?: boolean;
}

export const ApplicationHeader = ({
  grant,
  applications,
  showAiReview = true,
}: Props) => {
  const listingPath = `grants/${grant?.slug}`;
  const grantStatus = getListingStatus(grant, true);
  const router = useRouter();

  const {
    isOpen: exportSheetsIsOpen,
    onOpen: exportSheetsOnOpen,
    onClose: exportSheetsOnClose,
  } = useDisclosure();

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
          link.setAttribute('download', `${grant?.slug || 'applications'}.csv`);

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
      console.error(error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Link Copied', {
          duration: 3000,
        });
      },
      (err) => {
        console.error('Failed to copy text: ', err);
      },
    );
  };

  const getGrantUrl = () => {
    return `${getURL()}grants/${grant?.slug}`;
  };

  return (
    <div className="mb-2 flex items-center justify-between">
      <button className="sr-only" />
      <div>
        <Breadcrumb className="text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => router.back()}
                className="flex cursor-pointer items-center gap-2"
              >
                <ChevronLeft className="size-6" />
                All Listings
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-2 flex items-center gap-2">
          <div className="ml-1 flex items-center gap-2">
            {getListingIcon('grant', 'size-5')}
            <p className="text-xl font-bold text-slate-800">{grant?.title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer rounded-md p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-500">
                <MoreVertical className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-slate-500">
              <DropdownMenuItem
                disabled={exportMutation.isPending}
                onClick={() => handleExport()}
                className="cursor-pointer"
              >
                {exportMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Export CSV
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={exportSheetsOnOpen}
                className="cursor-pointer"
              >
                <Sheet className="size-4" />
                Export to Google Sheets
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  window.open(`${router.basePath}/${listingPath}`, '_blank')
                }
                className="cursor-pointer"
              >
                <ExternalLink className="size-4" />
                View Listing
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => copyToClipboard(getGrantUrl())}
                className="cursor-pointer"
              >
                <CopyIcon className="size-4" />
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <StatusPill
            className="ml-2 w-fit text-[0.8rem]"
            color={getColorStyles(grantStatus).color}
            backgroundColor={getColorStyles(grantStatus).bgColor}
            borderColor={getColorStyles(grantStatus).borderColor}
          >
            {grantStatus}
          </StatusPill>
        </div>
      </div>
      {showAiReview && (
        <div>
          <AiReviewModal applications={applications} grant={grant} />
        </div>
      )}

      <ExportSheetsModal
        isOpen={exportSheetsIsOpen}
        onClose={exportSheetsOnClose}
        apiEndpoint="/api/sponsor-dashboard/application/export-sheets/"
        queryParams={{ grantId: grant?.id }}
        entityName="applications"
      />
    </div>
  );
};
