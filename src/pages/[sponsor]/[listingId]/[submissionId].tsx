import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { ArrowRight, ChevronLeft, Copy, ExternalLink } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import React, { useEffect, useRef, useState } from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { KycComponent } from '@/components/ui/KycComponent';
import { Tooltip } from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getBountyUrl, getSubmissionUrl } from '@/utils/bounty-urls';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';
import { getURL } from '@/utils/validUrl';

import { Comments } from '@/features/comments/components/Comments';
import {
  LikeAndComment,
  selectedSubmissionAtom,
  sponsorshipSubmissionStatus,
} from '@/features/listings/components/SubmissionsPage/SubmissionTable';
import { type Listing } from '@/features/listings/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { Details } from '@/features/sponsor-dashboard/components/Submissions/Details';
import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

function Content({
  bounty,
  submission: submissionB,
}: {
  bounty: Listing;
  submission: SubmissionWithUser;
}) {
  const [submission, setSubmission] = useState<SubmissionWithUser>(submissionB);
  const commentsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Check if there's a hash in the URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#comments' && commentsRef.current) {
        // Scroll to comments section with a slight delay to ensure rendering is complete
        setTimeout(() => {
          if (commentsRef.current) {
            commentsRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, []);

  const resetSubmission = async () => {
    try {
      const bountyDetails = await api.get(
        `${getURL()}api/listings/submissions/${bounty.slug}`,
      );
      setSubmission(
        bountyDetails.data.submission.find(
          (submission: SubmissionWithUser) => submission.id === submissionB.id,
        ),
      );
    } catch (e) {
      console.log(e);
    }
  };
  const { onCopy: onCopyEmail } = useClipboard(submission?.user?.email || '');

  const { onCopy: onCopyPublicKey } = useClipboard(
    submission?.user?.publicKey || '',
  );

  const [commentCount, setCommentCount] = useState(0);

  const { onCopy: onCopySubmissionLink } = useClipboard(
    getSubmissionUrl(submission, bounty),
  );
  const [, setSelectedSubmission] = useAtom(selectedSubmissionAtom);

  useEffect(() => {
    setSelectedSubmission(submission);
  }, [submission]);

  const handleCopySubmissionLink = () => {
    onCopySubmissionLink();
    toast.success('Submission link copied', {
      duration: 1500,
    });
  };

  const handleCopyEmail = () => {
    if (submission?.user?.email) {
      onCopyEmail();
      toast.success('Email copied', {
        duration: 1500,
      });
    }
  };

  const handleCopyPublicKey = () => {
    if (submission?.user?.publicKey) {
      onCopyPublicKey();
      toast.success('Wallet address copied', {
        duration: 1500,
      });
    }
  };

  const status = sponsorshipSubmissionStatus(submission);

  return (
    <>
      <div className="flex h-full w-full flex-col justify-between">
        <Breadcrumb className="mt-4 text-slate-400 md:mt-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`${getBountyUrl(bounty)}/submission`}
                  className="flex items-center"
                >
                  <ChevronLeft className="mr-1 h-6 w-6" />
                  All Submissions
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 h-full rounded-lg md:mt-4 md:px-2">
          <div className="rounded-t-xl border-b border-slate-200 bg-white">
            <div className="flex w-full items-center justify-between">
              <div className="flex w-full items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={submission?.user?.id}
                  avatar={submission?.user?.photo || undefined}
                />
                <div className="w-full">
                  <div className="flex w-full justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="w-full whitespace-nowrap font-medium text-slate-900">
                        {`${submission?.user?.firstName}'s Submission`}
                      </p>
                      <span
                        className={cn(
                          'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-center text-[10px] capitalize',
                          colorMap[status as keyof typeof colorMap].bg,
                          colorMap[status as keyof typeof colorMap].color,
                        )}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <Link
                    className="flex w-full items-center whitespace-nowrap text-xs font-medium text-black"
                    href={`/t/${submission?.user?.username}`}
                  >
                    View Profile <ArrowRight className="inline-block h-3 w-3" />
                  </Link>
                </div>
                <div className="hidden gap-4 md:flex">
                  <LikeAndComment
                    id={submission?.id}
                    bounty={bounty}
                    submission={submission}
                    setUpdate={resetSubmission}
                    ref={commentsRef}
                  />
                  <Button
                    variant="outline"
                    className="px-2 py-1 text-slate-500"
                    onClick={handleCopySubmissionLink}
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
                {submission?.isWinner &&
                  submission?.winnerPosition &&
                  submission?.isPaid &&
                  submission?.paymentDetails?.link && (
                    <div className="ph-no-capture hidden items-center justify-end gap-2 md:flex">
                      <Button
                        className="text-slate-600"
                        onClick={() => {
                          window.open(
                            submission?.paymentDetails?.link,
                            '_blank',
                          );
                        }}
                        size="default"
                        variant="outline"
                      >
                        <ExternalLink className="mr-1 h-4 w-4" />
                        View Payment
                      </Button>
                    </div>
                  )}

                {submission?.isWinner &&
                  submission?.winnerPosition &&
                  submission?.isPaid &&
                  !submission?.paymentDetails?.link && (
                    <div className="ph-no-capture hidden items-center justify-end gap-2 md:flex">
                      <Button
                        className="text-slate-600"
                        disabled
                        size="default"
                        variant="outline"
                      >
                        Marked as paid
                      </Button>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex flex-col gap-3 py-[1rem] md:flex-row md:items-center md:gap-5">
              {submission?.user?.email && (
                <Tooltip
                  content={'Click to copy'}
                  contentProps={{ side: 'right' }}
                  triggerClassName="flex items-center hover:underline underline-offset-1"
                >
                  <div
                    className="flex cursor-pointer items-center justify-start gap-1 text-sm text-slate-400 hover:text-slate-500"
                    onClick={handleCopyEmail}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy email: ${submission.user.email}`}
                  >
                    <MdOutlineMail />
                    {truncateString(submission.user.email, 36)}
                  </div>
                </Tooltip>
              )}

              {submission?.user?.publicKey && (
                <div className="flex items-center gap-2">
                  <Tooltip
                    content={'Click to copy'}
                    contentProps={{ side: 'right' }}
                    triggerClassName="flex items-center hover:underline underline-offset-1"
                  >
                    <div
                      className="flex cursor-pointer items-center justify-start gap-1 whitespace-nowrap text-sm text-slate-400 hover:text-slate-500"
                      onClick={handleCopyPublicKey}
                      role="button"
                      tabIndex={0}
                      aria-label={`Copy public key: ${truncatePublicKey(submission.user.publicKey, 20)}`}
                    >
                      <MdOutlineAccountBalanceWallet />
                      <p>{truncatePublicKey(submission.user.publicKey, 20)}</p>
                    </div>
                  </Tooltip>
                  <KycComponent address={submission.user.publicKey} xs />
                </div>
              )}
              <div className="flex gap-2">
                <Telegram
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={submission?.user?.telegram || ''}
                />
                <Twitter
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={submission?.user?.twitter || ''}
                />
                <Website
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={submission?.user?.website || ''}
                />
              </div>
              {(bounty?.type === 'project' ||
                bounty?.type === 'sponsorship') && (
                <p className="whitespace-nowrap text-sm text-slate-400">
                  ${formatNumberWithSuffix(submission?.totalEarnings || 0)}{' '}
                  Earned
                </p>
              )}
              {submission?.isPaid && submission?.paymentDate && (
                <div className="flex items-center">
                  <p className="text-sm text-slate-400">
                    Paid on:{' '}
                    {dayjs(submission.paymentDate).format('MMM D, YYYY')}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full border-t border-slate-200">
            <Details
              bounty={bounty}
              atom={selectedSubmissionAtom}
              externalView={true}
            />
          </div>
        </div>
        <div className="md:px-2" ref={commentsRef}>
          <Comments
            isAnnounced={false}
            listingSlug={''}
            listingType={''}
            poc={undefined}
            sponsorId={undefined}
            isVerified={false}
            refId={submission.id}
            refType={'SUBMISSION'}
            count={commentCount}
            setCount={setCommentCount}
            take={2}
          />
        </div>
      </div>
      <div className="ph-no-capture fixed bottom-0 left-1/2 z-50 flex w-full -translate-x-1/2 bg-white px-3 pb-4 pt-2 md:hidden">
        <div className="mb-12 flex h-12 w-full items-center gap-4 text-lg hover:opacity-90 disabled:opacity-70">
          <div>
            <LikeAndComment
              id={submission?.id}
              bounty={bounty}
              submission={submission}
              setUpdate={resetSubmission}
              ref={commentsRef}
            />
          </div>
          <Button
            variant="outline"
            className="w-full text-slate-500"
            onClick={handleCopySubmissionLink}
          >
            <Copy className="mr-1 h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </div>
    </>
  );
}

function SubmissionPage({
  bounty,
  submission,
}: {
  bounty: Listing;
  submission: SubmissionWithUser;
}) {
  return (
    <>
      <div>
        <ListingPageLayout bounty={bounty}>
          <Content bounty={bounty} submission={submission} />
        </ListingPageLayout>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { sponsor, listingId, submissionId } = context.query;
  const sequentialId = parseInt(submissionId as string);

  const session = await getServerSession(context.req, context.res, authOptions);

  let bountyData;
  let slug;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/listings/details/by-sponsor-and-id/${sponsor}/${listingId}`,
      {
        headers: {
          Authorization: `Bearer ${session?.token}`,
          cookie: context.req.headers.cookie,
        },
      },
    );
    slug = bountyDetails.data.slug;
    const submissions = await api.get(
      `${getURL()}api/listings/submissions/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${session?.token}`,
          cookie: context.req.headers.cookie,
        },
      },
    );
    bountyData = submissions.data;
  } catch (e) {
    console.log(e);
    bountyData = null;
  }

  const submission =
    bountyData?.submission.find(
      (submission: SubmissionWithUser) =>
        submission.sequentialId === sequentialId,
    ) ?? null;

  if (!submission) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      slug,
      bounty: bountyData.bounty,
      submission,
    },
  };
};
export default SubmissionPage;
