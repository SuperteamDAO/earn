import { OutputData } from '@editorjs/editorjs';
import dynamic from 'next/dynamic';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { MultiSelectOptions } from '../../../constants';
import { CreatebountyBasic } from './CreateBountyBasic';
import { CreatebountyPayment } from './CreateBountyPayments';
const Description = dynamic(() => import('../description'), {
  ssr: false,
});
export interface BountyBasicType {
  title: string;
  deadline: string;
  eligibility: string;
}
interface Props {
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  setEditorData: Dispatch<SetStateAction<OutputData | undefined>>;
  editorData: OutputData | undefined;
  mainSkills: MultiSelectOptions[];
  setMainSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  onOpen: () => void;
}
export const Createbounty = ({
  steps,
  editorData,
  setEditorData,
  setSteps,
  mainSkills,
  setMainSkills,
  setSubSkills,
  subSkills,
  onOpen,
}: Props) => {
  // handles the info from basic form
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>();

  return (
    <>
      {steps === 2 && (
        <CreatebountyBasic
          skills={mainSkills}
          subSkills={subSkills}
          setSubSkills={setSubSkills}
          setSkills={setMainSkills}
          bountyBasic={bountybasic}
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

      {steps === 4 && (
        <CreatebountyPayment
          onOpen={onOpen}
          subSkills={subSkills}
          mainSkills={mainSkills}
          bountyBasic={bountybasic}
          editorData={editorData}
        />
      )}
    </>
  );
};
