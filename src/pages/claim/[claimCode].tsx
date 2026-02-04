import { usePrivy } from '@privy-io/react-auth';
import { createHash } from 'crypto';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';

import { Login } from '@/features/auth/components/Login';

type ClaimStatus = 'valid' | 'invalid' | 'claimed';

interface ClaimPageProps {
  claimCode: string;
  agentName?: string | null;
  status: ClaimStatus;
}

export default function ClaimPage({
  claimCode,
  agentName,
  status,
}: ClaimPageProps) {
  const { authenticated } = usePrivy();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(status === 'claimed');
  const [justClaimed, setJustClaimed] = useState(false);

  const isInvalid = status === 'invalid';

  const handleClaim = async () => {
    if (isInvalid || isClaimed) return;
    if (!authenticated) {
      setIsLoginOpen(true);
      return;
    }

    setIsClaiming(true);
    try {
      await api.post('/api/agents/claim', { claimCode });
      setIsClaimed(true);
      setJustClaimed(true);
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

          <div className="mt-6 flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleClaim}
              disabled={isInvalid || isClaimed || isClaiming}
            >
              {isClaimed
                ? 'Claimed'
                : isClaiming
                  ? 'Claiming...'
                  : authenticated
                    ? 'Claim Agent'
                    : 'Sign In to Claim'}
            </Button>
            {!authenticated && !isInvalid && (
              <p className="text-xs text-slate-500">
                You must be signed in to confirm the claim.
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
    select: { name: true, status: true, claimedByUserId: true },
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
      status: agent.claimedByUserId ? 'claimed' : 'valid',
    },
  };
};
