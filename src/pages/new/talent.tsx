import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';

import { SignIn } from '@/features/auth/components/SignIn';
import { TalentForm } from '@/features/talent/components/onboarding-form/Form';
import { TalentImageCard } from '@/features/talent/components/onboarding-form/ImageCard';

export default function Talent() {
  const { user } = useUser();
  const { status } = useSession();
  const isMD = useBreakpoint('lg');

  const params = useSearchParams();
  const router = useRouter();

  const [loginStep, setLoginStep] = useState(0);

  useEffect(() => {
    if (status === 'authenticated' && user && user?.isTalentFilled) {
      const originUrl = params.get('originUrl');
      if (!!originUrl && typeof originUrl === 'string') {
        router.push(originUrl);
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  return (
    <Default
      meta={
        <Meta
          title="Create Your Profile to Access Bounties & Grants | Superteam Earn"
          description="Become part of Superteam's talent network, where you can present your skills and collaborate on various crypto bounties, grants, and projects."
          canonical="https://earn.superteam.fun/new/talent/"
        />
      }
    >
      {status === 'unauthenticated' ? (
        <div className="min-h-screen w-full bg-white">
          <div className="mx-auto flex min-h-[60vh] max-w-[32rem] flex-col items-center justify-center">
            <p className="pt-4 text-center text-2xl font-semibold text-slate-900">
              You&apos;re one step away
            </p>
            <p className="pb-4 text-center text-xl font-normal text-slate-600">
              from joining Superteam Earn
            </p>
            <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full grid-cols-1 grid-rows-1 lg:grid-cols-2">
          <div className="mx-4 lg:ml-24 lg:mr-12">
            <TalentForm />
          </div>
          {isMD && <TalentImageCard />}
        </div>
      )}
    </Default>
  );
}
