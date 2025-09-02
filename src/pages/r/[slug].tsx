import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';

import { Login } from '@/features/auth/components/Login';
import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { userCountQuery } from '@/features/home/queries/user-count';
import { liveOpportunitiesQuery } from '@/features/listings/queries/live-opportunities';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface VerifyResponse {
  valid: boolean;
  remaining?: number;
  inviter?: { id: string; name: string; photo?: string | null };
  reason?: string;
}

const avatars = [
  { name: 'Abhishek', src: '/pfps/t1.webp' },
  { name: 'Pratik', src: '/pfps/md2.webp' },
  { name: 'Yash', src: '/pfps/fff1.webp' },
];

interface ReferralLandingProps {
  redirectReason?: 'self_referral' | 'existing_user' | null;
}

export default function ReferralLandingPage({
  redirectReason,
}: ReferralLandingProps) {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const code = useMemo(() => {
    const slug = router.query.slug as string;
    return slug ? slug.trim().toUpperCase() : '';
  }, [router.query.slug]);

  const { data, isLoading } = useQuery<VerifyResponse>({
    queryKey: ['referral.verify', code],
    queryFn: async () => {
      if (!code) return { valid: false, reason: 'MISSING_CODE' };
      const res = await api.get<VerifyResponse>('/api/user/referral/verify', {
        params: { code },
      });
      return res.data;
    },
    enabled: !!code && !redirectReason,
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!isLoading && data) {
      if (data.reason === 'INVALID') {
        toast.error(
          'Referral code is invalid. You will be redirected to the profile creation page in 5 seconds.',
          { duration: 4800, id: 'referral-invalid-link' },
        );
        timeout = setTimeout(
          () => router.push('/new/talent?onboarding=true&referral=true'),
          5000,
        );
      } else if (data.inviter && data.remaining === 0) {
        toast.error(
          'This invitation link has expired. You will be redirected to the profile creation page in 5 seconds.',
          { duration: 4800, id: 'referral-expired-link' },
        );
        timeout = setTimeout(
          () => router.push('/new/talent?onboarding=true&referral=true'),
          5000,
        );
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [data, isLoading, router]);

  const handleAccept = () => {
    if (!code) return;
    if (!authenticated) {
      setIsLoginOpen(true);
      return;
    }
    router.push('/new/talent?onboarding=true&referral=true');
  };

  function RedirectToast({
    reason,
  }: {
    reason: 'self_referral' | 'existing_user';
  }) {
    useEffect(() => {
      const show = () => {
        if (reason === 'self_referral') {
          toast.warning('You cannot refer yourself.', {
            id: 'toast-self-ref',
            duration: 10000,
          });
        } else if (reason === 'existing_user') {
          toast.warning(
            'This referral is invalid since you have signed up on Earn before with this email ID.',
            {
              id: 'referral-invalid-existing-user',
              duration: 10000,
            },
          );
        }
      };
      const t1 = setTimeout(show, 50);
      const t2 = setTimeout(() => router.replace('/'), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [reason, router]);
    return null;
  }

  const { data: liveOpportunities } = useQuery({
    ...liveOpportunitiesQuery,
  });

  const { data: totalUsers } = useQuery(userCountQuery);

  const headline = useMemo(() => {
    if (isLoading) return 'Loading…';
    if (!data) return '';
    if (data.valid)
      return `${data.inviter?.name ?? 'A Superteamer'} has invited you to Superteam Earn`;
    if (data.reason === 'INVALID')
      return 'This invite link is invalid or expired';
    if (data.reason === 'MISSING_CODE') return 'Missing referral code';
    return 'Something went wrong';
  }, [data, isLoading]);

  const Tick = () => (
    <div className="rounded-full bg-emerald-50 p-2">
      <Check className="mt-0.5 h-5 w-5 text-emerald-500" />
    </div>
  );

  if (redirectReason)
    return (
      <>
        <RedirectToast reason={redirectReason} />
        <div className="flex h-screen w-full items-center justify-center"></div>
      </>
    );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center pt-12 pb-36">
      <div className="w-full px-6 sm:px-12">
        <div className="flex flex-col items-center">
          {data?.inviter && (
            <EarnAvatar
              className="size-16"
              id={data.inviter.id}
              avatar={data.inviter.photo ?? undefined}
            />
          )}
          <h1 className="mt-3 text-center text-xl font-semibold text-slate-600 sm:text-2xl">
            {headline}
          </h1>

          {data?.valid && (
            <div className="mt-6 w-full max-w-xl rounded-lg border border-slate-100 bg-white px-6 py-8 shadow-lg">
              <ul className="space-y-8">
                <li className="flex items-start gap-5 text-sm text-slate-500 sm:text-base">
                  <Tick />
                  <div>
                    Participate in bounties or gigs from the world&apos;s best
                    crypto companies
                  </div>
                </li>
                <li className="flex items-start gap-5 text-sm text-slate-500 sm:text-base">
                  <Tick />
                  <div>
                    Get paid in global standards for your design, development,
                    or content skills
                  </div>
                </li>
                <li className="flex items-start gap-5 text-sm text-slate-500 sm:text-base">
                  <Tick />
                  <div>
                    Work from anywhere in the world — all you need is a laptop
                    and internet
                  </div>
                </li>
              </ul>
            </div>
          )}

          <div className="mt-6 flex w-full gap-2 rounded-lg bg-indigo-50 px-6 py-4">
            <ExternalImage
              alt="Worth of live opportunities right now"
              className="size-7"
              src={'/hackathon/talent-olympics/cashbag.png'}
            />
            <div>
              <p className="text-lg font-semibold text-black">
                ${liveOpportunities?.totalUsdValue.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">
                Worth of live opportunities right now
              </p>
            </div>
          </div>

          <Button
            className="mt-3 h-12 w-full rounded-lg"
            size="lg"
            onClick={handleAccept}
            disabled={isLoading || !data?.valid}
          >
            Accept Invitation
          </Button>

          <div className="mt-5 flex items-center gap-2">
            <div className="flex -space-x-2">
              {avatars.map((avatar, index) => (
                <ExternalImage
                  key={index}
                  className="relative size-7 rounded-full"
                  src={avatar.src}
                  alt={avatar.name}
                  loading="eager"
                />
              ))}
            </div>
            {totalUsers !== null && totalUsers !== undefined && (
              <p className="text-sm font-semibold text-slate-500">
                Join {totalUsers.totalUsers?.toLocaleString('en-us')}+ others
              </p>
            )}
          </div>
        </div>
      </div>

      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        redirectTo={'/new/talent?onboarding=true&referral=true'}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  req,
}) => {
  try {
    const slug =
      (params?.slug as string | undefined)?.trim().toUpperCase() || '';

    const inviter = slug
      ? await prisma.user.findUnique({
          where: { referralCode: slug },
          select: { id: true },
        })
      : null;

    const privyDid = await getPrivyToken(req);
    const viewer = privyDid
      ? await prisma.user.findUnique({
          where: { privyDid },
          select: { id: true, isTalentFilled: true },
        })
      : null;

    if (inviter && viewer && viewer.id === inviter.id) {
      return { props: { redirectReason: 'self_referral' } };
    }

    if (viewer?.isTalentFilled) {
      return { props: { redirectReason: 'existing_user' } };
    }

    return { props: { redirectReason: null } };
  } catch {
    return { props: { redirectReason: null } };
  }
};
