import { OutputData } from '@editorjs/editorjs';
import dynamic from 'next/dynamic';
import React, { Dispatch, SetStateAction } from 'react';
import { MultiSelectOptions } from '../../../constants';
import { CreateGrantsBasic } from './CreateGrantsBasic';
import { CreateGrantsPayment } from './CreateGrantsPayments';
const Description = dynamic(() => import('../description'), {
  ssr: false,
});
interface Props {
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  setEditorData: Dispatch<SetStateAction<OutputData | undefined>>;
  editorData: OutputData | undefined;
  mainSkills: MultiSelectOptions[];
  setMainSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
}
export const CreateGrants = ({
  steps,
  editorData,
  mainSkills,
  setEditorData,
  setMainSkills,
  setSteps,
  setSubSkills,
  subSkills,
}: Props) => {
  2;
  return (
    <>
      {steps === 2 && (
        <CreateGrantsBasic
          skills={mainSkills}
          subSkills={subSkills}
          setSubSkills={setSubSkills}
          setSkills={setMainSkills}
          setSteps={setSteps}
        />
      )}
      {steps === 3 && (
        <Description
          setEditorData={setEditorData}
          editorData={editorData}
          setSteps={setSteps}
        />
      )}
      {steps === 4 && (
        <CreateGrantsPayment
          editorData={editorData}
          mainSkills={mainSkills}
          setSteps={setSteps}
          subSkills={subSkills}
        />
      )}
    </>
  );
};
