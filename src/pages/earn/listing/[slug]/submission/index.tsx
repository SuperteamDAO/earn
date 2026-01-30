import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import type { SubmissionWithUser } from '@/interface/submission';
import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { getSubmissionsData } from '@/pages/api/listings/submissions/[slug]';

import { SubmissionList } from '@/features/listings/components/SubmissionsPage/SubmissionList';
import { type Listing } from '@/features/listings/types';

const SubmissionPage = ({
  slug,
  bounty,
  submission: initialSubmission,
}: {
  slug: string;
  bounty: Listing;
  submission: SubmissionWithUser[];
}) => {
  const { data: submissions = initialSubmission, refetch } = useQuery({
    queryKey: ['listing-submissions', slug],
    queryFn: async () => {
      const res = await api.get(`/api/listings/submissions/${slug}`);
      return res.data.submission as SubmissionWithUser[];
    },
    initialData: initialSubmission,
    staleTime: 1000 * 60,
  });

  return (
    <ListingPageLayout listing={bounty}>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>
      {bounty && submissions && (
        <SubmissionList
          bounty={bounty}
          onUpdate={refetch}
          submissions={submissions}
          endTime={bounty.deadline as string}
        />
      )}
    </ListingPageLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  try {
    const { bounty, submission } = await getSubmissionsData(slug as string);

    if (!bounty) {
      return {
        props: {
          slug,
          bounty: null,
          submission: [],
        },
      };
    }

    return {
      props: {
        slug,
        bounty: JSON.parse(JSON.stringify(bounty)),
        submission: JSON.parse(JSON.stringify(submission)),
      },
    };
  } catch (e) {
    console.log(e);
    return {
      props: {
        slug,
        bounty: null,
        submission: [],
      },
    };
  }
};

export default SubmissionPage;
