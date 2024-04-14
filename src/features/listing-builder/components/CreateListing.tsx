import { useDisclosure } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { SurveyModal } from '@/components/Survey';
import { type Bounty, getBountyDraftStatus } from '@/features/listings';
import { userStore } from '@/store/user';

import type { ListingStoreType } from '../types';
import {
  DescriptionBuilder,
  FormLayout,
  ListingBasic,
  ListingPayments,
  QuestionBuilder,
  Template,
} from './ListingBuilder';
import { ListingSuccessModal } from './ListingSuccessModal';
import { hackathonSponsorAtom } from './SelectSponsor';

const listingDescriptionHeadings = [
  'About the Listing & Scope',
  'Rewards',
  'Judging Criteria',
  'Submission Requirements',
  'Resources',
]
  .map((heading) => `<h1 key=${heading}>${heading}</h1>`)
  .join('');

const useFormStore = create<ListingStoreType>()((set) => ({
  form: {
    id: '',
    title: '',
    slug: '',
    deadline: undefined,
    templateId: undefined,
    pocSocials: undefined,
    applicationType: 'fixed',
    timeToComplete: undefined,
    type: undefined,
    region: Regions.GLOBAL,
    referredBy: undefined,
    requirements: '',
    eligibility: [],
    references: [],
    isPrivate: false,
    skills: [],
    description: listingDescriptionHeadings,
    publishedAt: '',
    rewardAmount: undefined,
    rewards: undefined,
    token: 'USDC',
    compensationType: 'fixed',
    minRewardAsk: undefined,
    maxRewardAsk: undefined,
  },
  updateState: (data) => {
    set((state) => {
      state.form = { ...state.form, ...data };
      return { ...state };
    });
  },
}));

interface Props {
  listing?: Bounty;
  editable?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
  prevStep?: number;
}

