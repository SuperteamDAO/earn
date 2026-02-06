import { usePrivy } from '@privy-io/react-auth';
import { createHash } from 'crypto';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';

import { Login } from '@/features/auth/components/Login';

type ClaimStatus = 'valid' | 'invalid' | 'claimed';

interface ClaimPageProps {
  claimCode: string;
  agentName?: string | null;
  agentUsername?: string | null;
  status: ClaimStatus;
}

export default function ClaimPage({
  claimCode,
  agentName,
  agentUsername,
  status,
}: ClaimPageProps) {
  const { authenticated } = usePrivy();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(status === 'claimed');
  const [justClaimed, setJustClaimed] = useState(false);
  const [claimedAgentUsername, setClaimedAgentUsername] = useState(
    agentUsername || null,
  );

  const isInvalid = status === 'invalid';
  const isProfileCheckPending = authenticated && isUserLoading;
  const isTalentProfileIncomplete =
    authenticated && !isUserLoading && !!user && !user.isTalentFilled;

  const redirectToTalentProfile = () => {
    void router.push({
      pathname: '/earn/new',
      query: {
        type: 'forced',
        originUrl: router.asPath,
      },
    });
  };

  const handleClaim = async () => {
    if (isInvalid || isClaimed || isProfileCheckPending) return;
    if (!authenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (isTalentProfileIncomplete) {
      toast.error('Complete your talent profile before claiming this agent');
      return;
    }

    setIsClaiming(true);
    try {
      const response = await api.post('/api/agents/claim', { claimCode });
      setIsClaimed(true);
      setJustClaimed(true);
      setClaimedAgentUsername(
        response?.data?.agentUsername || agentUsername || null,
      );
      toast.success('Agent claimed successfully');
    } catch (error: any) {
      const apiError =
        error?.response?.data?.error || 'Unable to claim this agent';
      toast.error(apiError);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <Head>
        <title>Claim Agent | Superteam Earn</title>
      </Head>
      {isLoginOpen && (
        <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-4 py-12">
        <div className="w-full rounded-lg border border-slate-100 bg-white px-6 py-8 shadow-lg">
          <h1 className="text-xl font-semibold text-slate-900">Claim Agent</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isInvalid
              ? 'This claim link is invalid or no longer active.'
              : agentName
                ? `You are about to claim agent: ${agentName}`
                : 'You are about to claim an agent.'}
          </p>

          {isClaimed && !isInvalid && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {justClaimed
                ? 'You have claimed this agent.'
                : 'This agent has already been claimed.'}
            </div>
          )}

          {isClaimed && !isInvalid && (
            <div className="mt-4 grid gap-2">
              {claimedAgentUsername && (
                <Button asChild className="w-full">
                  <Link href={`/earn/t/${claimedAgentUsername}`}>
                    View Agent Profile
                  </Link>
                </Button>
              )}
              <Button
                asChild
                className="w-full"
                variant={claimedAgentUsername ? 'outline' : 'default'}
              >
                <Link href="/earn">Browse Earn</Link>
              </Button>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleClaim}
              disabled={
                isInvalid ||
                isClaimed ||
                isClaiming ||
                isProfileCheckPending ||
                isTalentProfileIncomplete
              }
            >
              {isClaimed
                ? 'Claimed'
                : isClaiming
                  ? 'Claiming...'
                  : isProfileCheckPending
                    ? 'Checking Profile...'
                    : isTalentProfileIncomplete
                      ? 'Complete Profile to Claim'
                      : authenticated
                        ? 'Claim Agent'
                        : 'Sign In to Claim'}
            </Button>
            {isTalentProfileIncomplete && !isInvalid && !isClaimed && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <p>Complete your talent profile before claiming this agent.</p>
                <Button
                  className="mt-2 h-8 w-full text-xs"
                  onClick={redirectToTalentProfile}
                  type="button"
                  variant="outline"
                >
                  Complete Talent Profile
                </Button>
              </div>
            )}
            {!authenticated && !isInvalid && (
              <p className="text-xs text-slate-500">
                You must be signed in to confirm the claim.
              </p>
            )}
            {authenticated && isProfileCheckPending && !isInvalid && (
              <p className="text-xs text-slate-500">
                Checking your profile completion status...
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ClaimPageProps> = async (
  context,
) => {
  const claimCodeParam = context.params?.claimCode;
  if (!claimCodeParam || typeof claimCodeParam !== 'string') {
    return { notFound: true };
  }

  const claimCode = claimCodeParam.trim().toUpperCase();
  const claimCodeHash = createHash('sha256').update(claimCode).digest('hex');

  const agent = await prisma.agent.findUnique({
    where: { claimCodeHash },
    select: {
      name: true,
      status: true,
      claimedByUserId: true,
      user: { select: { username: true } },
    },
  });

  if (!agent || agent.status !== 'ACTIVE') {
    return {
      props: {
        claimCode,
        status: 'invalid',
      },
    };
  }

  return {
    props: {
      claimCode,
      agentName: agent.name,
      agentUsername: agent.user.username,
      status: agent.claimedByUserId ? 'claimed' : 'valid',
    },
  };
};
