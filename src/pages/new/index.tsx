import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { MdCheck } from 'react-icons/md';

import { SponsorButton } from '@/components/ProfileSetup/SponsorButton';
import { TalentButton } from '@/components/ProfileSetup/TalentButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Separator } from '@/components/ui/separator';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { userCountQuery } from '@/features/home/queries/user-count';
import { ONBOARDING_KEY } from '@/features/talent/constants';

export default function NewProfilePage({
  showTalentProfile,
}: {
  showTalentProfile: boolean;
}) {
  const avatars = [
    { name: 'Abhishek', src: ASSET_URL + '/pfps/t1.webp' },
    { name: 'Pratik', src: ASSET_URL + '/pfps/md2.webp' },
    { name: 'Yash', src: ASSET_URL + '/pfps/fff1.webp' },
  ];

  const { data: totals } = useQuery(userCountQuery);

  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();
  const [isTalentLoading, setIsTalentLoading] = useState(false);
  const [isSponsorLoading, setIsSponsorLoading] = useState(false);

  const checkTalent = async () => {
    console.log('check talent called');
    localStorage.setItem(ONBOARDING_KEY, 'talent');
    console.log('local storage set', localStorage.getItem(ONBOARDING_KEY));
    if (!user) return;
    try {
      // localStorage.removeItem(ONBOARDING_KEY);
      if (!user?.isTalentFilled) {
        const originUrl = params?.get('originUrl');
        const type = params?.get('type');
        const query: Record<string, string> = {};
        if (originUrl) query['originUrl'] = originUrl;
        if (type) query['type'] = type;
        router.push({
          pathname: '/new/talent',
          query,
        });
      } else {
        router.push(`/t/${user.username}`);
      }
    } catch (error) {
      setIsTalentLoading(false);
    }
  };

  const checkSponsor = async () => {
    localStorage.setItem(ONBOARDING_KEY, 'sponsor');
    if (!user) return;
    try {
      // localStorage.removeItem(ONBOARDING_KEY);
      const sponsors = await api.get('/api/user-sponsors');
      if (sponsors?.data?.length && user.currentSponsorId) {
        router.push('/dashboard/listings?open=1');
      } else {
        const originUrl = params?.get('originUrl');
        router.push({
          pathname: '/new/sponsor',
          query: originUrl ? { originUrl } : undefined,
        });
      }
    } catch (error) {
      setIsSponsorLoading(false);
    }
  };

  useEffect(() => {
    if (router.query['loginState'] === 'signedIn') {
      const onboardingStep = localStorage.getItem(ONBOARDING_KEY);
      if (onboardingStep) {
        if (onboardingStep === 'talent') {
          setIsTalentLoading(true);
          checkTalent();
        } else if (onboardingStep === 'sponsor') {
          setIsSponsorLoading(true);
          checkSponsor();
        }
      }
    }
  }, [router, user]);

  return (
    <Default
      meta={
        <Meta
          title="Make Your Profile | Earn on ${PROJECT_NAME} | Connect with Crypto Talent"
          description="Join ${PROJECT_NAME} to engage with top talent and discover bounties and grants for your crypto projects."
          canonical={`${getURL()}/new/`}
        />
      }
    >
      <div className="relative mx-auto mt-6 flex max-w-[52rem] items-center md:mt-0 md:h-[calc(100vh-3.5rem)]">
        <div className="static top-0 mb-10 flex flex-col gap-16 px-4 md:relative md:flex-row md:gap-8 lg:px-0 lg:py-0">
          {showTalentProfile && (
            <div className="flex w-full flex-col gap-9">
              <div className="flex flex-col gap-1.5">
                <p className="text-2xl font-semibold text-slate-900">
                  Continue as Talent
                </p>
                <p className="text-lg leading-5 tracking-[-0.2px] text-slate-500">
                  Create a profile to start submitting, and get notified on new
                  work opportunities
                </p>
              </div>

              <AuthWrapper className="w-full" onClick={checkTalent}>
                <div
                  className="flex w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-md bg-white"
                  onClick={checkTalent}
                >
                  <div className="relative flex w-full items-center justify-center">
                    <ExternalImage
                      style={{ width: '100%' }}
                      alt={'user icon'}
                      src={'/onboarding/talent-banner.webp'}
                    />
                    <div className="absolute left-0 top-0 h-full w-full bg-violet-400 mix-blend-overlay" />
                  </div>
                  <div className="flex flex-col gap-5 px-4">
                    <BulletPoint type="TALENT">
                      Contribute to top Solana projects
                    </BulletPoint>
                    <BulletPoint type="TALENT">
                      Build your web3 resume
                    </BulletPoint>
                    <BulletPoint type="TALENT">Get paid in crypto</BulletPoint>
                  </div>
                  <Separator className="text-slate-300" />
                  <div className="px-4 pb-1">
                    <TalentButton
                      showMessage={false}
                      isLoading={isTalentLoading}
                      checkTalent={checkTalent}
                    />
                  </div>
                </div>
              </AuthWrapper>
              <div className="mx-auto -mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {avatars.slice(0, 3).map((avatar, index) => (
                    <Avatar className="relative h-6 w-6 border-0" key={index}>
                      <AvatarImage src={avatar.src} alt={avatar.name} />
                      <AvatarFallback>{avatar.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {avatars.length > 3 && (
                    <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-600">
                      +{avatars.length - 3}
                    </div>
                  )}
                </div>
                {totals?.totalUsers !== null && (
                  <p className="relative text-sm text-slate-500">
                    Join {totals?.totalUsers?.toLocaleString('en-us')}+ others
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex w-full flex-col gap-9">
            <div className="flex flex-col gap-1.5">
              <p className="text-2xl font-semibold text-slate-900">
                Continue as a Sponsor
              </p>
              <p className="text-lg leading-5 tracking-[-0.2px] text-slate-500">
                List a bounty or freelance gig for your project and find your
                next contributor
              </p>
            </div>
            <AuthWrapper className="w-full" onClick={checkSponsor}>
              <div
                className="flex w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-md bg-white"
                onClick={checkSponsor}
              >
                <div className="relative flex w-full items-center justify-center">
                  <ExternalImage
                    style={{ width: '100%' }}
                    alt={'user icon'}
                    src={'/onboarding/sponsor-banner.webp'}
                  />
                  <div className="absolute left-0 top-0 h-full w-full bg-emerald-50 mix-blend-overlay" />
                </div>
                <div className="flex flex-col gap-5 px-4">
                  <BulletPoint type="SPONSOR">
                    Get in front of 10,000 weekly visitors
                  </BulletPoint>
                  <BulletPoint type="SPONSOR">
                    20+ templates to choose from
                  </BulletPoint>
                  <BulletPoint type="SPONSOR">100% free</BulletPoint>
                </div>
                <Separator className="text-slate-300" />
                <div className="px-4 pb-1">
                  <SponsorButton
                    isLoading={isSponsorLoading}
                    showMessage={false}
                    checkSponsor={checkSponsor}
                  />
                </div>
              </div>
            </AuthWrapper>
            <div className="-mt-3 flex items-center justify-between gap-3 px-3">
              <ExternalImage
                className="h-5 object-contain"
                alt="Jupiter Icon"
                src={'/landingsponsor/sponsors/jupiter.webp'}
              />
              <ExternalImage
                className="h-8 object-contain"
                alt="Solflare Icon"
                src={'/landingsponsor/sponsors/solflare.webp'}
              />
              <ExternalImage
                className="hidden h-4 object-contain md:block"
                alt="Squads Icon"
                src={'/company-logos/squads.webp'}
              />
              <ExternalImage
                className="h-7 w-7 object-contain"
                alt="Tensor Icon"
                src={'/company-logos/tensor.svg'}
              />
            </div>
          </div>
        </div>
      </div>
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, query } = context;
  let showTalentProfile = true;

  try {
    const response = await api.get(`${getURL()}api/user`, {
      headers: {
        Cookie: req.headers.cookie,
      },
    });

    const { isTalentFilled } = response.data;
    showTalentProfile = isTalentFilled === false;

    if (query.onboarding === 'true' && isTalentFilled) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }

  return {
    props: {
      showTalentProfile,
    },
  };
};

const TickIcon = ({ type }: { type: 'TALENT' | 'SPONSOR' }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full p-[3px]',
        type === 'TALENT' ? 'bg-indigo-50' : 'bg-emerald-50',
      )}
    >
      <MdCheck
        className={cn(
          'h-[0.8rem] w-[0.8rem]',
          type === 'TALENT' ? 'text-indigo-600' : 'text-emerald-600',
        )}
      />
    </div>
  );
};

const BulletPoint = ({
  type,
  children,
}: {
  type: 'TALENT' | 'SPONSOR';
  children: React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-4">
      <TickIcon type={type} />
      <p className="font-normal text-slate-500">{children}</p>
    </div>
  );
};
