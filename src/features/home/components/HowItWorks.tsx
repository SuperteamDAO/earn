import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { LuCheck } from 'react-icons/lu';

import { AuthWrapper } from '@/features/auth';
import { userStatsQuery } from '@/features/home';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

const StepIcon = ({ step }: { step: number }) => {
  if (step === 1) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          opacity="0.3"
          d="M12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7C16 9.20914 14.2091 11 12 11Z"
          fill="#6366F1"
        />
        <path
          d="M3.00065 20.1992C3.38826 15.4265 7.26191 13 11.9833 13C16.7712 13 20.7049 15.2932 20.9979 20.2C21.0096 20.3955 20.9979 21 20.2467 21C16.5411 21 11.0347 21 3.7275 21C3.47671 21 2.97954 20.4592 3.00065 20.1992Z"
          fill="#6366F1"
        />
      </svg>
    );
  } else if (step === 2) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15 19.5229C15 20.265 15.9624 20.5564 16.374 19.9389L22.2227 11.166C22.5549 10.6676 22.1976 10 21.5986 10H17V4.47708C17 3.73503 16.0376 3.44363 15.626 4.06106L9.77735 12.834C9.44507 13.3324 9.80237 14 10.4014 14H15V19.5229Z"
          fill="#6366F1"
        />
        <path
          opacity="0.3"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 6.5C3 5.67157 3.67157 5 4.5 5H9.5C10.3284 5 11 5.67157 11 6.5C11 7.32843 10.3284 8 9.5 8H4.5C3.67157 8 3 7.32843 3 6.5ZM3 18.5C3 17.6716 3.67157 17 4.5 17H9.5C10.3284 17 11 17.6716 11 18.5C11 19.3284 10.3284 20 9.5 20H4.5C3.67157 20 3 19.3284 3 18.5ZM2.5 11C1.67157 11 1 11.6716 1 12.5C1 13.3284 1.67157 14 2.5 14H6.5C7.32843 14 8 13.3284 8 12.5C8 11.6716 7.32843 11 6.5 11H2.5Z"
          fill="#6366F1"
        />
      </svg>
    );
  } else if (step === 3) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          opacity="0.3"
          x="2"
          y="2"
          width="10"
          height="12"
          rx="2"
          fill="#6366F1"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 6C2.89543 6 2 6.89543 2 8V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V8C22 6.89543 21.1046 6 20 6H4ZM20 14C20 15.1046 19.1046 16 18 16C16.8954 16 16 15.1046 16 14C16 12.8954 16.8954 12 18 12C19.1046 12 20 12.8954 20 14Z"
          fill="#6366F1"
        />
      </svg>
    );
  } else return null;
};

const Step = ({
  number,
  isComplete,
}: {
  number: number;
  isComplete: boolean;
}) => {
  return (
    <div
      className={cn(
        'relative z-10 flex items-center justify-center',
        'h-[2.375rem] w-[2.375rem] overflow-visible rounded-full',
        isComplete
          ? 'bg-brand-purple text-white'
          : 'bg-[#F4F4FE] text-[#94A3B8]',
      )}
    >
      {isComplete ? (
        <LuCheck className="h-[1.3rem] w-[1.3rem]" strokeWidth={3} />
      ) : (
        <StepIcon step={number} />
      )}
      {number < 3 && (
        <div
          className={cn(
            'absolute top-[110%] h-[90%] w-[0.12rem]',
            isComplete ? 'bg-purple-700' : 'bg-slate-400',
            'opacity-60',
          )}
        />
      )}
    </div>
  );
};

export const HowItWorks = () => {
  const router = useRouter();
  const { user } = useUser();
  const { data: stats, isLoading } = useQuery({
    ...userStatsQuery,
    enabled: !!user,
  });

  const hasSubmissions = (stats?.participations ?? 0) > 0;
  const hasWins = (stats?.wins ?? 0) > 0;
  const posthog = usePostHog();

  if (hasWins) return null;

  return (
    <AuthWrapper
      className={cn(isLoading ? 'pointer-events-none' : 'pointer-events-auto')}
      onClick={() => {
        posthog.capture('create account_getting started');
      }}
    >
      <div className={cn('opacity-100', isLoading && 'opacity-20')}>
        <p className="mb-6 font-medium text-gray-400">HOW IT WORKS</p>
        <div className="flex h-[12.5rem]">
          <div className="relative flex h-full flex-col justify-between">
            <Step
              number={1}
              isComplete={!isLoading && !!user?.isTalentFilled}
            />
            <Step number={2} isComplete={!isLoading && hasSubmissions} />
            <Step number={3} isComplete={!isLoading && hasWins} />
          </div>
          <div className="relative flex h-full flex-col items-start justify-between">
            <div className="ml-[0.8125rem]">
              <button
                className={cn(
                  'text-md font-medium hover:text-brand-purple',
                  !isLoading && !!user?.isTalentFilled
                    ? 'text-slate-500'
                    : 'text-brand-purple',
                )}
                onClick={() => {
                  if (!isLoading && !!user?.isTalentFilled) return;
                  if (user?.id) {
                    posthog.capture('create account_getting started');
                    router.push(`/new/talent`);
                  }
                }}
              >
                Create your profile
              </button>
              <p className="text-md font-medium text-gray-500">
                by telling us about yourself
              </p>
            </div>
            <div className="ml-[0.8125rem]">
              <button
                className={cn(
                  'text-md font-medium hover:text-brand-purple',
                  !isLoading && hasSubmissions
                    ? 'text-slate-500'
                    : 'text-brand-purple',
                )}
                onClick={() => {
                  if (!isLoading && hasSubmissions) return;
                  if (user?.id) {
                    posthog.capture('complete profile_getting started');
                    router.push(`/all`);
                  }
                }}
              >
                {`Participate in Bounties & Projects`}
              </button>
              <p className="text-md font-medium text-gray-500">
                to build proof of work
              </p>
            </div>
            <div className="ml-[0.8125rem]">
              <button
                className={cn(
                  'text-md font-medium hover:text-brand-purple',
                  !isLoading && hasWins
                    ? 'text-slate-500'
                    : 'text-brand-purple',
                )}
                onClick={() => {
                  if (!isLoading && hasWins) return;
                  if (user?.id) {
                    posthog.capture('win_getting started');
                    router.push('/feed');
                  }
                }}
              >
                Get Paid for Your Work
              </button>
              <p className="text-md font-medium text-gray-500">
                in global standards
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};
