import type { Regions } from '@prisma/client';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { References, SuperteamName } from '@/interface/bounty';

import type { MultiSelectOptions } from '../../../constants';
import { Description } from '../description';
import { CreatebountyBasic } from './CreateBountyBasic';
import { CreatebountyPayment } from './CreateBountyPayments';
import type { Ques } from './questions/builder';
import { Builder } from './questions/builder';

export interface BountyBasicType {
  title?: string;
  deadline?: string;
  templateId?: string;
  pocSocials?: string;
  applicationType?: 'fixed' | 'rolling';
  timeToComplete?: string;
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
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
  questions: Ques[];
  references: References[];
  setReferences: Dispatch<SetStateAction<References[]>>;
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  bountyPayment: any;
  setBountyPayment: Dispatch<SetStateAction<any | undefined>>;
  editable: boolean;
  setBountyRequirements?: Dispatch<SetStateAction<any | undefined>>;
  bountyRequirements?: string | undefined;
  regions: Regions;
  setRegions: Dispatch<SetStateAction<Regions>>;
  type: 'open' | 'permissioned' | 'hackathon';
  isNewOrDraft?: boolean;
  isDuplicating?: boolean;
  referredBy?: SuperteamName;
  setReferredBy?: Dispatch<SetStateAction<SuperteamName | undefined>>;
  isPrivate: boolean;
  setIsPrivate: Dispatch<SetStateAction<boolean>>;
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
  questions,
  setQuestions,
  createAndPublishListing,
  isListingPublishing,
  bountyPayment,
  setBountyPayment,
  editable,
  bountyRequirements,
  setBountyRequirements,
  regions,
  setRegions,
  type,
  references,
  setReferences,
  isNewOrDraft,
  isDuplicating,
  referredBy,
  setReferredBy,
  isPrivate,
  setIsPrivate,
}: Props) => {
  // handles the info from basic form

  return (
    <>
      {steps === 2 && (
        <CreatebountyBasic
          regions={regions}
          setRegions={setRegions}
          editable={editable}
          draftLoading={draftLoading}
          createDraft={createDraft}
          skills={mainSkills}
          subSkills={subSkills}
          setSubSkills={setSubSkills}
          setSkills={setMainSkills}
          bountyBasic={bountybasic}
          setSteps={setSteps}
          setbountyBasic={setBountyBasic}
          type={type}
          isNewOrDraft={isNewOrDraft}
          isDuplicating={isDuplicating}
          referredBy={referredBy}
          setReferredBy={setReferredBy}
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
        />
      )}
      {steps === 3 && (
        <Description
          type={type}
          setBountyRequirements={setBountyRequirements}
          bountyRequirements={bountyRequirements}
          editable={editable}
          createDraft={createDraft}
          editorData={editorData}
          setSteps={setSteps}
          setEditorData={setEditorData}
          draftLoading={draftLoading}
          references={references}
          setReferences={setReferences}
          isNewOrDraft={isNewOrDraft}
          isDuplicating={isDuplicating}
        />
      )}
      {steps === 4 && (
        <Builder
          editable={editable}
          setSteps={setSteps}
          draftLoading={draftLoading}
          createDraft={createDraft}
          setQuestions={setQuestions}
          questions={questions}
          isNewOrDraft={isNewOrDraft}
          isDuplicating={isDuplicating}
        />
      )}

      {steps === 5 && (
        <CreatebountyPayment
          editable={editable}
          createAndPublishListing={createAndPublishListing}
          isListingPublishing={isListingPublishing}
          bountyPayment={bountyPayment}
          setBountyPayment={setBountyPayment}
          questions={questions}
          draftLoading={draftLoading}
          createDraft={createDraft}
          onOpen={onOpen}
          subSkills={subSkills}
          mainSkills={mainSkills}
          bountyBasic={bountybasic}
          editorData={editorData}
          isNewOrDraft={isNewOrDraft}
          type={type}
          isDuplicating={isDuplicating}
        />
      )}
    </>
  );
};
