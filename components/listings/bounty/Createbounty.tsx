import dynamic from 'next/dynamic';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { MultiSelectOptions } from '../../../constants';
import { CreatebountyBasic } from './CreateBountyBasic';
import { CreatebountyPayment } from './CreateBountyPayments';
import Description from '../description';
export interface BountyBasicType {
  title: string;
  deadline: string;
  eligibility: string;
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
  createDraft: (payment: string) => void;
  draftLoading: boolean;
  setSlug: Dispatch<SetStateAction<string>>;
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
  bountybasic,
  setBountyBasic,
  draftLoading,
  createDraft,
  setSlug,
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
          createDraft={createDraft}
          editorData={editorData}
          setSteps={setSteps}
          setEditorData={setEditorData}
        />
      )}

      {steps === 4 && (
        <CreatebountyPayment
          setSlug={setSlug}
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
