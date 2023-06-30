import type { BountyType, Regions } from '@prisma/client';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { MultiSelectOptions } from '../../../constants';
import Description from '../description';
import { CreatebountyBasic } from './CreateBountyBasic';
import { CreatebountyPayment } from './CreateBountyPayments';
import type { Ques } from './questions/builder';
import Builder from './questions/builder';

export interface BountyBasicType {
  title?: string;
  slug?: string;
  deadline?: string;
  type?: BountyType | string;
  templateId?: string;
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
  bountyPayment: any;
  setBountyPayment: Dispatch<SetStateAction<any | undefined>>;
  isEditMode: boolean;
  setBountyRequirements?: Dispatch<SetStateAction<any | undefined>>;
  bountyRequirements?: string | undefined;
  regions: Regions;
  setRegions: Dispatch<SetStateAction<Regions>>;
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
  bountyPayment,
  setBountyPayment,
  isEditMode,
  bountyRequirements,
  setBountyRequirements,
  regions,
  setRegions,
}: Props) => {
  // handles the info from basic form

  return (
    <>
      {steps === 2 && (
        <CreatebountyBasic
          regions={regions}
          setRegions={setRegions}
          isEditMode={isEditMode}
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
          setBountyRequirements={setBountyRequirements}
          bountyRequirements={bountyRequirements}
          isEditMode={isEditMode}
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
          isEditMode={isEditMode}
          setSteps={setSteps}
          draftLoading={draftLoading}
          createDraft={createDraft}
          setQuestions={setQuestions}
          questions={questions}
        />
      )}

      {steps === 5 && (
        <CreatebountyPayment
          isEditMode={isEditMode}
          createAndPublishListing={createAndPublishListing}
          isListingPublishing={isListingPublishing}
          bountyPayment={bountyPayment}
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
