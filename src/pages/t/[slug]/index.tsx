import { ChevronDown, ChevronUp, SquarePen } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { type JSX, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { EmptySection } from '@/components/shared/EmptySection';
import { JsonLd } from '@/components/shared/JsonLd';
import { ShareIcon } from '@/components/shared/shareIcon';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Separator } from '@/components/ui/separator';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import {
  generateBreadcrumbListSchema,
  generatePersonSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
const FeedLoop = dynamic(
  () =>
    import('@/features/feed/components/FeedLoop').then((mod) => mod.FeedLoop),
  {
    ssr: false,
  },
);
import { useGetFeed } from '@/features/feed/queries/useGetFeed';
import { type FeedDataProps } from '@/features/feed/types';
import {
  GitHub,
  Linkedin,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
const AddProject = dynamic(
  () =>
    import('@/features/talent/components/AddProject').then(
      (mod) => mod.AddProject,
    ),
  { ssr: false },
);
import { ProBadge } from '@/features/pro/components/ProBadge';
import { ProBG } from '@/features/pro/components/ProBg';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
const ShareProfile = dynamic(
  () =>
    import('@/features/talent/components/shareProfile').then(
      (mod) => mod.ShareProfile,
    ),
  { ssr: false },
);

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
    take: 5,
    userId: talent?.id,
    takeOnlyType: activeTab === 'activity' ? undefined : 'pow',
  });

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

  useEffect(() => {
    const track = async () => {
      if (user?.id && talent?.id && user.id !== talent?.id) {
        const { default: posthog } = await import('posthog-js');
        posthog.capture('clicked profile_talent');
      }
    };
    track();
  }, [talent, user?.id]);

  const {
    isOpen: isOpenPow,
    onOpen: onOpenPow,
    onClose: onClosePow,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgImages = ['1.webp', '2.webp', '3.webp', '4.webp', '5.webp'];
  const hashStringToInt = (input: string): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };
  const bgIndex = useMemo(() => {
    return talent?.id ? hashStringToInt(talent.id) % bgImages.length : 0;
  }, [talent?.id]);
  const coverUrl = `${ASSET_URL}/bg/profile-cover/${bgImages[bgIndex]}`;
  const optimizedCoverUrl = coverUrl.replace(
    '/upload/',
    '/upload/f_auto,q_auto/',
  );

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

  const isPublicProfile = !!talent?.id && !talent.private;

  const description = useMemo(() => {
    if (!isPublicProfile) return '';

    const parts: string[] = [];
    const fullName = `${talent?.firstName || ''} ${
      talent?.lastName || ''
    }`.trim();

    if (fullName) parts.push(fullName);
    if (workPreferenceText) parts.push(`looking for ${workPreferenceText}`);
    if (talent?.currentEmployer)
      parts.push(`works at ${talent.currentEmployer}`);
    if (talent?.location) parts.push(`based in ${talent.location}`);

    const statsStr = `$${Math.round(
      stats?.totalWinnings || 0,
    ).toLocaleString()} earned, ${stats?.wins || 0} wins on Superteam Earn.`;

    return parts.length > 0
      ? `${parts.join(' | ')}. ${statsStr}`
      : `Talent profile on Superteam Earn. ${statsStr}`;
  }, [talent, workPreferenceText, stats, isPublicProfile]);

  const renderButton = (
    icon: JSX.Element,
    text: string,
    onClickHandler: () => void,
    outline: boolean = false,
  ) => {
    if (isMD) {
      return (
        <AuthWrapper showCompleteProfileModal allowSponsor>
          <Button
            className={cn(
              'ph-no-capture w-full text-sm font-medium',
              outline
                ? talent?.isPro
                  ? 'border-zinc-400 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-600'
                  : 'border-slate-400 bg-white text-slate-500 hover:bg-gray-100'
                : talent?.isPro
                  ? 'border-zinc-600 bg-zinc-700 text-white hover:bg-zinc-800 hover:text-white'
                  : 'border-brand-purple/5 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20',
            )}
            onClick={onClickHandler}
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
          onClick={onClickHandler}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded border p-2 text-sm font-medium transition',
            outline
              ? talent?.isPro
                ? 'border-zinc-400 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-600'
                : 'border-slate-400 bg-white text-slate-500 hover:bg-gray-100'
              : talent?.isPro
                ? 'border-zinc-600 bg-zinc-700 text-white hover:bg-zinc-800 hover:text-white'
                : 'border-indigo-100 bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
          )}
        >
          {icon}
        </Button>
      </AuthWrapper>
    );
  };

  const ogImagePath = talent?.isPro
    ? `${getURL()}api/dynamic-og/pro-talent/`
    : `${getURL()}api/dynamic-og/talent/`;
  const ogImage = new URL(ogImagePath);
  ogImage.searchParams.set('name', `${talent?.firstName} ${talent?.lastName}`);
  ogImage.searchParams.set('username', talent?.username!);
  ogImage.searchParams.set('skills', JSON.stringify(talent?.skills));
  ogImage.searchParams.set(
    'totalEarned',
    stats?.totalWinnings?.toFixed(0) || '0',
  );
  ogImage.searchParams.set(
    'submissionCount',
    stats?.participations?.toString(),
  );
  ogImage.searchParams.set('winnerCount', stats?.wins?.toString());
  if (talent?.photo) {
    ogImage.searchParams.set('photo', talent.photo);
  }

  const title =
    talent?.firstName && talent?.lastName
      ? `${talent?.firstName} ${talent?.lastName} | Superteam Earn Talent`
      : 'Superteam Earn';

  const feedItems = feed?.pages.flatMap((page) => page) ?? [];

  // Generate JSON-LD schemas for public profiles only
  const personSchema = isPublicProfile
    ? generatePersonSchema({
        firstName: talent?.firstName,
        lastName: talent?.lastName,
        username: talent?.username,
        photo: talent?.photo,
        workPreference: workPreferenceText,
        currentEmployer: talent?.currentEmployer,
        location: talent?.location,
        skills: talent?.skills,
        twitter: talent?.twitter,
        linkedin: talent?.linkedin,
        github: talent?.github,
        website: talent?.website,
      })
    : null;

  const breadcrumbSchema = isPublicProfile
    ? generateBreadcrumbListSchema([
        { name: 'Home', url: '/' },
        { name: 'Talent', url: '/leaderboard/' },
        {
          name:
            `${talent?.firstName || ''} ${talent?.lastName || ''}`.trim() ||
            'Talent',
        },
      ])
    : null;

  return (
    <Default
      meta={
        <>
          <Head>
            <title>{title}</title>
            <meta property="og:title" content={title} />
            <meta property="og:image" content={ogImage.toString()} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:image" content={ogImage.toString()} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:alt"
              content={
                isPublicProfile
                  ? `${talent?.firstName} ${talent?.lastName} - Talent profile on Superteam Earn`
                  : 'Talent on Superteam'
              }
            />
            <meta property="og:type" content="profile" />
            <meta charSet="UTF-8" key="charset" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1"
              key="viewport"
            />
            <link
              rel="preconnect"
              href="https://res.cloudinary.com"
              crossOrigin=""
            />
            <link rel="dns-prefetch" href="https://res.cloudinary.com" />
            <link rel="preload" as="image" href={optimizedCoverUrl} />
            {isPublicProfile && (
              <>
                <meta name="description" content={description} />
                <meta property="og:description" content={description} />
                <meta name="twitter:description" content={description} />
                <link
                  rel="canonical"
                  href={`https://earn.superteam.fun/t/${talent?.username}/`}
                />
              </>
            )}
            {talent.private && (
              <>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="googlebot" content="noindex, nofollow" />
              </>
            )}
          </Head>
          {personSchema && breadcrumbSchema && (
            <JsonLd data={[personSchema, breadcrumbSchema]} />
          )}
        </>
      }
    >
      {!talent?.id && (
        <EmptySection message="Sorry! The profile you are looking for is not available." />
      )}
      {!!talent?.id && (
        <div className="bg-white">
          {talent?.isPro ? (
            <ProBG
              origin="dialog"
              className="h-[100px] w-full rounded-none md:h-[30vh]"
            />
          ) : (
            <div
              className="h-[100px] w-full bg-cover bg-no-repeat md:h-[30vh]"
              style={{
                backgroundImage: `url(${optimizedCoverUrl})`,
              }}
            />
          )}
          <div className="relative top-0 mx-auto max-w-[700px] rounded-[20px] bg-white px-4 py-7 md:-top-40 md:px-7">
            <div className="flex justify-between">
              <div>
                <EarnAvatar
                  className="h-14 w-14 md:h-16 md:w-16"
                  id={talent?.id}
                  avatar={talent?.photo}
                  imgLoading="eager"
                  imgFetchPriority="high"
                />

                <div className="mt-6 flex items-center gap-1">
                  <p className="text-lg font-semibold text-slate-900 md:text-xl">
                    {talent?.firstName} {talent?.lastName}
                  </p>
                  {talent?.isPro && (
                    <ProBadge
                      containerClassName="bg-zinc-700 px-2 py-[3px] gap-[3px]"
                      iconClassName="size-2 md:size-2 text-zinc-400"
                      textClassName="text-[8px] md:text-[9px] font-medium text-white"
                    />
                  )}
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
                {user?.id === talent?.id &&
                  renderButton(
                    <SquarePen />,
                    'Edit Profile',
                    handleEditProfileClick,
                  )}
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
                    <span className="text-slate-500">{workPreferenceText}</span>
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
              <FeedLoop
                feed={feedItems}
                isFetchingNextPage={isFetchingNextPage}
                isLoading={isLoading}
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
                  onClick={() => router.push('/')}
                  className="mx-auto mt-2 block w-[200px] border border-slate-400 bg-white font-medium text-slate-500 hover:bg-gray-100"
                  variant="outline"
                >
                  Browse Bounties
                </Button>
              </FeedLoop>
              <div ref={ref} style={{ height: 10 }} />
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
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  try {
    context.res.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=600',
    );

    const username = Array.isArray(slug) ? slug[0] : (slug as string);

    const talent = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        twitter: true,
        linkedin: true,
        github: true,
        website: true,
        username: true,
        workPrefernce: true,
        firstName: true,
        lastName: true,
        skills: true,
        photo: true,
        currentEmployer: true,
        location: true,
        private: true,
        isPro: true,
      },
    });

    if (!talent) {
      return { props: { talent: null } };
    }

    const userId = talent.id;

    const [participations, wins, listingAgg, grantAgg] = await Promise.all([
      prisma.submission.count({ where: { userId } }),
      prisma.submission.count({
        where: {
          userId,
          isWinner: true,
          listing: { isWinnersAnnounced: true },
        },
      }),
      prisma.submission.aggregate({
        where: {
          userId,
          isWinner: true,
          listing: { isWinnersAnnounced: true },
        },
        _sum: { rewardInUSD: true },
      }),
      prisma.grantApplication.aggregate({
        where: {
          userId,
          applicationStatus: { in: ['Approved', 'Completed'] },
        },
        _sum: { approvedAmountInUSD: true },
      }),
    ]);

    const listingWinnings = listingAgg._sum.rewardInUSD || 0;
    const grantWinnings = grantAgg._sum.approvedAmountInUSD || 0;
    const totalWinnings = (listingWinnings || 0) + (grantWinnings || 0);

    const stats = { participations, wins, totalWinnings };

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