export function CreateListing({
  listing,
  editable = false,
  type,
  isDuplicating = false,
  prevStep,
}: Props) {
  const router = useRouter();
  const { userInfo } = userStore();

  const bountyDraftStatus = getBountyDraftStatus(
    listing?.status,
    listing?.isPublished,
  );

  const newBounty = listing?.id === undefined;
  const [isDraftLoading, setIsDraftLoading] = useState<boolean>(false);

  const createAndPublishListing = async () => {
    setIsListingPublishing(true);
    try {
      const newBounty: Bounty = {
        pocId: userInfo?.id ?? '',
        skills: form?.skills,
        title: form?.title,
        slug: form?.slug,
        deadline: form?.deadline
          ? new Date(form?.deadline).toISOString()
          : undefined,
        templateId: form?.templateId,
        pocSocials: form?.pocSocials,
        applicationType: form?.applicationType,
        timeToComplete: form?.timeToComplete,

        description: form?.description || '',
        type,
        region: form?.region,
        referredBy: form?.referredBy,
        eligibility: (form?.eligibility || []).map((q) => ({
          question: q.question,
          order: q.order,
          type: q.type,
        })),
        references: (form?.references || []).map((r) => ({
          link: r.link,
          order: r.order,
        })),
        requirements: form?.requirements,
        rewardAmount: form?.rewardAmount,
        rewards: form?.rewards,
        token: form?.token,
        compensationType: form?.compensationType,
        minRewardAsk: form?.minRewardAsk,
        maxRewardAsk: form?.maxRewardAsk,
        isPublished: true,
        isPrivate: form?.isPrivate,
        publishedAt: new Date().toISOString(),
      };

      let api = `/api/${basePath}/create`;
      if (editable && !isDuplicating) {
        api = `/api/${basePath}/update/${listing?.id}/`;
      }
      const result = await axios.post(api, {
        ...newBounty,
        ...(type === 'hackathon' ? { hackathonSponsor } : {}),
      });
      setSlug(`/${result?.data?.type}/${result?.data?.slug}/`);
      setIsListingPublishing(false);
      onOpen();
      if (!userInfo?.surveysShown || !(surveyId in userInfo.surveysShown)) {
        onSurveyOpen();
      }
    } catch (e) {
      setIsListingPublishing(false);
    }
  };

  const createDraft = async () => {
    setIsDraftLoading(true);

    let api = `/api/${basePath}/create`;
    if (editable && !isDuplicating) {
      api = `/api/${basePath}/update/${listing?.id}/`;
    }
    let draft: Bounty = {
      pocId: userInfo?.id ?? '',
    };
    draft = {
      ...draft,
      type,
      skills: form?.skills,
      title: form?.title,
      slug: form?.slug,
      deadline: form?.deadline
        ? new Date(form?.deadline).toISOString()
        : undefined,
      templateId: form?.templateId,
      pocSocials: form?.pocSocials,
      applicationType: form?.applicationType,
      timeToComplete: form?.timeToComplete,
      description: form?.description || '',
      eligibility: (form?.eligibility || []).map((q) => ({
        question: q.question,
        order: q.order,
        type: q.type,
      })),
      references: (form?.references || []).map((r) => ({
        link: r.link,
        order: r.order,
      })),
      region: form?.region,
      referredBy: form?.referredBy,
      isPrivate: form?.isPrivate,
      requirements: form?.requirements,
      rewardAmount: form?.rewardAmount,
      rewards: form?.rewards,
      token: form?.token,
      compensationType: form?.compensationType,
      minRewardAsk: form?.minRewardAsk,
      maxRewardAsk: form?.maxRewardAsk,
    };
    try {
      await axios.post(api, {
        ...(type === 'hackathon' ? { hackathonSponsor } : {}),
        ...draft,
        isPublished: editable && !isDuplicating ? listing?.isPublished : false,
      });
      if (type === 'hackathon') {
        router.push(`/dashboard/hackathon/`);
      } else {
        router.push('/dashboard/listings');
      }
    } catch (e) {
      setIsDraftLoading(false);
    }
  };

  const { form, updateState } = useFormStore();

  if (editable) {
    updateState({
      ...form,
      id: '',
      title:
        isDuplicating && listing?.title
          ? `${listing.title} (2)`
          : listing?.title,
      slug:
        isDuplicating && listing?.slug ? `${listing.slug}-2` : listing?.slug,
      deadline:
        !isDuplicating && listing?.deadline
          ? dayjs(listing?.deadline).format('YYYY-MM-DDTHH:mm') || undefined
          : undefined,
      templateId: listing?.templateId,
      pocSocials: listing?.pocSocials,
      applicationType: listing?.applicationType || 'fixed',
      timeToComplete: listing?.timeToComplete,
      type: type,
      region: listing?.region,
      referredBy: listing?.referredBy,
      requirements: listing?.requirements,
      eligibility: (listing?.eligibility || [])?.map((e) => ({
        order: e.order,
        question: e.question,
        type: e.type as 'text',
        delete: true,
        label: e.question,
      })),
      references: (listing?.references || [])?.map((e) => ({
        order: e.order,
        link: e.link,
      })),
      isPrivate: listing?.isPrivate ? listing?.isPrivate : false,
      skills: listing?.skills,
      description: listing?.description,
      publishedAt: listing?.publishedAt,
      rewardAmount: listing?.rewardAmount || 0,
      rewards: listing?.rewards || undefined,
      token: listing?.token || 'USDC',
      compensationType: listing?.compensationType,
      minRewardAsk: listing?.minRewardAsk || 0,
      maxRewardAsk: listing?.maxRewardAsk || 0,
    });
  }

  const [steps, setSteps] = useState<number>(
    !!prevStep ? prevStep : editable || type === 'hackathon' ? 2 : 1,
  );

  const [slug, setSlug] = useState<string>('');

  const { isOpen, onOpen } = useDisclosure();

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const [hackathonSponsor, setHackathonSponsor] = useAtom(hackathonSponsorAtom);

  useEffect(() => {
    if (editable && type === 'hackathon' && listing?.sponsorId) {
      setHackathonSponsor(listing?.sponsorId);
    }
  }, [editable]);

  const [isListingPublishing, setIsListingPublishing] =
    useState<boolean>(false);
  let basePath = 'bounties';
  if (type === 'hackathon') {
    basePath = 'hackathon';
  }

  const surveyId = '018c674f-7e49-0000-5097-f2affbdddb0d';
  const isNewOrDraft = bountyDraftStatus === 'DRAFT' || newBounty === true;

  return (
    <>
      {!userInfo?.id || !userInfo?.currentSponsorId ? (
        <ErrorSection
          title="Access is Forbidden!"
          message="Please contact support to access this section."
        />
      ) : (
        <FormLayout
          setStep={setSteps}
          currentStep={steps}
          stepList={[
            {
              label: 'Template',
              number: 1,
              mainHead: 'List your Opportunity',
              description:
                'To save time, check out our ready made templates below. If you already have a listing elsewhere, use "Start from Scratch" and copy/paste your text.',
            },
            {
              label: 'Basics',
              number: 2,
              mainHead: 'Create a Listing',
              description: `Now let's learn a bit more about the work you need completed`,
            },
            {
              label: 'Description',
              number: 3,
              mainHead: 'Tell us some more',
              description:
                'Add more details about the opportunity, submission requirements, reward(s) details, and resources',
            },
            {
              label: 'Questions',
              number: 4,
              mainHead: 'Enter your questions',
              description: 'What would you like to know about your applicants?',
            },
            {
              label: 'Reward',
              number: 5,
              mainHead: 'Add the reward amount',
              description: 'Decide the compensation amount for your listing',
            },
          ]}
        >
          {isOpen && (
            <ListingSuccessModal
              slug={slug}
              isOpen={isOpen}
              onClose={() => {}}
            />
          )}
          {isSurveyOpen && (
            <SurveyModal
              isOpen={isSurveyOpen}
              onClose={onSurveyClose}
              surveyId={surveyId}
            />
          )}
          {steps === 1 && (
            <Template
              useFormStore={useFormStore}
              type={type}
              setSteps={setSteps}
            />
          )}
          {steps === 2 && (
            <ListingBasic
              useFormStore={useFormStore}
              editable={editable}
              isDraftLoading={isDraftLoading}
              setSteps={setSteps}
              type={type}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
              createDraft={createDraft}
            />
          )}
          {steps === 3 && (
            <DescriptionBuilder
              createDraft={createDraft}
              setSteps={setSteps}
              useFormStore={useFormStore}
              editable={editable}
              isDraftLoading={isDraftLoading}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
              type={type}
            />
          )}
          {steps === 4 && (
            <QuestionBuilder
              createDraft={createDraft}
              draftLoading={isDraftLoading}
              editable={editable}
              setSteps={setSteps}
              useFormStore={useFormStore}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
            />
          )}

          {steps === 5 && (
            <ListingPayments
              useFormStore={useFormStore}
              createAndPublishListing={createAndPublishListing}
              createDraft={createDraft}
              isDraftLoading={isDraftLoading}
              editable={editable}
              isListingPublishing={isListingPublishing}
              type={type}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
            />
          )}
        </FormLayout>
      )}
    </>
  );
}
