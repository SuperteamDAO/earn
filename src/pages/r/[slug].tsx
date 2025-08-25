import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

import { Login } from '@/features/auth/components/Login';
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

export default function ReferralLandingPage() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

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
    enabled: !!code,
  });

  useEffect(() => {
    if (!code) return;
    try {
      sessionStorage.setItem('referralCode', code);
      localStorage.setItem('referralCode', code);
    } catch {}
  }, [code]);

  useEffect(() => {
    if (authenticated) {
      toast.warning(
        'This referral is invalid since you have signed up on Earn before with this email ID.',
        { id: 'referral-invalid' },
      );
      router.replace('/');
    }
  }, [authenticated, router]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!isLoading && data && data.inviter && data.remaining === 0) {
      toast.error(
        'This invitation link has expired. You will be redirected to the profile creation page in 5 seconds.',
        { duration: 4800, id: 'referral-expired' },
      );
      timeout = setTimeout(() => router.push('/new'), 5000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [data, isLoading, router]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (isLoginOpen && authenticated) {
      const intent = sessionStorage.getItem('referralIntent');
      if (intent) {
        timeout = setTimeout(() => {
          if (window.location.pathname.startsWith('/new')) {
            // New users will be redirected by onboarding flow
            sessionStorage.removeItem('referralIntent');
            return;
          }
          toast.warning(
            'This referral is invalid since you have signed up on Earn before with this email ID.',
            { id: 'referral-invalid' },
          );
          sessionStorage.removeItem('referralIntent');
          router.replace('/');
        }, 1200);
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [authenticated, isLoginOpen, router]);

  const handleAccept = () => {
    if (!code) return;
    sessionStorage.setItem('referralIntent', 'true');
    if (!authenticated) {
      setIsLoginOpen(true);
      return;
    }

    toast.warning(
      'This referral is invalid since you have signed up on Earn before with this email ID.',
      { id: 'referral-invalid' },
    );
    router.replace('/');
  };

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

  return (
    <div className="container mx-auto flex max-w-lg justify-center">
      <div className="w-full px-6 pt-12 pb-16 sm:mt-10 sm:px-12">
        <div className="flex flex-col items-center">
          {data?.inviter?.photo ? (
            <EarnAvatar
              className="size-16"
              id={data.inviter.id}
              avatar={data.inviter.photo}
            />
          ) : (
            <div className="mb-6 h-16 w-16 rounded-full bg-gray-200" />
          )}

          <h1 className="text-center text-xl font-semibold text-slate-600 sm:text-2xl">
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

          {!isLoading && data && !data.valid && (
            <div className="mt-8 w-full">
              <div className="mb-2 text-center text-sm text-slate-500">
                Have a referral code?
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = manualCode.trim().toUpperCase();
                    if (!next) return;
                    router.push(`/r/${next}`);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
