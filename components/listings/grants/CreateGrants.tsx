import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import type { MultiSelectOptions } from '../../../constants';
import type { GrantsBasicType } from '../../../interface/listings';
import Description from '../description';
import { CreateGrantsBasic } from './CreateGrantsBasic';
import { CreateGrantsPayment } from './CreateGrantsPayments';

interface Props {
  grantBasic: GrantsBasicType | undefined;
  setGrantBasic: Dispatch<SetStateAction<GrantsBasicType | undefined>>;
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
  setSlug: Dispatch<SetStateAction<string>>;
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
  grantBasic,
  setGrantBasic,
  onOpen,
  createDraft,
  setSlug,
}: Props) => {
  return (
    <>
      {steps === 2 && (
        <CreateGrantsBasic
          grantBasic={grantBasic}
          createDraft={createDraft}
          setSubSkills={setSubSkills}
          setSkills={setMainSkills}
          setSteps={setSteps}
          setGrantBasic={setGrantBasic}
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
        <CreateGrantsPayment
          setSlug={setSlug}
          createDraft={createDraft}
          onOpen={onOpen}
          grantsBasic={grantBasic}
          editorData={editorData}
          mainSkills={mainSkills}
          setSteps={setSteps}
          subSkills={subSkills}
        />
      )}
    </>
  );
};
