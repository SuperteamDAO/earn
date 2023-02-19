import { Flex } from '@chakra-ui/react';
import FormLayout from '../../layouts/FormLayout';
import { Createbounty } from '../../components/listings/Createbounty';
import { useState } from 'react';
import { CreateJob } from '../../components/listings/jobs/CreateJob';
// import { Description } from '../../components/listings/description';
import dynamic from 'next/dynamic';
import { OutputData } from '@editorjs/editorjs';
import Template from '../../components/listings/templates/template';
const Description = dynamic(
  () => import('../../components/listings/description'),
  {
    ssr: false,
  }
);
const content = <Flex py={4}>jere</Flex>;

const CreateListing = () => {
  // Templates - 1
  // Basic Info - 2
  // Description - 3
  // payment form - 4
  const [steps, setSteps] = useState<number>(1);
  const [editorData, setEditorData] = useState<OutputData | undefined>();
  return (
    <>
      <FormLayout
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
        {steps === 1 && <Template setSteps={setSteps} />}
        <Createbounty
          editorData={editorData}
          setEditorData={setEditorData}
          setSteps={setSteps}
          steps={steps}
        />
        {/* <CreateJob /> */}
      </FormLayout>
    </>
  );
};

export default CreateListing;
