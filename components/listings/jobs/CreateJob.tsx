import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { MultiSelectOptions } from '../../../constants';
import type { JobBasicsType } from '../../../interface/listings';
import Description from '../description';
import { CreateJobBasic } from './CreateJobBasic';
import { CreateJobPayments } from './CreateJobPayments';

interface Props {
  jobBasics: JobBasicsType | undefined;
  setJobBasic: Dispatch<SetStateAction<JobBasicsType | undefined>>;
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  setEditorData: Dispatch<SetStateAction<string | undefined>>;
  editorData: string | undefined;
  mainSkills: MultiSelectOptions[];
  setMainSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  onOpen: () => void;
  createDraft: () => void;
  draftLoading: boolean;
  setSlug: Dispatch<SetStateAction<string>>;
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
  createDraft,
  draftLoading,
  setSlug,
}: Props) => {
  return (
    <>
      {steps === 2 && (
        <CreateJobBasic
          draftLoading={draftLoading}
          createDraft={createDraft}
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
          createDraft={createDraft}
          setEditorData={setEditorData}
          editorData={editorData}
          setSteps={setSteps}
        />
      )}
      {steps === 4 && (
        <CreateJobPayments
          setSlug={setSlug}
          draftLoading={draftLoading}
          createDraft={createDraft}
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
