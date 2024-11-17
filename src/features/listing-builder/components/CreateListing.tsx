import { useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { SurveyModal } from '@/components/shared/Survey';
import { type MultiSelectOptions } from '@/constants';
import { getListingDraftStatus, type Listing } from '@/features/listings';
import { useUser } from '@/store/user';

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
import { PreviewListingModal } from './PreviewListingModal';
import { hackathonSponsorAtom } from './SelectSponsor';
import { UnderVerificationModal } from './UnderVerficationModal';

interface Props {
  listing?: Listing;
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
    description: "Now let's learn a bit more about the work you need completed",
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
  const { user } = useUser();
  const { form, initializeForm } = useListingFormStore();

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
  useEffect(() => {
    setSteps(!!prevStep ? prevStep : editable || type === 'hackathon' ? 2 : 1);
  }, [prevStep]);

  const [slug, setSlug] = useState<string>(listing?.slug ?? '');
  const [isType, setType] = useState<string>(type);

  const [isListingPublishing, setIsListingPublishing] =
    useState<boolean>(false);

  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen } = useDisclosure();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure({
    defaultIsOpen: !!router.query['preview'],
  });
  const { isOpen: isVerifyingOpen, onOpen: onVerifyingOpen } = useDisclosure();

  const {
    isOpen: isSurveyOpen,
    onOpen: onSurveyOpen,
    onClose: onSurveyClose,
  } = useDisclosure();

  const [hackathonSponsor, setHackathonSponsor] = useAtom(hackathonSponsorAtom);

  const basePath = type === 'hackathon' ? 'hackathon' : 'listings';
  const surveyId = '018c674f-7e49-0000-5097-f2affbdddb0d';
  const isNewOrDraft = listingDraftStatus === 'DRAFT' || newListing === true;

  useEffect(() => {
    initializeForm(listing!, isDuplicating, type);
  }, [initializeForm, listing, isDuplicating, type]);

  useEffect(() => {
    if (editable && type === 'hackathon' && listing?.sponsorId) {
      setHackathonSponsor(listing?.sponsorId);
    }
  }, [editable, type, listing?.sponsorId, setHackathonSponsor]);

  const createAndPublishListing = async (closeConfirm: () => void) => {
    setIsListingPublishing(true);
    try {
      const newListing: Listing = {
        pocId: user?.id ?? '',
        skills: form?.skills,
        title: form?.title,
        slug: form?.slug,
        deadline: form?.deadline
          ? new Date(form?.deadline).toISOString()
          : undefined,
        templateId: form?.templateId,
        pocSocials: form?.pocSocials,
        timeToComplete: form?.timeToComplete,
        description: form?.description,
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
        maxBonusSpots: form?.maxBonusSpots,
        token: form?.token,
        compensationType: form?.compensationType,
        minRewardAsk: form?.minRewardAsk,
        maxRewardAsk: form?.maxRewardAsk,
        isPublished: true,
        isPrivate: form?.isPrivate,
        isFndnPaying: form?.isFndnPaying,
        status: 'OPEN',
      };

      let api = `/api/${basePath}/create`;
      if (editable && !isDuplicating) {
        api = `/api/${basePath}/update/${listing?.id}/`;
      }
      const result = await axios.post(api, {
        ...newListing,
        ...(type === 'hackathon' ? { hackathonSponsor } : {}),
      });
      setSlug(result?.data?.slug ?? ('' as string));
      setType(result?.data?.type ?? ('' as string));
      setIsListingPublishing(false);
      closeConfirm();
      if (result?.data.status === 'VERIFYING') {
        onVerifyingOpen();
      } else {
        onSuccessOpen();
      }
      if (
        (!user?.surveysShown || !(surveyId in user.surveysShown)) &&
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
      ) {
        onSurveyOpen();
      }
    } catch (e) {
      setIsListingPublishing(false);
    }
  };

  const createDraft = async (data: ListingFormType, isPreview?: boolean) => {
    setIsDraftLoading(true);

    let api = `/api/${basePath}/create`;
    if (editable && !isDuplicating) {
      api = `/api/${basePath}/update/${listing?.id}/`;
    }
    let draft: Listing = {
      pocId: user?.id ?? '',
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
          title: r.title,
        })),
        region: data?.region,
        referredBy: data?.referredBy,
        isPrivate: data?.isPrivate,
        isFndnPaying: data?.isFndnPaying,
        requirements: data?.requirements,
        rewardAmount: data?.rewardAmount,
        rewards: data?.rewards,
        maxBonusSpots: data?.maxBonusSpots,
        token: data?.token,
        compensationType: data?.compensationType,
        minRewardAsk: data?.minRewardAsk,
        maxRewardAsk: data?.maxRewardAsk,
      };

      const result = await axios.post<Listing>(api, {
        ...(type === 'hackathon' ? { hackathonSponsor } : {}),
        ...draft,
        isPublished: editable && !isDuplicating ? listing?.isPublished : false,
        status: 'OPEN',
      });
      const resType = result.data.type;
      const resSlug = result.data.slug;
      setType(resType || '');
      setSlug(resSlug || '');
      if (isPreview) {
        // window.open(`/listings/${resType}/${resSlug}`, '_blank');
        if (!router.asPath.split('/')[2]?.includes('create')) {
          onPreviewOpen();
        }
        router.replace(
          `/dashboard/listings/${resSlug}/edit?preview=1&nsb=1`,
          undefined,
          { shallow: true },
        );
        setIsDraftLoading(false);
      } else {
        if (type === 'hackathon') {
          router.push(`/dashboard/hackathon/`);
        } else {
          router.push('/dashboard/listings');
        }
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
      {!user?.id || !user?.currentSponsorId ? (
        <ErrorSection
          title="Access is Forbidden!"
          message="Please contact support to access this section."
        />
      ) : (
        <FormLayout setStep={setSteps} currentStep={steps} stepList={stepList}>
          <PreviewListingModal
            isOpen={isPreviewOpen}
            onClose={onPreviewClose}
            previewUrl={`/listings/${isType}/${slug}?preview=1`}
          />
          {isSuccessOpen && (
            <ListingSuccessModal
              type={isType}
              slug={slug}
              isOpen={isSuccessOpen}
              isVerified={user.currentSponsor?.isVerified || false}
              onClose={() => {}}
            />
          )}
          {isVerifyingOpen && (
            <UnderVerificationModal
              isOpen={isVerifyingOpen}
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
              isDraftLoading={isDraftLoading}
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
