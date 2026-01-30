import Link from 'next/link';

import PrimaryButton from './PrimaryButton';

export default function MenuButtons() {
  return (
    <div className="flex items-center gap-6">
      <Link
        href="/earn/grants"
        target="_blank"
        rel="noopener noreferrer"
        className="font-secondary text-[14px] font-bold text-white"
      >
        Instagrants
      </Link>
      <PrimaryButton
        className="bg-white"
        href="/earn"
        target="_blank"
        rel="noopener noreferrer"
      >
        Earn Your Crypto
      </PrimaryButton>
    </div>
  );
}
