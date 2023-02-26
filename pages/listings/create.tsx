import { Flex, useDisclosure } from '@chakra-ui/react';
import FormLayout from '../../layouts/FormLayout';
import { Createbounty } from '../../components/listings/bounty/Createbounty';
import { useState } from 'react';
import { CreateJob } from '../../components/listings/jobs/CreateJob';
// import { Description } from '../../components/listings/description';
import dynamic from 'next/dynamic';
import { OutputData } from '@editorjs/editorjs';
import Template from '../../components/listings/templates/template';
import { MultiSelectOptions } from '../../constants';
import { useRouter } from 'next/router';
import { JobBasicsType } from '../../interface/listings';
import { CreateGrants } from '../../components/listings/grants/CreateGrants';
import { SuccessListings } from '../../components/modals/successListings';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '../../layouts/connectWallet';
import { SponsorStore } from '../../store/sponsor';
import { CreateSponsorModel } from '../../components/modals/createSponsor';
import { useQuery } from '@tanstack/react-query';
import { findSponsors } from '../../utils/functions';
const Description = dynamic(
  () => import('../../components/listings/description'),
  {
    ssr: false,
  }
);

const CreateListing = () => {
  // Templates - 1
  // Basic Info - 2
  // Description - 3
  // payment form - 4
  const [steps, setSteps] = useState<number>(1);
  const router = useRouter();
  const [editorData, setEditorData] = useState<OutputData | undefined>();
  const [mainSkills, setMainSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkill, setSubSkill] = useState<MultiSelectOptions[]>([]);
  const { isOpen, onOpen } = useDisclosure();
  // -- Jobs
  const [jobBasics, setJobBasics] = useState<JobBasicsType | undefined>();
  const { connected, publicKey } = useWallet();
  const { currentSponsor } = SponsorStore();
  const sponsors = useQuery({
    queryKey: ['sponsor', publicKey?.toBase58() ?? ''],
    queryFn: ({ queryKey }) => findSponsors(queryKey[1]),
  });
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
            },
            {
              label: 'Listings',
              number: 2,
            },
            {
              label: 'Description',
              number: 3,
            },
            {
              label: 'Payment',
              number: 4,
            },
          ]}
        >
          {!currentSponsor && (
            <CreateSponsorModel isOpen={true} onClose={() => {}} />
          )}
          {isOpen && (
            <SuccessListings slug="" isOpen={isOpen} onClose={() => {}} />
          )}
          {steps === 1 && <Template setSteps={setSteps} />}
          {router.query.type && router.query.type === 'bounties' && (
            <Createbounty
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
            />
          )}
          {router.query.type && router.query.type === 'grants' && (
            <CreateGrants
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
        </FormLayout>
      ) : (
        <ConnectWallet />
      )}
    </>
  );
};

export default CreateListing;
