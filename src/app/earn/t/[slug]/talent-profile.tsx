'use client';

import { ChevronDown, ChevronUp, SquarePen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { type JSX, memo, useEffect, useMemo, useState } from 'react';

import { ShareIcon } from '@/components/shared/shareIcon';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Separator } from '@/components/ui/separator';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useViewer } from '@/lib/viewer';
import type { TalentPage } from '@/server/talent-profile';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import {
  type FeedListQuery,
  InfiniteFeed,
} from '@/features/feed/components/InfiniteFeed';
import type { FeedDataProps } from '@/features/feed/types';
import {
  GitHub,
  Linkedin,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
import { TalentProfileBackground } from '@/features/talent/components/TalentProfileBackground';
import { getWorkPreferenceText } from '@/features/talent/utils/work-preference';

const AddProject = dynamic(
  () =>
    import('@/features/talent/components/AddProject').then(
      (mod) => mod.AddProject,
    ),
  { ssr: false },
);
const ShareProfile = dynamic(
  () =>
    import('@/features/talent/components/shareProfile').then(
      (mod) => mod.ShareProfile,
    ),
  { ssr: false },
);

interface SkillItem {
  skills: string;
  subskills: string[];
}

const ProfileActionButton = memo(function ProfileActionButton({
  icon,
  text,
  onClick,
  outline = false,
  isMD,
}: {
  icon: JSX.Element;
  text: string;
  onClick: () => void;
  outline?: boolean;
  isMD: boolean;
}) {
  if (isMD) {
    return (
      <AuthWrapper showCompleteProfileModal allowSponsor>
        <Button
          className={cn(
            'ph-no-capture w-full text-sm font-medium',
            outline
              ? 'border-slate-400 bg-white text-slate-500 hover:bg-gray-100'
              : 'border-brand-purple/5 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20',
          )}
          onClick={onClick}
          variant={outline ? 'outline' : 'default'}
        >
          {icon}
          {text}
        </Button>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper showCompleteProfileModal allowSponsor>
      <Button
        aria-label={text}
        onClick={onClick}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded border p-2 text-sm font-medium transition',
          outline
            ? 'border-slate-400 bg-white text-slate-500 hover:bg-gray-100'
            : 'border-indigo-100 bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
        )}
      >
        {icon}
      </Button>
    </AuthWrapper>
  );
});

interface Props {
  talent: TalentPage['talent'];
  stats: TalentPage['stats'];
  bgIndex: number;
  // The activity tab's first page, loaded with the page.
  initialFeed: FeedDataProps[];
}

