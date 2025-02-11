import { Link } from 'lucide-react';
import React from 'react';
import { GrTransaction } from 'react-icons/gr';
import { MdOutlineLock } from 'react-icons/md';

import { Button } from '../ui/button';
import { ExternalImage } from '../ui/cloudinary-image';

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
      <div className="mt-1 text-brand-purple">{icon}</div>
      <div>
        <p className="text-base font-medium tracking-tight text-slate-700">
          {title}
        </p>
        <p
          className="text-sm text-slate-500"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>
    </div>
  );
};

export const WalletFeature = ({ onClick }: { onClick: () => void }) => {
  return (
    <>
      <div className="p-8">
        <ExternalImage
          src="/wallet/modal-wallet.webp"
          alt="Scouts Announcement Illustration"
          className="mx-auto w-1/3"
        />
      </div>

      <div className="flex flex-col items-start gap-3 p-6">
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
      <div className="px-6">
        <Button onClick={onClick} className="mb-6 w-full">
          Understood
        </Button>
      </div>
    </>
  );
};
