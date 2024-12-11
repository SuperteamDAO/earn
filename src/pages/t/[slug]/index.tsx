import axios from 'axios';
import { ChevronDown, ChevronUp, SquarePen } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { MdEmail } from 'react-icons/md';
import { useInView } from 'react-intersection-observer';

import { EmptySection } from '@/components/shared/EmptySection';
import { ShareIcon } from '@/components/shared/shareIcon';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Separator } from '@/components/ui/separator';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { type FeedDataProps, FeedLoop, useGetFeed } from '@/features/feed';
import { GitHub, Linkedin, Twitter, Website } from '@/features/social';
import { AddProject, EarnAvatar, ShareProfile } from '@/features/talent';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { getURL } from '@/utils/validUrl';

type UserWithFeed = User & {
  feed: FeedDataProps[];
};
interface TalentProps {
  talent: UserWithFeed;
  stats: {
    wins: number;
    participations: number;
    totalWinnings: number;
  };
}

function TalentProfile({ talent, stats }: TalentProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'projects'>(
    'activity',
  );
  const [randomIndex, setRandomIndex] = useState<number>(0);
  const [showSubskills, setShowSubskills] = useState<Record<number, boolean>>(
    {},
  );

  const { ref, inView } = useInView();
  const {
    data: feed,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetFeed({
    filter: 'new',
    timePeriod: '',
    isWinner: false,
    take: 15,
    userId: talent?.id,
    takeOnlyType: activeTab === 'activity' ? undefined : 'pow',
  });

  useEffect(() => {
    refetch();
  }, [activeTab]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const handleToggleSubskills = (index: number) => {
    setShowSubskills({
      ...showSubskills,
      [index]: !showSubskills[index],
    });
  };
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (user?.id && talent?.id && user.id !== talent?.id)
      posthog.capture('clicked profile_talent');
  }, [talent]);

  const {
    isOpen: isOpenPow,
    onOpen: onOpenPow,
    onClose: onClosePow,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgImages = ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp'];

  useEffect(() => {
    setRandomIndex(Math.floor(Math.random() * bgImages.length));
  }, []);

  const socialLinks = [
    { Icon: Twitter, link: talent?.twitter },
    { Icon: Linkedin, link: talent?.linkedin },
    { Icon: GitHub, link: talent?.github },
    { Icon: Website, link: talent?.website },
  ];

  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/t/${talent?.username}/edit`);
  };

  const addNewPow = () => {
    refetch();
  };

  const isMD = useMediaQuery('(min-width: 768px)');

  const getWorkPreferenceText = (workPrefernce?: string): string | null => {
    if (!workPrefernce || workPrefernce === 'Not looking for Work') {
      return null;
    }
    const fullTimePatterns = [
      'Passively looking for fulltime positions',
      'Actively looking for fulltime positions',
      'Fulltime',
    ];
    const freelancePatterns = [
      'Passively looking for freelance work',
      'Actively looking for freelance work',
      'Freelance',
    ];
    const internshipPatterns = [
      'Actively looking for internships',
      'Internship',
    ];

    if (fullTimePatterns.includes(workPrefernce)) {
      return 'Fulltime Roles';
    }
    if (freelancePatterns.includes(workPrefernce)) {
      return 'Freelance Opportunities';
    }
    if (internshipPatterns.includes(workPrefernce)) {
      return 'Internship Opportunities';
    }

    return workPrefernce;
  };

  const workPreferenceText = getWorkPreferenceText(talent?.workPrefernce);

  const renderButton = (
    icon: JSX.Element,
    text: string,
    onClickHandler: () => void,
    outline: boolean = false,
  ) => {
    if (isMD) {
      return (
        <Button
          className={cn(
            'ph-no-capture text-sm font-medium',
            outline
              ? 'border-slate-400 bg-white text-slate-500 hover:bg-gray-100'
              : 'border-indigo-100 bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
          )}
          onClick={onClickHandler}
          variant={outline ? 'outline' : 'default'}
        >
          {icon}
          {text}
        </Button>
      );
    }

    return (
      <Button
        aria-label={text}
        onClick={onClickHandler}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded border p-2 text-sm font-medium transition',
          outline
            ? 'border-slate-400 bg-white text-slate-500 hover:bg-gray-100'
            : 'border-indigo-100 bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
        )}
      >
        {icon}
      </Button>
    );
  };

  const ogImage = new URL(`${getURL()}api/dynamic-og/talent/`);
  ogImage.searchParams.set('name', `${talent?.firstName} ${talent?.lastName}`);
  ogImage.searchParams.set('username', talent?.username!);
  ogImage.searchParams.set('skills', JSON.stringify(talent?.skills));
  ogImage.searchParams.set(
    'totalEarned',
    stats?.totalWinnings?.toString() || '0',
  );
  ogImage.searchParams.set(
    'submissionCount',
    stats?.participations?.toString(),
  );
  ogImage.searchParams.set('winnerCount', stats?.wins?.toString());
  ogImage.searchParams.set('photo', talent?.photo!);

  const title =
    talent?.firstName && talent?.lastName
      ? `${talent?.firstName} ${talent?.lastName} | Superteam Earn Talent`
      : 'Superteam Earn';

  const feedItems = feed?.pages.flatMap((page) => page) ?? [];

  return (
    <>
      <Default
        meta={
          <Head>
            <title>{title}</title>
            <meta property="og:title" content={title} />
            <meta property="og:image" content={ogImage.toString()} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:image" content={ogImage.toString()} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Talent on Superteam" />
            <meta charSet="UTF-8" key="charset" />
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
              key="viewport"
            />
          </Head>
        }
      >
        {!talent?.id && (
          <EmptySection message="Sorry! The profile you are looking for is not available." />
        )}
        {!!talent?.id && (
          <div className="bg-white">
            <div
              className="h-[100px] w-full bg-cover bg-no-repeat md:h-[30vh]"
              style={{
                backgroundImage: `url(${ASSET_URL}/bg/profile-cover/${bgImages[randomIndex]})`,
              }}
            />
            <div className="relative top-0 mx-auto max-w-[700px] rounded-[20px] bg-white px-4 py-7 md:-top-40 md:px-7">
              <div className="flex justify-between">
                <div>
                  <EarnAvatar
                    size={isMD ? '64px' : '52px'}
                    id={talent?.id}
                    avatar={talent?.photo}
                  />

                  <p className="mt-6 text-lg font-semibold text-slate-900 md:text-xl">
                    {talent?.firstName} {talent?.lastName}
                  </p>
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
                  {user?.id === talent?.id
                    ? renderButton(
                        <SquarePen />,
                        'Edit Profile',
                        handleEditProfileClick,
                      )
                    : renderButton(<MdEmail />, 'Reach Out', () => {
                        posthog.capture('reach out_talent profile');
                        const email = encodeURIComponent(talent?.email || '');
                        const subject = encodeURIComponent(
                          'Saw Your ST Earn Profile!',
                        );
                        const bcc = encodeURIComponent(
                          'support@superteamearn.com',
                        );
                        window.location.href = `mailto:${email}?subject=${subject}&bcc=${bcc}`;
                      })}
                  {renderButton(<ShareIcon />, 'Share', onOpen, true)}
                </div>
              </div>
              <ShareProfile
                username={talent?.username as string}
                isOpen={isOpen}
                onClose={onClose}
                id={talent?.id}
              />
              <Separator className="my-8" />
              <div className="flex w-full flex-col gap-12 md:flex-row md:gap-[6.25rem]">
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
                      <span className="text-slate-500">{talent?.location}</span>
                    </p>
                  )}
                </div>
                <div className="w-full md:w-1/2">
                  <p className="font-medium text-slate-900">Skills</p>
                  {Array.isArray(talent.skills) ? (
                    talent.skills.map((skillItem: any, index: number) => {
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
                                  'p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
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
              <Separator className="my-8" />
              <div className="flex flex-col justify-between gap-12 md:flex-row md:gap-[6.25rem]">
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
                      {stats.participations === 1
                        ? 'Submission'
                        : 'Submissions'}
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
                    <p className="font-medium text-slate-900">Proof of Work</p>
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
                  <div className="mt-12 flex justify-between gap-6 md:mt-0 md:justify-end">
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
              <div>
                <FeedLoop
                  feed={feedItems}
                  ref={ref}
                  isFetchingNextPage={isFetchingNextPage}
                  isLoading={isLoading}
                >
                  <>
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
                      onClick={() => router.push('/')}
                      className={cn(
                        'mt-2 w-[200px] font-medium text-slate-500',
                        'border border-slate-400 bg-white hover:bg-gray-100',
                      )}
                      variant="outline"
                    >
                      Browse Bounties
                    </Button>
                  </>
                </FeedLoop>
              </div>
            </div>
          </div>
        )}
        <AddProject
          isOpen={isOpenPow}
          onClose={onClosePow}
          upload
          onNewPow={addNewPow}
        />
      </Default>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  try {
    const talentReq = await axios.post(`${getURL()}/api/user/info`, {
      username: slug,
    });
    const statsReq = await axios.post(`${getURL()}/api/user/public-stats`, {
      username: slug,
    });
    const talent = talentReq.data;
    const stats = statsReq.data;

    return {
      props: { talent, stats },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { talent: null },
    };
  }
};

export default TalentProfile;
