import Link from 'next/link';

import PrimaryButton from './PrimaryButton';

export default function MenuButtons() {
  return (
    <div className="flex items-center gap-6">
      <Link
        href="/member-perks"
        className="font-secondary text-[14px] font-bold text-white"
      >
        Member Perks
      </Link>
      <PrimaryButton className="bg-white" href="/collaborate">
        Collab with us
      </PrimaryButton>
    </div>
  );
}
