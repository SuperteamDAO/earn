import type { Regions } from '@prisma/client';
import React, { type Dispatch, type SetStateAction } from 'react';

import type { MultiSelectOptions } from '@/constants';
import type { References } from '@/features/listings';

import type { SuperteamName } from '../types';
import {
  DescriptionBuilder,
  ListingBasic,
  ListingPayments,
  type Ques,
  QuestionBuilder,
} from './ListingBuilder';

export interface BountyBasicType {
  title?: string;
  slug?: string;
  deadline?: string;
  templateId?: string;
  pocSocials?: string;
  applicationType?: 'fixed' | 'rolling';
  timeToComplete?: string;
}
interface Props {
  id?: string;
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
  editable: boolean;
  setBountyRequirements?: Dispatch<SetStateAction<any | undefined>>;
  bountyRequirements?: string | undefined;
  regions: Regions;
  setRegions: Dispatch<SetStateAction<Regions>>;
  type: 'bounty' | 'project' | 'hackathon';
  isNewOrDraft?: boolean;
  isDuplicating?: boolean;
  referredBy?: SuperteamName;
  setReferredBy?: Dispatch<SetStateAction<SuperteamName | undefined>>;
  isPrivate: boolean;
  setIsPrivate: Dispatch<SetStateAction<boolean>>;
  bountyPaymentDispatch: any;
  publishedAt?: string;
}
export const CreateListingForm = ({
  id,
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
  bountyPaymentDispatch,
  publishedAt,
}: Props) => {
  // handles the info from basic form

  return (
    <>
      {steps === 2 && (
        <ListingBasic
          id={id}
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
          publishedAt={publishedAt}
        />
      )}
      {steps === 3 && (
        <DescriptionBuilder
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
        <QuestionBuilder
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
        <ListingPayments
          editable={editable}
          createAndPublishListing={createAndPublishListing}
          isListingPublishing={isListingPublishing}
          bountyPayment={bountyPayment}
          bountyPaymentDispatch={bountyPaymentDispatch}
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
