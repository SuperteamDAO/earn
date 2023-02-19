import { OutputData } from '@editorjs/editorjs';
import dynamic from 'next/dynamic';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { CreatebountyBasic } from './CreateBountyBasic';
import { CreatebountyPayment } from './CreateBountyPayments';
const Description = dynamic(() => import('./description'), {
  ssr: false,
});
export interface BountyBasicType {
  title: string;
  // description: string;
  contact: string;
  skills: string;
  deadline: string;
  estimatedTime: string;
}
interface Props {
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  setEditorData: Dispatch<SetStateAction<OutputData | undefined>>;
  editorData: OutputData | undefined;
}
export const Createbounty = ({
  steps,
  editorData,
  setEditorData,
  setSteps,
}: Props) => {
  // handles the info from basic form
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>();

  return (
    <>
      {steps === 2 && (
        <CreatebountyBasic
          setSteps={setSteps}
          setbountyBasic={setBountyBasic}
        />
      )}
      {steps === 3 && (
        <Description
          editorData={editorData}
          setSteps={setSteps}
          setEditorData={setEditorData}
        />
      )}

      {steps === 4 && <CreatebountyPayment setSteps={setSteps} />}
    </>
  );
};