// Earn's talent profile (/earn/t/[slug]), its data loaded on the server.
export function TalentProfileView({
  talent,
  stats,
  bgIndex,
  initialFeed,
}: Props) {
  const [activeTab, setActiveTab] = useState<'activity' | 'projects'>(
    'activity',
  );
  const [showSubskills, setShowSubskills] = useState<Record<number, boolean>>(
    {},
  );
  // Bumped when they add a project, so the feed loads again.
  const [feedVersion, setFeedVersion] = useState(0);

  const feedQuery = useMemo<FeedListQuery>(
    () => ({
      filter: 'new',
      timePeriod: '',
      isWinner: false,
      take: 5,
      userId: talent.id,
      takeOnlyType: activeTab === 'activity' ? undefined : 'pow',
    }),
    [talent.id, activeTab],
  );

  const handleToggleSubskills = (index: number) => {
    setShowSubskills((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const user = useViewer();

  useEffect(() => {
    let ignore = false;
    if (user?.id && talent?.id && user.id !== talent?.id) {
      void import('posthog-js').then(({ default: posthog }) => {
        if (!ignore) posthog.capture('clicked profile_talent');
      });
    }
    return () => {
      ignore = true;
    };
  }, [talent?.id, user?.id]);

  const {
    isOpen: isOpenPow,
    onOpen: onOpenPow,
    onClose: onClosePow,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const socialLinks = useMemo(
    () => [
      { Icon: Twitter, link: talent?.twitter ?? undefined },
      { Icon: Linkedin, link: talent?.linkedin ?? undefined },
      { Icon: GitHub, link: talent?.github ?? undefined },
      { Icon: Website, link: talent?.website ?? undefined },
    ],
    [talent?.twitter, talent?.linkedin, talent?.github, talent?.website],
  );

  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/earn/t/${talent?.username}/edit/`);
  };

  const addNewPow = () => {
    setFeedVersion((version) => version + 1);
  };

  const isMD = useMediaQuery('(min-width: 768px)');

  const workPreferenceText = getWorkPreferenceText(talent?.workPrefernce);

  const skills: Array<SkillItem | null> | null = Array.isArray(talent.skills)
    ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Earn's stored skills JSON
      (talent.skills as Array<SkillItem | null>)
    : null;

  return (
    <>
      {
        <div className="bg-white">
          <TalentProfileBackground
            bgIndex={bgIndex}
            className="h-[100px] w-full rounded-none md:h-[30vh]"
          />
          <div className="relative top-0 mx-auto max-w-[700px] rounded-[20px] bg-white px-4 py-7 md:-top-40 md:px-7">
            <div className="flex justify-between">
              <div>
                <EarnAvatar
                  className="h-14 w-14 md:h-16 md:w-16"
                  id={talent?.id}
                  avatar={talent?.photo ?? undefined}
                  imgLoading="eager"
                  imgFetchPriority="high"
                />

                <div className="mt-6 flex items-center gap-1">
                  <p className="text-lg font-semibold text-slate-900 md:text-xl">
                    {talent?.firstName} {talent?.lastName}
                  </p>
                </div>
                <p className="text-base font-semibold text-slate-500">
                  @
                  {isMD
                    ? talent?.username
                    : talent?.username?.length && talent?.username.length > 24
                      ? `${talent?.username.slice(0, 24)}...`
                      : talent?.username}
                </p>
              </div>
              <div className="flex w-auto gap-3 md:w-[160px] md:flex-col">
                {user?.id === talent?.id && (
                  <ProfileActionButton
                    icon={<SquarePen />}
                    text="Edit Profile"
                    onClick={handleEditProfileClick}
                    isMD={isMD}
                  />
                )}
                <ProfileActionButton
                  icon={<ShareIcon />}
                  text="Share"
                  onClick={onOpen}
                  outline
                  isMD={isMD}
                />
              </div>
            </div>
            <ShareProfile
              username={talent?.username ?? ''}
              isOpen={isOpen}
              onClose={onClose}
              id={talent?.id}
            />
            <Separator className="my-8" />
            {
              <>
                <div className="flex w-full flex-col gap-12 md:flex-row md:gap-25">
                  <div className="w-full md:w-1/2">
                    <p className="mb-4 font-medium text-slate-900">Details</p>
                    {workPreferenceText && (
                      <p className="mt-3 text-slate-400">
                        Looking for{' '}
                        <span className="text-slate-500">
                          {workPreferenceText}
                        </span>
                      </p>
                    )}
                    {talent?.currentEmployer && (
                      <p className="mt-3 text-slate-400">
                        Works at{' '}
                        <span className="text-slate-500">
                          {talent?.currentEmployer}
                        </span>
                      </p>
                    )}
                    {talent?.location && (
                      <p className="mt-3 text-slate-400">
                        Based in{' '}
                        <span className="text-slate-500">
                          {talent?.location}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="w-full md:w-1/2">
                    <p className="font-medium text-slate-900">Skills</p>
                    {skills ? (
                      skills.map((skillItem, index) => {
                        return skillItem ? (
                          <div className="mt-4" key={index}>
                            <p className="text-xs font-medium text-slate-400">
                              {skillItem.skills.toUpperCase()}
                            </p>
                            <div className="flex items-center">
                              <div className="mt-2 flex flex-wrap gap-2">
                                {skillItem.subskills
                                  .slice(0, 3)
                                  .map((subskill: string, subIndex: number) => (
                                    <div
                                      key={subIndex}
                                      className="rounded bg-[#EFF1F5] px-3 py-1 text-sm font-medium text-[#64739C]"
                                    >
                                      {subskill}
                                    </div>
                                  ))}
                              </div>
                              {skillItem.subskills.length > 3 && (
                                <button
                                  aria-label="Toggle subskills"
                                  className={cn(
                                    'mt-2 ml-1 p-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-hidden',
                                    'rounded transition hover:bg-gray-100',
                                  )}
                                  onClick={() => handleToggleSubskills(index)}
                                >
                                  {showSubskills[index] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>

                            {showSubskills[index] && (
                              <div
                                className={cn(
                                  'mt-2 flex flex-wrap gap-2',
                                  'transition-all duration-300 ease-in-out',
                                )}
                              >
                                {skillItem.subskills
                                  .slice(3)
                                  .map((subskill: string, subIndex: number) => (
                                    <div
                                      key={subIndex}
                                      className="rounded bg-[#EFF1F5] px-3 py-1 text-sm font-medium text-[#64739C]"
                                    >
                                      {subskill}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })
                    ) : (
                      <p>No skills available</p>
                    )}
                  </div>
                </div>
                <Separator className="mt-8 mb-4" />
              </>
            }
            <div className="flex flex-col justify-between gap-12 md:flex-row md:gap-25">
              <div className="flex w-full gap-6 md:w-1/2">
                {socialLinks.map(({ Icon, link }, i) => {
                  return <Icon link={link} className="h-5 w-5" key={i} />;
                })}
              </div>
              <div className="flex w-full gap-6 md:w-1/2 md:gap-8">
                <div className="flex flex-col">
                  <p className="font-semibold">
                    $
                    {new Intl.NumberFormat('en-US', {
                      maximumFractionDigits: 0,
                    }).format(Math.round(stats?.totalWinnings || 0))}
                  </p>
                  <p className="font-medium text-slate-500">Earned</p>
                </div>
                <div className="flex flex-col">
                  <p className="font-semibold">{stats?.participations}</p>
                  <p className="font-medium text-slate-500">
                    {stats.participations === 1 ? 'Submission' : 'Submissions'}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="font-semibold">{stats?.wins}</p>
                  <p className="font-medium text-slate-500">Won</p>
                </div>
              </div>
            </div>
            <div className="mt-12 md:mt-16">
              <div className="md:items:center flex flex-col items-end justify-between md:flex-row">
                <div className="flex items-center gap-3">
                  <p className="font-medium whitespace-nowrap text-slate-900">
                    Proof of Work
                  </p>
                  {user?.id === talent?.id && (
                    <Button
                      className={cn(
                        'px-2 py-1 text-sm font-semibold text-slate-400',
                        'hover:bg-gray-100',
                      )}
                      onClick={onOpenPow}
                      size="sm"
                      variant="ghost"
                    >
                      +ADD
                    </Button>
                  )}
                </div>
                <div className="mt-12 flex w-full justify-between gap-6 md:mt-0 md:justify-end">
                  <p
                    className={cn(
                      'cursor-pointer font-medium',
                      activeTab === 'activity'
                        ? 'text-slate-900'
                        : 'text-slate-400',
                    )}
                    onClick={() => setActiveTab('activity')}
                  >
                    Activity Feed
                  </p>

                  <p
                    className={cn(
                      'cursor-pointer font-medium',
                      activeTab === 'projects'
                        ? 'text-slate-900'
                        : 'text-slate-400',
                    )}
                    onClick={() => setActiveTab('projects')}
                  >
                    Personal Projects
                  </p>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div style={{ contentVisibility: 'auto' }}>
              <InfiniteFeed
                key={`${activeTab}-${feedVersion}`}
                initial={
                  activeTab === 'activity' && feedVersion === 0
                    ? initialFeed
                    : undefined
                }
                query={feedQuery}
                type="profile"
              >
                <ExternalImage
                  className="mx-auto mt-32 w-32"
                  alt={'talent empty'}
                  src={'/bg/talent-empty.svg'}
                />
                <p className="mx-auto mt-5 w-52 text-center font-medium text-slate-400">
                  {user?.id === talent?.id
                    ? 'Add some proof of work to build your profile'
                    : 'Nothing to see here yet ...'}
                </p>
                {user?.id === talent?.id ? (
                  <Button
                    onClick={onOpenPow}
                    className={cn('mt-5 w-[200px]', 'mx-auto block')}
                  >
                    Add
                  </Button>
                ) : (
                  <div className="mt-5" />
                )}

                <Button
                  onClick={() => router.push('/earn/')}
                  className="mx-auto mt-2 block w-[200px] border border-slate-400 bg-white font-medium text-slate-500 hover:bg-gray-100"
                  variant="outline"
                >
                  Browse Bounties
                </Button>
              </InfiniteFeed>
            </div>
          </div>
        </div>
      }
      <AddProject
        isOpen={isOpenPow}
        onClose={onClosePow}
        upload
        onNewPow={addNewPow}
      />
    </>
  );
}
