import { useDisclosure } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import type { BountyBasicType } from '@/components/listings/bounty/Createbounty';
import { CreateBounty } from '@/components/listings/bounty/Createbounty';
import type {
  Ques,
  QuestionType,
} from '@/components/listings/bounty/questions/builder';
import { Template } from '@/components/listings/templates/template';
import { SuccessListings } from '@/components/modals/successListings';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { type MultiSelectOptions, tokenList } from '@/constants';
import type { Bounty, References, SuperteamName } from '@/interface/bounty';
import { FormLayout } from '@/layouts/FormLayout';
import { userStore } from '@/store/user';
import { getBountyDraftStatus } from '@/utils/bounty';
import { dayjs } from '@/utils/dayjs';
import { mergeSkills, splitSkills } from '@/utils/skills';

interface Props {
  bounty?: Bounty;
  editable?: boolean;
  type: 'open' | 'permissioned';
  isDuplicating?: boolean;
}

export function CreateListing({
  bounty,
  editable = false,
  type,
  isDuplicating = false,
}: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  // Templates - 1
  // Basic Info - 2
  // Description - 3
  // payment form - 4
  const [steps, setSteps] = useState<number>(editable ? 2 : 1);
  const [listingType, setListingType] = useState('BOUNTY');
  const [draftLoading, setDraftLoading] = useState<boolean>(false);
  const [bountyRequirements, setBountyRequirements] = useState<
    string | undefined
  >(editable ? bounty?.requirements : undefined);
  const [editorData, setEditorData] = useState<string | undefined>(
    editable ? bounty?.description : undefined,
  );
  const [regions, setRegions] = useState<Regions>(
    editable ? bounty?.region || Regions.GLOBAL : Regions.GLOBAL,
  );
  const [referredBy, setReferredBy] = useState<SuperteamName | undefined>(
    editable ? bounty?.referredBy : undefined,
  );
  const skillsInfo = editable ? splitSkills(bounty?.skills || []) : undefined;
  const [mainSkills, setMainSkills] = useState<MultiSelectOptions[]>(
    editable ? skillsInfo?.skills || [] : [],
  );
  const [subSkill, setSubSkill] = useState<MultiSelectOptions[]>(
    editable ? skillsInfo?.subskills || [] : [],
  );
  const [slug, setSlug] = useState<string>('');

  const { isOpen, onOpen } = useDisclosure();

  const [questions, setQuestions] = useState<Ques[]>(
    editable
      ? (bounty?.eligibility || [])?.map((e) => ({
          order: e.order,
          question: e.question,
          type: e.type as QuestionType,
          delete: true,
          label: e.question,
        }))
      : [],
  );

  const [references, setReferences] = useState<References[]>(
    editable
      ? (bounty?.references || [])?.map((e) => ({
          order: e.order,
          link: e.link,
        }))
      : [],
  );

  const [isPrivate, setIsPrivate] = useState<boolean>(
    editable && bounty?.isPrivate ? bounty?.isPrivate : false,
  );

  // - Bounty
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>({
    title: editable
      ? (isDuplicating && bounty?.title
          ? `${bounty.title} (2)`
          : bounty?.title) || undefined
      : undefined,
    deadline:
      !isDuplicating && editable && bounty?.deadline
        ? dayjs(bounty?.deadline).format('YYYY-MM-DDTHH:mm') || undefined
        : undefined,
    templateId: editable ? bounty?.templateId || undefined : undefined,
    pocSocials: editable ? bounty?.pocSocials || undefined : undefined,
    applicationType: editable ? bounty?.applicationType || 'fixed' : 'fixed',
    timeToComplete: editable ? bounty?.timeToComplete || undefined : undefined,
  });
  const [bountyPayment, setBountyPayment] = useState({
    rewardAmount: editable ? bounty?.rewardAmount || 0 : 0,
    token: editable ? bounty?.token : tokenList[0]?.tokenSymbol,
    rewards: editable ? bounty?.rewards || undefined : undefined,
  });

  const [isListingPublishing, setIsListingPublishing] =
    useState<boolean>(false);

  const createAndPublishListing = async () => {
    setIsListingPublishing(true);
    try {
      const newBounty: Bounty = {
        pocId: userInfo?.id ?? '',
        skills: mergeSkills({ skills: mainSkills, subskills: subSkill }),
        ...bountybasic,
        deadline: bountybasic?.deadline
          ? new Date(bountybasic?.deadline).toISOString()
          : undefined,
        description: editorData || '',
        type,
        pocSocials: bountybasic?.pocSocials,
        region: regions,
        referredBy: referredBy,
        eligibility: (questions || []).map((q) => ({
          question: q.question,
          order: q.order,
          type: q.type,
        })),
        references: (references || []).map((r) => ({
          link: r.link,
          order: r.order,
        })),
        requirements: bountyRequirements,
        ...bountyPayment,
        isPublished: true,
        isPrivate: isPrivate,
        publishedAt: new Date().toISOString(),
      };
      let api = '/api/bounties/create';
      if (editable && !isDuplicating) {
        api = `/api/bounties/update/${bounty?.id}/`;
      }
      const result = await axios.post(api, newBounty);
      setSlug(`/bounties/${result?.data?.slug}/`);
      setIsListingPublishing(false);
      onOpen();
      if (!isPrivate) {
        await axios.post('/api/email/manual/createBounty', {
          id: result?.data?.id,
        });
      }
    } catch (e) {
      setIsListingPublishing(false);
    }
  };

  const createDraft = async () => {
    setDraftLoading(true);
    let api = '/api/bounties/create/';
    if (editable && !isDuplicating) {
      api = `/api/bounties/update/${bounty?.id}/`;
    }
    let draft: Bounty = {
      pocId: userInfo?.id ?? '',
    };
    draft = {
      ...draft,
      type,
      skills: mergeSkills({ skills: mainSkills, subskills: subSkill }),
      ...bountybasic,
      deadline: bountybasic?.deadline
        ? new Date(bountybasic?.deadline).toISOString()
        : undefined,
      description: editorData || '',
      eligibility: (questions || []).map((q) => ({
        question: q.question,
        order: q.order,
        type: q.type,
      })),
      references: (references || []).map((r) => ({
        link: r.link,
        order: r.order,
      })),
      pocSocials: bountybasic?.pocSocials,
      region: regions,
      referredBy: referredBy,
      isPrivate: isPrivate,
      requirements: bountyRequirements,
      ...bountyPayment,
    };
    try {
      await axios.post(api, {
        ...draft,
        isPublished: editable && !isDuplicating ? bounty?.isPublished : false,
      });
      router.push('/dashboard/listings');
    } catch (e) {
      setDraftLoading(false);
    }
  };

  const newBounty = bounty?.id === undefined;

  const bountyDraftStatus = getBountyDraftStatus(
    bounty?.status,
    bounty?.isPublished,
  );

  const isNewOrDraft = bountyDraftStatus === 'DRAFT' || newBounty === true;

  return (
    <>
      {!userInfo?.id ||
      !(userInfo?.role === 'GOD' || !!userInfo?.currentSponsorId) ? (
        <ErrorSection
          title="Access is Forbidden!"
          message="Please contact support to access this section."
        />
      ) : (
        <FormLayout
          setStep={setSteps}
          currentStep={steps}
          stepList={
            listingType !== 'BOUNTY'
              ? [
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
                    label: 'Reward',
                    number: 4,
                    mainHead: 'Add the reward amount',
                    description:
                      'Decide the compensation amount for your listing',
                  },
                ]
              : [
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
                    description:
                      'What would you like to know about your applicants?',
                  },
                  {
                    label: 'Reward',
                    number: 5,
                    mainHead: 'Add the reward amount',
                    description:
                      'Decide the compensation amount for your listing',
                  },
                ]
          }
        >
          {isOpen && (
            <SuccessListings slug={slug} isOpen={isOpen} onClose={() => {}} />
          )}
          {steps === 1 && (
            <Template
              setSteps={setSteps}
              setListingType={setListingType}
              setEditorData={setEditorData}
              setSubSkills={setSubSkill}
              setMainSkills={setMainSkills}
              setBountyBasic={setBountyBasic}
              type={type}
            />
          )}
          {steps > 1 && listingType === 'BOUNTY' && (
            <CreateBounty
              type={type}
              regions={regions}
              setRegions={setRegions}
              referredBy={referredBy}
              setReferredBy={setReferredBy}
              setBountyRequirements={setBountyRequirements}
              bountyRequirements={bountyRequirements}
              createAndPublishListing={createAndPublishListing}
              isListingPublishing={isListingPublishing}
              bountyPayment={bountyPayment}
              setBountyPayment={setBountyPayment}
              questions={questions}
              setQuestions={setQuestions}
              references={references}
              setReferences={setReferences}
              draftLoading={draftLoading}
              createDraft={createDraft}
              bountybasic={bountybasic}
              setBountyBasic={setBountyBasic}
              onOpen={onOpen}
              setSubSkills={setSubSkill}
              subSkills={subSkill}
              setMainSkills={setMainSkills}
              mainSkills={mainSkills}
              editorData={editorData}
              setEditorData={setEditorData}
              setSteps={setSteps}
              steps={steps}
              editable={editable}
              isNewOrDraft={isNewOrDraft}
              isDuplicating={isDuplicating}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
            />
          )}
          <Toaster />
        </FormLayout>
      )}
    </>
  );
}
