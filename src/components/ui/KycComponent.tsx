import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { KYB_LINK, KYC_LINK, KYC_SPONSOR_WHITELIST } from '@/constants/kyc';
import { cn } from '@/utils/cn';

import {
  checkKycQuery,
  type KycResponse,
} from '@/features/listings/queries/check-kyc';

import { VerifiedBadge } from '../shared/VerifiedBadge';

interface KycComponentProps {
  address: string | undefined;
  imageOnly?: boolean;
  xs?: boolean;
  listingSponsorId?: string;
}

function KycKybLink() {
  return (
    <>
      <Link
        href={KYC_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="italic hover:underline"
      >
        KYC
      </Link>{' '}
      /{' '}
      <Link
        href={KYB_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="italic hover:underline"
      >
        KYB
      </Link>
    </>
  );
}

function styleKycStatus(kycData?: KycResponse) {
  if (!kycData)
    return {
      className: 'text-gray-500',
      text: 'KYC / KYB Status loading...',
      image: <Loader className="h-3 w-3 animate-spin" />,
    };
  switch (kycData.kyc_status) {
    case 'APPROVED':
      return {
        className: 'text-green-600',
        text: 'KYC / KYB Verified',
        image: <VerifiedBadge className={cn('fill-green-600')} />,
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
            className={'h-3 w-3 fill-yellow-500'}
          />
        ),
      };
    case 'NOT_SUBMITTED':
      return {
        className: 'text-red-500',
        text: (
          <>
            <KycKybLink /> Not Verified
          </>
        ),
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-3 w-3 fill-red-500'}
          />
        ),
      };
    case 'REJECTED':
      return {
        className: 'text-red-500',
        text: (
          <>
            <KycKybLink /> Verification Rejected
          </>
        ),
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-3 w-3 fill-red-500'}
          />
        ),
      };
    case 'EXPIRED':
      return {
        className: 'text-gray-500',
        text: (
          <>
            <KycKybLink /> Verification Expired
          </>
        ),
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-3 w-3 fill-gray-500'}
          />
        ),
      };
    default:
      return {
        className: 'text-gray-500',
        text: (
          <>
            Unknown <KycKybLink /> status
          </>
        ),
        image: (
          <Image
            src="/assets/kyc-failed.svg"
            alt="KYC / KYB status"
            width={0}
            height={0}
            className={'h-3 w-3 fill-gray-500'}
          />
        ),
      };
  }
}

export function KycComponent({
  address,
  imageOnly = false,
  xs = false,
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

  const { className, text, image } = styleKycStatus(kycData);

  const content = imageOnly ? (
    image
  ) : (
    <>
      {image}
      <p className={cn('text-sm font-medium', xs && 'text-xs')}>{text}</p>
    </>
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>{content}</div>
  );
}
