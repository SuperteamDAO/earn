import { OutputData } from '@editorjs/editorjs';
import dynamic from 'next/dynamic';
import React, { Dispatch, SetStateAction } from 'react';
import { MultiSelectOptions } from '../../../constants';
import { JobBasicsType } from '../../../interface/listings';
const Description = dynamic(() => import('../description'), {
  ssr: false,
});
import { CreateJobBasic } from './CreateJobBasic';
import { CreateJobPayments } from './CreateJobPayments';
interface Props {
  jobBasics: JobBasicsType | undefined;
  setJobBasic: Dispatch<SetStateAction<JobBasicsType | undefined>>;
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
export const CreateJob = ({
  editorData,
  mainSkills,
  setEditorData,
  setMainSkills,
  setSteps,
  setSubSkills,
  steps,
  subSkills,
  jobBasics,
  setJobBasic,
  onOpen,
}: Props) => {
  return (
    <>
      {steps === 2 && (
        <CreateJobBasic
          jobBasics={jobBasics}
          setJobBasic={setJobBasic}
          setSkills={setMainSkills}
          setSteps={setSteps}
          skills={mainSkills}
          subSkills={subSkills}
          setSubSkills={setSubSkills}
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
        <CreateJobPayments
          jobBasics={jobBasics}
          subSkills={subSkills}
          editorData={editorData}
          mainSkills={mainSkills}
          onOpen={onOpen}
        />
      )}
    </>
  );
};
