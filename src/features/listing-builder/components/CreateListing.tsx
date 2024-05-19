import { useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { SurveyModal } from '@/components/Survey';
import { type MultiSelectOptions } from '@/constants';
import { type Bounty, getListingDraftStatus } from '@/features/listings';
import { userStore } from '@/store/user';

import { useListingFormStore } from '../store';
import { type ListingFormType } from '../types';
import { splitSkills } from '../utils';
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

interface Props {
  listing?: Bounty;
  editable?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
  prevStep?: number;
}

const defaultStepList = [
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
];

export function CreateListing({
  listing,
  editable = false,
  type,
  isDuplicating = false,
  prevStep,
}: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  const { form, updateState } = useListingFormStore();

  const listingDraftStatus = getListingDraftStatus(
    listing?.status,
    listing?.isPublished,
  );

  const newListing = listing?.id === undefined;
  const [isDraftLoading, setIsDraftLoading] = useState<boolean>(false);

  const skillsInfo = editable ? splitSkills(listing?.skills || []) : undefined;
  const [skills, setSkills] = useState<MultiSelectOptions[]>(
    editable ? skillsInfo?.skills || [] : [],
  );
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>(
    editable ? skillsInfo?.subskills || [] : [],
  );

  const [steps, setSteps] = useState<number>(
    !!prevStep ? prevStep : editable || type === 'hackathon' ? 2 : 1,
  );

  const [slug, setSlug] = useState<string>('');

  const [isListingPublishing, setIsListingPublishing] =
    useState<boolean>(false);

  const { isOpen, onOpen } = useDisclosure();

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const [hackathonSponsor, setHackathonSponsor] = useAtom(hackathonSponsorAtom);

  const basePath = type === 'hackathon' ? 'hackathon' : 'bounties';
  const surveyId = '018c674f-7e49-0000-5097-f2affbdddb0d';
  const isNewOrDraft = listingDraftStatus === 'DRAFT' || newListing === true;

  useEffect(() => {
    if (editable && !!listing) {
      updateState({
        id: listing.id,
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
        isPrivate: listing?.isPrivate,
        skills: listing?.skills,
        description: listing?.description,
        publishedAt: listing?.publishedAt || undefined,
        rewardAmount: listing?.rewardAmount || undefined,
        rewards: listing?.rewards || undefined,
        token: listing?.token || 'USDC',
        compensationType: listing?.compensationType,
        minRewardAsk: listing?.minRewardAsk || undefined,
        maxRewardAsk: listing?.maxRewardAsk || undefined,
      });
    }
  }, [editable, listing, isDuplicating]);

  useEffect(() => {
    if (editable && type === 'hackathon' && listing?.sponsorId) {
      setHackathonSponsor(listing?.sponsorId);
    }
  }, [editable]);

  const createAndPublishListing = async () => {
    setIsListingPublishing(true);
    try {
      const newListing: Bounty = {
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
        ...newListing,
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

  const createDraft = async (data: ListingFormType) => {
    setIsDraftLoading(true);

    let api = `/api/${basePath}/create`;
    if (editable && !isDuplicating) {
      api = `/api/${basePath}/update/${listing?.id}/`;
    }
    let draft: Bounty = {
      pocId: userInfo?.id ?? '',
    };
    try {
      draft = {
        ...draft,
        type,
        skills: data?.skills,
        title: data?.title,
        slug: data?.slug,
        deadline: data?.deadline
          ? new Date(data?.deadline).toISOString()
          : undefined,
        templateId: data?.templateId,
        pocSocials: data?.pocSocials,
        applicationType: data?.applicationType,
        timeToComplete: data?.timeToComplete,
        description: data?.description || '',
        eligibility: (data?.eligibility || []).map((q) => ({
          question: q.question,
          order: q.order,
          type: q.type,
        })),
        references: (data?.references || []).map((r) => ({
          link: r.link,
          order: r.order,
        })),
        region: data?.region,
        referredBy: data?.referredBy,
        isPrivate: data?.isPrivate,
        requirements: data?.requirements,
        rewardAmount: data?.rewardAmount,
        rewards: data?.rewards,
        token: data?.token,
        compensationType: data?.compensationType,
        minRewardAsk: data?.minRewardAsk,
        maxRewardAsk: data?.maxRewardAsk,
      };

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

  const getStepList = (type: string) => {
    const filteredStepList =
      type === 'project'
        ? defaultStepList
        : defaultStepList.filter((step) => step.number !== 4);
    return filteredStepList.map((step, index) => ({
      ...step,
      number: index + 1,
    }));
  };

  const stepList = getStepList(type);

  const showPayments =
    (type === 'project' && steps === 5) || (type !== 'project' && steps === 4);

  return (
    <>
      {!userInfo?.id || !userInfo?.currentSponsorId ? (
        <ErrorSection
          title="Access is Forbidden!"
          message="Please contact support to access this section."
        />
      ) : (
        <FormLayout setStep={setSteps} currentStep={steps} stepList={stepList}>
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
              type={type}
              setSteps={setSteps}
              setSubSkills={setSubSkills}
              setSkills={setSkills}
            />
          )}
          {steps === 2 && (
            <ListingBasic
              editable={editable}
              isDraftLoading={isDraftLoading}
              setSteps={setSteps}
              type={type}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
              createDraft={createDraft}
              skills={skills}
              subSkills={subSkills}
              setSubSkills={setSubSkills}
              setSkills={setSkills}
            />
          )}
          {steps === 3 && (
            <DescriptionBuilder
              createDraft={createDraft}
              setSteps={setSteps}
              editable={editable}
              isDraftLoading={isDraftLoading}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
              type={type}
            />
          )}
          {type === 'project' && steps === 4 && (
            <QuestionBuilder
              createDraft={createDraft}
              draftLoading={isDraftLoading}
              editable={editable}
              setSteps={setSteps}
              isDuplicating={isDuplicating}
              isNewOrDraft={isNewOrDraft}
            />
          )}

          {showPayments && (
            <ListingPayments
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
