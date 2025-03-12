import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import Image from 'next/image';

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
}

function styleKycStatus(kycData?: KycResponse) {
  if (!kycData)
    return {
      style: 'bg-gray-500',
      text: 'KYC / KYB status loading...',
      image: <Loader className="h-3 w-3 animate-spin" />,
    };
  switch (kycData.kyc_status) {
    case 'APPROVED':
      return {
        className: 'text-green-600',
        text: 'KYC / KYB Verified by Fractal',
        image: <VerifiedBadge className={cn('fill-green-600')} />,
      };
    case 'PENDING':
      return {
        className: 'text-yellow-500',
        text: 'KYC / KYB Verification in Progress',
        image: (
          <Image
            src="/assets/kyc-failed.svg"
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
        text: 'KYC / KYB Verification Not Started',
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
        text: 'KYC / KYB Verification Rejected',
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
        text: 'KYC / KYB Verification Expired',
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
        text: 'Unknown KYC / KYB status',
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
}: KycComponentProps) {
  const { data: kycData } = useQuery({
    enabled: !!address,
    ...checkKycQuery(address!),
  });

  const { className, text, image } = styleKycStatus(kycData);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {image}
      {!imageOnly && (
        <p className={cn('text-sm font-medium', xs && 'text-xs')}>{text}</p>
      )}
    </div>
  );
}
