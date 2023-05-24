import type { BountyType } from '@prisma/client';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { MultiSelectOptions } from '../../../constants';
import Description from '../description';
import { CreatebountyBasic } from './CreateBountyBasic';
import { CreatebountyPayment } from './CreateBountyPayments';
import type { Ques } from './questions/builder';
import Builder from './questions/builder';

export interface BountyBasicType {
  title: string;
  slug: string;
  deadline: string;
  type: BountyType | string;
}
interface Props {
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  setEditorData: Dispatch<SetStateAction<string | undefined>>;
  editorData: string | undefined;
  mainSkills: MultiSelectOptions[];
  setMainSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  onOpen: () => void;
  bountybasic: BountyBasicType | undefined;
  setBountyBasic: Dispatch<SetStateAction<BountyBasicType | undefined>>;
  createDraft: () => void;
  draftLoading: boolean;
  setSlug: Dispatch<SetStateAction<string>>;
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
  questions: Ques[];
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  setBountyPayment: Dispatch<SetStateAction<any | undefined>>;
}
export const CreateBounty = ({
  steps,
  editorData,
  setEditorData,
  setSteps,
  mainSkills,
  setMainSkills,
  setSubSkills,
  subSkills,
  onOpen,
  bountybasic,
  setBountyBasic,
  draftLoading,
  createDraft,
  setSlug,
  questions,
  setQuestions,
  createAndPublishListing,
  isListingPublishing,
  setBountyPayment,
}: Props) => {
  // handles the info from basic form

  return (
    <>
      {steps === 2 && (
        <CreatebountyBasic
          draftLoading={draftLoading}
          createDraft={createDraft}
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
          bountyBasics={bountybasic}
          createDraft={createDraft}
          editorData={editorData}
          setSteps={setSteps}
          setEditorData={setEditorData}
          draftLoading={draftLoading}
        />
      )}
      {steps === 4 && (
        <Builder
          setSteps={setSteps}
          draftLoading={draftLoading}
          createDraft={createDraft}
          setQuestions={setQuestions}
          questions={questions}
        />
      )}

      {steps === 5 && (
        <CreatebountyPayment
          createAndPublishListing={createAndPublishListing}
          isListingPublishing={isListingPublishing}
          setBountyPayment={setBountyPayment}
          setSlug={setSlug}
          questions={questions}
          draftLoading={draftLoading}
          createDraft={createDraft}
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
