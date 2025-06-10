import { Link } from 'lucide-react';
import React from 'react';
import { GrTransaction } from 'react-icons/gr';
import { MdOutlineLock } from 'react-icons/md';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { domPurify } from '@/lib/domPurify';

const Point = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex gap-8">
      <div className="text-brand-purple mt-1">{icon}</div>
      <div>
        <p className="text-base font-medium tracking-tight text-slate-700">
          {title}
        </p>
        <p
          className="text-sm text-slate-500"
          dangerouslySetInnerHTML={{ __html: domPurify(description) }}
        />
      </div>
    </div>
  );
};

export const WalletFeature = () => {
  return (
    <>
      <ExternalImage
        src="/wallet/wallet-announcement-modal"
        alt="Wallet Announcement Illustration"
        className="w-full"
        loading="eager"
        decoding="sync"
      />

      <div className="flex flex-col items-start gap-3 p-6 pb-0">
        <p className="text-lg font-semibold">Introducing the Earn Wallet</p>
        <Point
          title="Linked to your Earn account"
          description="Receive rewards directly — no extensions, apps, or setup required. Just start contributing!"
          icon={<Link />}
        />
        <Point
          title="Transfer money out anytime"
          description="Easily transfer your funds to any wallet of your choice, whenever you need."
          icon={<GrTransaction className="h-[1.4rem] w-[1.4rem]" />}
        />
        <Point
          title="Secured by Privy"
          description="We partnered with <a href='https://privy.io' style='text-decoration: underline;' target='_blank' rel='noopener noreferrer'>Privy</a> for our wallet service. They are protected with industry-leading security and regular audits to keep your earnings safe."
          icon={<MdOutlineLock className="size-6" />}
        />
      </div>
    </>
  );
};
