import { HStack, useDisclosure, VStack } from '@chakra-ui/react';
import {
  dehydrate,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { Comments } from '../../../../components/listings/listings/comments';
import { DetailDescription } from '../../../../components/listings/listings/details/detailDescription';
import { DetailSideCard } from '../../../../components/listings/listings/details/detailSideCard';
import { ListingHeader } from '../../../../components/listings/listings/ListingHeader';
import { CreateProfileModal } from '../../../../components/modals/createProfile';
import { SubmissionSuccess } from '../../../../components/modals/SubmissionSuccess';
import type { PrizeListType } from '../../../../interface/listings';
import type { SponsorType } from '../../../../interface/sponsor';
import { TalentStore } from '../../../../store/talent';
import {
  createSubmission,
  fetchComments,
  fetchOgImage,
  findBouties,
} from '../../../../utils/functions';
import { genrateuuid } from '../../../../utils/helpers';
// import TalentBio from '../../../components/TalentBio';

const defalutSponsor: SponsorType = {
  bio: '',
  industry: '',
  logo: '',
  name: 'default',
  twitter: '',
  url: '',
  username: '',
  id: '',
};

const Bounties = () => {
  const router = useRouter();
  const { onOpen, isOpen, onClose } = useDisclosure();
  const { talentInfo } = TalentStore();
  const queryClient = useQueryClient();

  const listingInfo = useQuery(['bounties', router.query.id], () =>
    findBouties(router.query.id as string)
  );
  const {
    isOpen: submissionisOpen,
    onClose: submissiononClose,
    onOpen: submissiononOpen,
  } = useDisclosure();

  const {
    isOpen: submissionSuccisOpen,
    onClose: submissionSucconClose,
    onOpen: submissionSucconOpen,
  } = useDisclosure();

  const onSubmit = async ({
    link,
    questions,
  }: {
    link: string;
    questions: string;
  }) => {
    const res = await fetchOgImage(link);

    const submissionRes = await createSubmission({
      id: genrateuuid(),
      image: res.data?.ogImage?.url ?? '',
      likes: JSON.stringify([]),
      link,
      bountiesId: listingInfo.data?.listing.id ?? '',
      talent: talentInfo?.id ?? '',
      questions: JSON.stringify(questions ?? []),
    });
    if (submissionRes) {
      submissiononClose();
      submissionSucconOpen();
    }
  };
  const SubmssionMutation = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      queryClient.invalidateQueries(['bounties', router.query.id ?? '']);
      toast.success('commented');
    },
    onError: (e: any) => {
      console.log(e);

      toast.success('Error occur while commenting');
    },
  });

  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
            canonical="/assets/logo/og.svg"
          />
        }
      >
        {submissionSuccisOpen && (
          <SubmissionSuccess
            eligibility={listingInfo.data?.listing.eligibility as string}
            isOpen={submissionSuccisOpen}
            onClose={submissionSucconClose}
          />
        )}
        {isOpen && <CreateProfileModal isOpen={isOpen} onClose={onClose} />}
        <ListingHeader
          eligibility={listingInfo.data?.listing.eligibility as any}
          endTime={listingInfo.data?.listing.deadline ?? ''}
          sub={listingInfo.data?.listing.subscribe}
          id={listingInfo.data?.listing.id as string}
          tabs={true}
          title={listingInfo.data?.listing?.title ?? ''}
          sponsor={
            listingInfo.data?.sponsor
              ? (listingInfo.data?.sponsor as SponsorType)
              : defalutSponsor
          }
        />

        <HStack
          align={['center', 'center', 'start', 'start']}
          justify={['center', 'center', 'space-between', 'space-between']}
          flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
          gap={4}
          maxW={'7xl'}
          mx={'auto'}
        >
          <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={10}>
            <DetailDescription
              skills={
                JSON.parse(listingInfo.data?.listing.skills as string) ?? []
              }
              description={
                (listingInfo.data?.listing.description as string) ?? ''
              }
            />
            <Comments
              refId={listingInfo.data?.listing.id ?? ''}
              onOpen={onOpen}
            />
          </VStack>
          <DetailSideCard
            token={listingInfo.data?.listing.token as string}
            eligibility={listingInfo.data?.listing.eligibility as string}
            questions={
              listingInfo.data?.listing.Questions?.questions ??
              JSON.stringify('[]')
            }
            submissionisOpen={submissionisOpen}
            submissiononClose={submissiononClose}
            submissiononOpen={submissiononOpen}
            submissionNumber={listingInfo.data?.listing.submission?.length ?? 0}
            SubmssionMutation={SubmssionMutation}
            endingTime={listingInfo.data?.listing.deadline ?? ''}
            onOpen={onOpen}
            prizeList={
              (listingInfo.data?.listing.prizeList as PrizeListType) ?? {}
            }
            total={parseInt(listingInfo.data?.listing.amount as string, 10)}
          />
        </HStack>
      </Default>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { id } = context.query;

  try {
    const res = await queryClient.fetchQuery(['bounties', id], () =>
      findBouties(id as string)
    );
    console.log(res);
    await queryClient.prefetchQuery(['comments', res?.listing.id], () =>
      fetchComments(res?.listing.id as string)
    );
  } catch (error) {
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default Bounties;
