import { useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import type { BountyBasicType } from '@/components/listings/bounty/Createbounty';
import { CreateBounty } from '@/components/listings/bounty/Createbounty';
import type { Ques } from '@/components/listings/bounty/questions/builder';
import { CreateGrants } from '@/components/listings/grants/CreateGrants';
import { CreateJob } from '@/components/listings/jobs/CreateJob';
import Template from '@/components/listings/templates/template';
import { SuccessListings } from '@/components/modals/successListings';
import ErrorSection from '@/components/shared/ErrorSection';
import type { MultiSelectOptions } from '@/constants';
import type { Bounty } from '@/interface/bounty';
import type { GrantsBasicType, JobBasicsType } from '@/interface/listings';
import FormLayout from '@/layouts/FormLayout';
import { userStore } from '@/store/user';
import { findOneDraft } from '@/utils/functions';
import { mergeSkills, splitSkills } from '@/utils/skills';

interface Props {
  bounty?: Bounty;
  isEditMode?: boolean;
}

function CreateListing({ bounty, isEditMode = false }: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  // Templates - 1
  // Basic Info - 2
  // Description - 3
  // payment form - 4
  const [steps, setSteps] = useState<number>(isEditMode ? 2 : 1);
  const [listingType, setListingType] = useState('BOUNTY');
  const [draftLoading, setDraftLoading] = useState<boolean>(false);
  const [editorData, setEditorData] = useState<string | undefined>(
    isEditMode ? bounty?.description : undefined
  );

  const skillsInfo = isEditMode ? splitSkills(bounty?.skills || []) : undefined;
  //
  const [mainSkills, setMainSkills] = useState<MultiSelectOptions[]>(
    isEditMode ? skillsInfo?.skills || [] : []
  );
  const [subSkill, setSubSkill] = useState<MultiSelectOptions[]>(
    isEditMode ? skillsInfo?.subskills || [] : []
  );
  const [slug, setSlug] = useState<string>('');
  //
  const { isOpen, onOpen } = useDisclosure();
  // -- Jobs
  const [jobBasics, setJobBasics] = useState<JobBasicsType | undefined>({
    deadline: '',
    link: '',
    title: '',
    type: 'fulltime',
  });

  const [questions, setQuestions] = useState<Ques[]>([]);

  // - Bounty
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>({
    title: isEditMode ? bounty?.title || undefined : undefined,
    slug: isEditMode ? bounty?.slug || undefined : undefined,
    deadline:
      isEditMode && bounty?.deadline
        ? new Date(bounty?.deadline).toISOString().slice(0, 16) || undefined
        : undefined,
    type: isEditMode ? bounty?.type || undefined : undefined,
  });
  const [bountyPayment, setBountyPayment] = useState({
    rewardAmount: 0,
    token: undefined,
    rewards: undefined,
  });
  // -- Grants
  const [grantBasic, setgrantsBasic] = useState<GrantsBasicType | undefined>();

  const [isListingPublishing, setIsListingPublishing] =
    useState<boolean>(false);

  const createAndPublishListing = async () => {
    setIsListingPublishing(true);
    try {
      const newBounty: Bounty = {
        sponsorId: userInfo?.currentSponsor?.id ?? '',
        pocId: userInfo?.id ?? '',
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
        ...bountyPayment,
        isPublished: true,
      };
      const result = await axios.post('/api/bounties/create/', newBounty);
      setSlug(`/bounties/${result?.data?.slug}/`);
      onOpen();
      setIsListingPublishing(false);
    } catch (e) {
      setIsListingPublishing(false);
    }
  };

  const createDraft = async () => {
    setDraftLoading(true);
    const api = '/api/bounties/create/';
    let draft: Bounty = {
      sponsorId: userInfo?.currentSponsor?.id ?? '',
      pocId: userInfo?.id ?? '',
    };
    draft = {
      ...draft,
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
      ...bountyPayment,
    };
    try {
      await axios.post(api, {
        ...draft,
        isPublished: false,
      });
      router.push('/dashboard/bounties');
    } catch (e) {
      setDraftLoading(false);
    }
    setDraftLoading(false);
  };

  useEffect(() => {
    const fetch = async () => {
      if (router.query.draft) {
        try {
          const res = await findOneDraft(router.query.draft as string);
          if (res) {
            if ((res.data.type as string).toLowerCase() === 'bounties') {
              const data = JSON.parse(res.data.basic);
              setSubSkill(data.subSkill);
              setMainSkills(data.skills);
              setEditorData(JSON.parse(data.description));
              setBountyBasic({
                deadline: data.deadline ?? '',
                type: data.type ?? '',
                title: data.title ?? '',
                slug: data.slug ?? '',
              });
            } else if ((res.data.type as string).toLowerCase() === 'jobs') {
              const data = JSON.parse(res.data.basic);
              setSubSkill(data.subSkill);
              setMainSkills(data.skills);
              setEditorData(JSON.parse(data.description));
              setJobBasics({
                deadline: data.deadline ?? '',
                link: data.link ?? '',
                title: data.title ?? '',
                type: data.type ?? 'fulltime',
              });
            } else if ((res.data.type as string).toLowerCase() === 'grants') {
              const data = JSON.parse(res.data.basic);
              setSubSkill(data.subSkill);
              setMainSkills(data.skills);
              setEditorData(JSON.parse(data.description));
              setgrantsBasic({
                contact: data.contact,
                title: data.title,
                link: data.link,
              });
            }
            setSteps(2);
          }
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetch();
  }, [router.query.draft]);

  return (
    <>
      {!userInfo?.id || userInfo?.role !== 'GOD' ? (
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
            <Template setSteps={setSteps} setListingType={setListingType} />
          )}
          {steps > 1 && listingType === 'BOUNTY' && (
            <CreateBounty
              createAndPublishListing={createAndPublishListing}
              isListingPublishing={isListingPublishing}
              setBountyPayment={setBountyPayment}
              questions={questions}
              setQuestions={setQuestions}
              setSlug={setSlug}
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
            />
          )}
          {steps > 1 && listingType === 'JOB' && (
            <CreateJob
              setSlug={setSlug}
              draftLoading={draftLoading}
              createDraft={createDraft}
              setJobBasic={setJobBasics}
              jobBasics={jobBasics}
              setSubSkills={setSubSkill}
              subSkills={subSkill}
              setMainSkills={setMainSkills}
              mainSkills={mainSkills}
              editorData={editorData}
              setEditorData={setEditorData}
              setSteps={setSteps}
              steps={steps}
              onOpen={onOpen}
            />
          )}
          {steps > 1 && listingType === 'GRANT' && (
            <CreateGrants
              createDraft={createDraft}
              onOpen={onOpen}
              setSlug={setSlug}
              grantBasic={grantBasic}
              setGrantBasic={setgrantsBasic}
              setSubSkills={setSubSkill}
              subSkills={subSkill}
              setMainSkills={setMainSkills}
              mainSkills={mainSkills}
              editorData={editorData}
              setEditorData={setEditorData}
              setSteps={setSteps}
              steps={steps}
            />
          )}
          <Toaster />
        </FormLayout>
      )}
    </>
  );
}

export default CreateListing;
