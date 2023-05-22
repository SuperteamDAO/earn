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
import type {
  DraftType,
  GrantsBasicType,
  JobBasicsType,
} from '@/interface/listings';
import FormLayout from '@/layouts/FormLayout';
import Sidebar from '@/layouts/Sidebar';
import { SponsorStore } from '@/store/sponsor';
import { userStore } from '@/store/user';
import { findOneDraft } from '@/utils/functions';

const CreateListing = () => {
  const router = useRouter();
  const { userInfo } = userStore();
  // Templates - 1
  // Basic Info - 2
  // Description - 3
  // payment form - 4
  const [steps, setSteps] = useState<number>(1);
  const [listingType, setListingType] = useState('BOUNTY');
  const [draftLoading, setDraftLoading] = useState<boolean>(false);
  const [editorData, setEditorData] = useState<string | undefined>();
  //
  const [mainSkills, setMainSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkill, setSubSkill] = useState<MultiSelectOptions[]>([]);
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
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>();
  // -- Grants
  const [grantBasic, setgrantsBasic] = useState<GrantsBasicType | undefined>();
  // -- sponsor
  const { currentSponsor } = SponsorStore();

  const createDraft = async (payment: string) => {
    setDraftLoading(true);
    let api = '/api/bounties/create';
    let draft: DraftType = {
      orgId: currentSponsor?.id ?? '',
      basic: '',
      payments: '',
      type: 'Bounties',
    };
    if (listingType === 'JOB') {
      draft = {
        ...draft,
        basic: JSON.stringify({
          skills: mainSkills,
          subSkill,
          description: JSON.stringify(editorData),
          ...jobBasics,
        }),
        type: 'Jobs',
        payments: payment,
      };
      api = '/api/jobs/create';
    } else if (listingType === 'BOUNTY') {
      draft = {
        ...draft,
        basic: JSON.stringify({
          skills: mainSkills,
          subSkill,
          description: JSON.stringify(editorData),
          ...bountybasic,
        }),
        type: 'Bounties',
        payments: payment,
        question: JSON.stringify(questions),
      };
    } else if (listingType === 'GRANT') {
      draft = {
        ...draft,
        basic: JSON.stringify({
          skills: mainSkills,
          subSkill,
          description: JSON.stringify(editorData),
          ...grantBasic,
        }),
        type: 'Grants',
        payments: payment,
      };
      api = '/api/grants/create';
    }
    console.log('file: index.tsx:110 ~ createDraft ~ draft:', draft);
    try {
      const newDraft = await axios.post(api, {
        ...draft,
        isPublished: false,
      });
      console.log('file: index.tsx:115 ~ createDraft ~ newDraft:', newDraft);
    } catch (e) {
      console.log('file: index.tsx:117 ~ createDraft ~ e:', e);
    }
    // const res = await CreateDraft(draft);
    // if (res) {
    //   toast.success('Draft Saved');
    // } else {
    //   toast.error('Error');
    // }
    setDraftLoading(false);
  };

  useEffect(() => {
    const fetch = async () => {
      if (router.query.draft) {
        try {
          const res = await findOneDraft(router.query.draft as string);
          console.log(res);

          if (res) {
            if ((res.data.type as string).toLowerCase() === 'bounties') {
              console.log(JSON.parse(res.data.basic));
              const data = JSON.parse(res.data.basic);
              setSubSkill(data.subSkill);
              setMainSkills(data.skills);
              setEditorData(JSON.parse(data.description));
              setBountyBasic({
                deadline: data.deadline ?? '',
                eligibility: data.eligibility ?? '',
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
    <Sidebar>
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
                    mainHead: 'Create a listing',
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
                    mainHead: 'Create a listing',
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
    </Sidebar>
  );
};

export default CreateListing;
