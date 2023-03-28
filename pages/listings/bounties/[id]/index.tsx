import { Box, HStack, list, useDisclosure, VStack } from '@chakra-ui/react';
import {
  dehydrate,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Comments } from '../../../../components/listings/listings/comments';
import { DetailDescription } from '../../../../components/listings/listings/details/detailDescription';
import { DetailSideCard } from '../../../../components/listings/listings/details/detailSideCard';
import { ListingHeader } from '../../../../components/listings/listings/ListingHeader';
import { Submission } from '../../../../components/listings/listings/submissions/submission';
import { CreateProfileModal } from '../../../../components/modals/createProfile';
import { PrizeListType } from '../../../../interface/listings';
import { SponsorType } from '../../../../interface/sponsor';
import { TalentStore } from '../../../../store/talent';
import { GetServerSideProps } from 'next';
import {
  createSubmission,
  fetchComments,
  fetchOgImage,
  findBouties,
} from '../../../../utils/functions';
import { genrateuuid } from '../../../../utils/helpers';
import { SubmissionSuccess } from '../../../../components/modals/SubmissionSuccess';
import { useState } from 'react';
// import TalentBio from '../../../components/TalentBio';

const defalutSponsor: SponsorType = {
  bio: '',
  email: '',
  industry: '',
  logo: '',
  name: 'default',
  publickey: '',
  twitter: '',
  type: 'Admin',
  url: '',
  username: '',
  verified: false,
  id: '',
  orgId: '',
};

const Bounties = () => {
  const router = useRouter();
  const [subID, setSubID] = useState<string>('');
  const { onOpen, isOpen, onClose } = useDisclosure();
  const { talentInfo } = TalentStore();
  const queryClient = useQueryClient();

  const listingInfo = useQuery(['bounties', router.query.id], () =>
    findBouties(router.query.id as string)
  );
  let total = 0;
  const prizes = Object.values(
    (listingInfo.data?.listing.prizeList as PrizeListType) ?? {}
  );
  prizes.forEach((el) => {
    total += Number(el);
  });
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
      link: link,
      bountiesId: listingInfo.data?.listing.id ?? '',
      talent: talentInfo?.id ?? '',
      questions: JSON.stringify(questions ?? []),
    });
    if (submissionRes) {
      setSubID(submissionRes.data?.id ?? '');
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
        maxW={'7xl'}
        mx={'auto'}
        align={['center', 'center', 'start', 'start']}
        gap={4}
        flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
        justify={['center', 'center', 'space-between', 'space-between']}
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
          total={total}
        />
      </HStack>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { id } = context.query;

  let isError = false;
  try {
    const res = await queryClient.fetchQuery(['bounties', id], () =>
      findBouties(id as string)
    );
    console.log(res);
    await queryClient.prefetchQuery(['comments', res?.listing.id], () =>
      fetchComments(res?.listing.id as string)
    );
  } catch (error) {
    isError;
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default Bounties;
