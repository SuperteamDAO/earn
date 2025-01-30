import { type BountyType, type Hackathon } from '@prisma/client';
import { Provider, useSetAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { Form } from '@/components/ui/form';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { HydrateAtoms, useInitAtom } from '@/utils/atoms';

import { type Listing } from '@/features/listings/types';
import { Header } from '@/features/navbar/components/Header';

import {
  confirmModalAtom,
  draftQueueAtom,
  hackathonAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  listingStatusAtom,
  previewAtom,
  store,
} from '../atoms';
import { useListingForm } from '../hooks';
import { type ListingFormData } from '../types';
import {
  getListingDefaults,
  transformListingToFormListing,
} from '../utils/form';
import { listingToStatus } from '../utils/listingToStatus.ts';
import { Deadline } from './Form/Deadline';
import { DescriptionAndTemplate } from './Form/DescriptionAndTemplate/DescriptionAndTemplate';
import { EligibilityQuestions } from './Form/EligibilityQuestions';
import { POC } from './Form/POC';
import { RewardsSheet } from './Form/Rewards/Sheet';
import { Skills } from './Form/Skills';
import { TitleAndType } from './Form/TitleAndType';
import { ListingBuilderFormLayout } from './layout/ListingBuilderFormLayout';
import { ListingSuccessModal } from './Modals/ListingSuccessModal';
import { PreviewListingModal } from './Modals/PreviewListingModal';
import { UnderVerificationModal } from './Modals/UnderVerficationModal';

function ListingEditor({
  defaultListing,
  isDuplicating,
  hackathon,
  isST,
  isGod,
}: {
  defaultListing: ListingFormData;
  isDuplicating?: boolean;
  hackathon?: Hackathon;
  isST: boolean;
  isGod: boolean;
}) {
  const form = useListingForm(defaultListing, hackathon);
  useInitAtom(
    listingStatusAtom,
    defaultListing ? listingToStatus(defaultListing) : undefined,
  );
  useInitAtom(hackathonAtom, hackathon);
  useInitAtom(isSTAtom, isST);
  useInitAtom(isGodAtom, isGod);
  useInitAtom(isEditingAtom, !!defaultListing.isPublished);

  useEffect(() => {
    if (isDuplicating) form.saveDraft();
  }, [isDuplicating]);

  const preventEnterKeySubmission = (
    e: React.KeyboardEvent<HTMLFormElement>,
  ) => {
    const target = e.target;
    if (e.key === 'Enter' && target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    // keep this log, for error purposes
    console.log('errors', form.formState.errors);
  }, [form.formState.errors]);

  const setConfirmModal = useSetAtom(confirmModalAtom);
  const setPreviewModal = useSetAtom(previewAtom);
  useEffect(() => {
    return () => {
      setConfirmModal(undefined);
      setPreviewModal(false);
    };
  }, []);

  return (
    <>
      <Meta
        title="Superteam Earn | Work to Earn in Crypto"
        description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
        canonical="https://earn.superteam.fun"
      />
      <div className="flex min-h-[10vh] flex-col px-3 md:hidden">
        <Header />
        <p className="w-full pt-20 text-center text-xl font-medium text-slate-500">
          The Sponsor Dashboard on Earn is not optimized for mobile yet. Please
          use a desktop to check out the Sponsor Dashboard
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          onKeyDown={preventEnterKeySubmission}
          className="hidden md:block"
        >
          <ListingBuilderFormLayout>
            <div className="mx-auto w-full max-w-5xl space-y-8 px-8 py-10">
              <div className="grid grid-cols-9 gap-4">
                <div className="col-span-6 space-y-4">
                  <TitleAndType />
                  <DescriptionAndTemplate />
                </div>
                <div className="col-span-3 space-y-6">
                  <RewardsSheet />
                  <Deadline />
                  <Skills />
                  <POC />
                  <EligibilityQuestions />
                </div>
              </div>
            </div>
            <ListingSuccessModal />
            <PreviewListingModal />
            <UnderVerificationModal />
          </ListingBuilderFormLayout>
        </form>
      </Form>
    </>
  );
}

interface Props {
  isEditing?: boolean;
  isDuplicating?: boolean;
  listing?: Listing;
  hackathon?: Hackathon;
}

// atom values wont be available here, will only exist in child of HydrateAtoms immeditealy
function ListingBuilderProvider({
  isEditing = false,
  isDuplicating,
  listing,
  hackathon,
}: Props) {
  const { user } = useUser();
  const isGod = user?.role === 'GOD';
  const isST = !!user?.currentSponsor?.st;

  const params = useSearchParams();
  const defaultListing = listing
    ? transformListingToFormListing(listing)
    : getListingDefaults({
        isGod,
        isEditing: !!isEditing,
        isST: isST,
        type: (params?.get('type') as BountyType) || 'bounty',
        hackathon: hackathon,
      });

  return (
    <Provider store={store}>
      <HydrateAtoms
        initialValues={[
          [isEditingAtom, isEditing],
          [isGodAtom, isGod],
          [isSTAtom, isST],
          [hackathonAtom, hackathon],
          [listingStatusAtom, listingToStatus(defaultListing)],
          [
            draftQueueAtom,
            {
              isProcessing: false,
              shouldProcessNext: false,
            },
          ],
        ]}
      >
        <ListingEditor
          defaultListing={defaultListing}
          isDuplicating={isDuplicating}
          hackathon={hackathon}
          isST={isST}
          isGod={isGod}
        />
      </HydrateAtoms>
    </Provider>
  );
}

export { ListingBuilderProvider };
