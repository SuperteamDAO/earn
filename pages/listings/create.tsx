import { Flex, useDisclosure } from '@chakra-ui/react';
import FormLayout from '../../layouts/FormLayout';
import {
  BountyBasicType,
  Createbounty,
} from '../../components/listings/bounty/Createbounty';
import { useEffect, useState } from 'react';
import { CreateJob } from '../../components/listings/jobs/CreateJob';
// import { Description } from '../../components/listings/description';
import dynamic from 'next/dynamic';
import Template from '../../components/listings/templates/template';
import { MultiSelectOptions } from '../../constants';
import { useRouter } from 'next/router';
import {
  DraftType,
  GrantsBasicType,
  JobBasicsType,
} from '../../interface/listings';
import { CreateGrants } from '../../components/listings/grants/CreateGrants';
import { SuccessListings } from '../../components/modals/successListings';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '../../layouts/connectWallet';
import { SponsorStore } from '../../store/sponsor';
import { CreateSponsorModel } from '../../components/modals/createSponsor';
import { useQuery } from '@tanstack/react-query';
import { CreateDraft, findOneDraft, findSponsors } from '../../utils/functions';
import { userStore } from '../../store/user';
import { genrateuuid } from '../../utils/helpers';
import axios from 'axios';
import toast, { ToastBar, Toaster } from 'react-hot-toast';

const CreateListing = () => {
  // Templates - 1
  // Basic Info - 2
  // Description - 3
  // payment form - 4
  const [steps, setSteps] = useState<number>(1);
  const router = useRouter();
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

  //- Bounty
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>();
  // -- Grants
  const [grantBasic, setgrantsBasic] = useState<GrantsBasicType | undefined>();
  const { connected, publicKey } = useWallet();
  const { currentSponsor } = SponsorStore();
  const { userInfo } = userStore();
  const sponsors = useQuery({
    queryKey: ['sponsor', publicKey?.toBase58() ?? ''],
    queryFn: ({ queryKey }) => findSponsors(queryKey[1]),
  });

  const createDraft = async (payment: string) => {
    setDraftLoading(true);
    let draft: DraftType = {
      id: genrateuuid(),
      orgId: currentSponsor?.orgId ?? '',
      basic: '',
      payments: '',
      type: 'Bounties',
    };
    if (router.query.type === 'jobs') {
      draft = {
        ...draft,
        basic: JSON.stringify({
          skills: mainSkills,
          subSkill: subSkill,
          description: JSON.stringify(editorData),
          ...jobBasics,
        }),
        type: 'Jobs',
        payments: payment,
      };
    } else if (router.query.type === 'bounties') {
      draft = {
        ...draft,
        basic: JSON.stringify({
          skills: mainSkills,
          subSkill: subSkill,
          description: JSON.stringify(editorData),
          ...bountybasic,
        }),
        type: 'Bounties',
        payments: payment,
      };
    } else if (router.query.type === 'grants') {
      draft = {
        ...draft,
        basic: JSON.stringify({
          skills: mainSkills,
          subSkill: subSkill,
          description: JSON.stringify(editorData),
          ...grantBasic,
        }),
        type: 'Grants',
        payments: payment,
      };
    }
    const res = await CreateDraft(draft);
    if (res) {
      toast.success('Draft Saved');
    } else {
      toast.error('Error');
    }
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
      {connected ? (
        <FormLayout
          sponsors={sponsors.data}
          setStep={setSteps}
          currentStep={steps}
          stepList={[
            {
              label: 'Template',
              number: 1,
              description:
                'To save time, check out our ready made templates below. If you already have a listing elsewhere, use "Start from Scratch" and copy/paste your text.',
            },
            {
              label: 'Basics',
              number: 2,
              description: `Now let's learn a bit more about the work you need completed`,
            },
            {
              label: 'Description',
              number: 3,
              description: 'Create a description',
            },
            {
              label: 'Reward',
              number: 4,
              description: 'Quickly create a listing on the platform',
            },
          ]}
        >
          {!userInfo?.sponsor && (
            <CreateSponsorModel isOpen={true} onClose={() => {}} />
          )}
          {isOpen && (
            <SuccessListings slug={slug} isOpen={isOpen} onClose={() => {}} />
          )}
          {steps === 1 && <Template setSteps={setSteps} />}
          {router.query.type && router.query.type === 'bounties' && (
            <Createbounty
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
          {router.query.type && router.query.type === 'jobs' && (
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
          {router.query.type && router.query.type === 'grants' && (
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
      ) : (
        <ConnectWallet />
      )}
    </>
  );
};

export default CreateListing;
