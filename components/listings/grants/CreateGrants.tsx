import { OutputData } from '@editorjs/editorjs';
import dynamic from 'next/dynamic';
import React, { Dispatch, SetStateAction } from 'react';
import { MultiSelectOptions } from '../../../constants';
import { GrantsBasicType } from '../../../interface/listings';
import { CreateGrantsBasic } from './CreateGrantsBasic';
import { CreateGrantsPayment } from './CreateGrantsPayments';
const Description = dynamic(() => import('../description'), {
  ssr: false,
});
interface Props {
  grantBasic: GrantsBasicType | undefined;
  setGrantBasic: Dispatch<SetStateAction<GrantsBasicType | undefined>>;
  steps: number;
  setSteps: Dispatch<SetStateAction<number>>;
  setEditorData: Dispatch<SetStateAction<OutputData | undefined>>;
  editorData: OutputData | undefined;
  mainSkills: MultiSelectOptions[];
  setMainSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  onOpen: () => void;
  createDraft: (payment: string) => void;
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
  2;
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
