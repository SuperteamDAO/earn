import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Info, Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { KYB_LINK, KYC_LINK, KYC_SPONSOR_WHITELIST } from '@/constants/kyc';
import { cn } from '@/utils/cn';

import {
  checkKycQuery,
  type KycResponse,
} from '@/features/listings/queries/check-kyc';

import { VerifiedBadge } from '../shared/VerifiedBadge';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Tooltip } from './tooltip';

interface KycComponentProps {
  address: string | undefined;
  imageOnly?: boolean;
  variant?: 'default' | 'xs' | 'extended';
  listingSponsorId?: string;
}

function styleKycStatus(kycData?: KycResponse) {
  if (!kycData)
    return {
      className: 'text-gray-500',
      text: 'KYC / KYB Status loading...',
      image: <Loader className="h-4 w-4 animate-spin" />,
      shouldShowLink: false,
    };
  switch (kycData.kyc_status) {
    case 'APPROVED':
      return {
        className: 'text-green-600',
        text: 'KYC / KYB Verified',
        image: <VerifiedBadge className={cn('fill-green-600')} />,
        shouldShowLink: false,
      };
    case 'PENDING':
      return {
        className: 'text-yellow-500',
        text: 'KYC / KYB Verification in Progress',
        image: (
          <Image
            src="/assets/kyc-verify-in-progress.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-4 w-4 fill-yellow-500'}
          />
        ),
        shouldShowLink: false,
      };
    case 'NOT_SUBMITTED':
      return {
        className: 'text-red-500',
        text: 'KYC / KYB Not Verified',
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-4 w-4 fill-red-500'}
          />
        ),
        shouldShowLink: true,
      };
    case 'REJECTED':
      return {
        className: 'text-red-500',
        text: 'KYC / KYB Verification Rejected',
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-4 w-4 fill-red-500'}
          />
        ),
        shouldShowLink: true,
      };
    case 'EXPIRED':
      return {
        className: 'text-gray-500',
        text: 'KYC / KYB Verification Expired',
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-4 w-4 fill-gray-500'}
          />
        ),
        shouldShowLink: true,
      };
    default:
      return {
        className: 'text-gray-500',
        text: 'Unknown KYC / KYB status',
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-4 w-4 fill-gray-500'}
          />
        ),
        shouldShowLink: true,
      };
  }
}

export function KycComponent({
  address,
  imageOnly = false,
  variant = 'default',
  listingSponsorId,
}: KycComponentProps) {
  const isKycEnabled =
    !!listingSponsorId && KYC_SPONSOR_WHITELIST.includes(listingSponsorId);

  const { data: kycData } = useQuery({
    enabled: !!address && isKycEnabled,
    ...checkKycQuery(address!),
  });

  if (!isKycEnabled) {
    return null;
  }

  const { className, text, image, shouldShowLink } = styleKycStatus(kycData);

  if (variant === 'extended') {
    const tooltipText =
      kycData?.kyc_status === 'APPROVED'
        ? "Your identity has been successfully verified. This helps keep your account secure, builds trust with others, and ensures you're fully compliant with legal requirements"
        : 'To keep your account secure and meet legal requirements, we need to verify your identity (KYC) or your business (KYB). This helps prevent fraud, ensures trust between users.';
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-1 text-[0.85rem] font-medium text-slate-600 sm:text-[0.9rem]">
            Recipient Verification Status
            <Tooltip
              contentProps={{ className: 'z-[10000]' }}
              content={tooltipText}
            >
              <Info className="h-4 w-4" />
            </Tooltip>
          </h1>
          <div className="flex items-center justify-between gap-2">
            <div className={cn('flex items-center gap-2', className)}>
              {image}
              <p className={cn('text-sm font-medium')}>{text}</p>
            </div>
          </div>
        </div>
        {shouldShowLink && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex h-7 items-center gap-2 px-2 py-1 text-slate-500"
              >
                Get Verified
                <ExternalLink className="my-auto h-4 w-4" strokeWidth={2} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" className="w-[350px] p-2">
              <div className="w-full rounded-md px-4 py-2 hover:bg-slate-100">
                <Link
                  href={KYC_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-sm text-slate-500"
                >
                  <p className="font-medium">KYC Verification</p>
                  <p className="text-xs text-slate-500">
                    Choose this if you are an individual
                  </p>
                </Link>
              </div>
              <div className="w-full rounded-md px-4 py-2 hover:bg-slate-100">
                <Link
                  href={KYB_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-sm text-slate-500"
                >
                  <p className="font-medium text-slate-500">KYB Verification</p>
                  <p className="text-xs text-slate-500">
                    Choose this if you are a business or corporate entity
                  </p>
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  const content = imageOnly ? (
    image
  ) : (
    <>
      {image}
      <p className={cn('text-sm font-medium', variant === 'xs' && 'text-xs')}>
        {text}
      </p>
    </>
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>{content}</div>
  );
}
