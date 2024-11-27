import { type BountyType, type Hackathon } from '@prisma/client';
import { Provider, useSetAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';

import { Form } from '@/components/ui/form';
import { type Listing } from '@/features/listings';
import { useUser } from '@/store/user';
import { HydrateAtoms, useInitAtom } from '@/utils/atoms';

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
  listingToStatus,
  transformListingToFormListing,
} from '../utils';
import {
  Deadline,
  DescriptionAndTemplate,
  EligibilityQuestions,
  POC,
  Rewards,
  Skills,
  TitleAndType,
} from './Form';
import { ListingBuilderLayout } from './layout';
import {
  ListingSuccessModal,
  PreviewListingModal,
  UnderVerificationModal,
} from './Modals';

function ListingBuilder({
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

  useMemo(() => console.log('form values', form.getValues()), [form]);

  return (
    <>
      <div className="flex min-h-[80vh] px-3 md:hidden">
        <p className="pt-20 text-center text-xl font-medium text-slate-500">
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
          className="invisible md:visible"
        >
          <ListingBuilderLayout>
            <div className="mx-auto w-full max-w-5xl space-y-8 px-8 py-10">
              <div className="grid grid-cols-9 gap-4">
                <div className="col-span-6 space-y-4">
                  <TitleAndType />
                  <DescriptionAndTemplate />
                </div>
                <div className="col-span-3 space-y-6">
                  <Rewards />
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
          </ListingBuilderLayout>
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
  const { data: session } = useSession();
  const { user } = useUser();
  const isGod = session?.user.role === 'GOD';
  const isST = !!user?.currentSponsor?.st;

  const params = useSearchParams();
  const defaultListing = listing
    ? transformListingToFormListing(listing)
    : getListingDefaults({
        isGod,
        isEditing: !!isEditing,
        isST: isST,
        type: (params.get('type') as BountyType) || 'bounty',
        hackathon: hackathon,
      });
  console.log('defaultListing', defaultListing);

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
              id: defaultListing.id,
            },
          ],
        ]}
      >
        <ListingBuilder
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

export { ListingBuilderProvider as ListingBuilder };
