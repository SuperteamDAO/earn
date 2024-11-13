import { type BountyType } from '@prisma/client';
import { Provider, useAtomValue } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { Form } from '@/components/ui/form';
import {
  draftQueueAtom,
  getListingDefaults,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  ListingBuilderLayout,
  type ListingFormData,
  listingStatusAtom,
  listingToStatus,
  store,
} from '@/features/listing-builder';
import { useUser } from '@/store/user';
import { HydrateAtoms, useInitAtom } from '@/utils/atoms';

import { useListingForm } from '../hooks';
import {
  Deadline,
  DescriptionAndTemplate,
  EligibilityQuestions,
  POC,
  Rewards,
  Skills,
  TitleAndType,
} from './Form';
import {
  ListingSuccessModal,
  PreviewListingModal,
  UnderVerificationModal,
} from './Modals';

function ListingBuilder({
  defaultListing,
  isDuplicating,
}: {
  defaultListing: ListingFormData;
  isDuplicating?: boolean;
}) {
  const isEditing = useAtomValue(isEditingAtom);
  useEffect(() => {
    console.log('isEditing inside hydrate', isEditing);
  }, [isEditing]);

  const form = useListingForm(defaultListing);
  useInitAtom(
    listingStatusAtom,
    defaultListing ? listingToStatus(defaultListing) : undefined,
  );

  const params = useSearchParams();
  useEffect(() => {
    console.log('start effect');
    if (params.has('type'))
      form.setValue('type', (params.get('type') as BountyType) || 'bounty');

    if (isDuplicating) form.onChange();
  }, []);

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
  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          onKeyDown={preventEnterKeySubmission}
          onChange={form.onChange}
        >
          <ListingBuilderLayout>
            <div className="mx-auto w-full max-w-5xl space-y-8 py-10">
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
  listing?: ListingFormData;
}

// atom values wont be available here, will only exist in child of HydrateAtoms immeditealy
function ListingBuilderProvider({ isEditing, isDuplicating, listing }: Props) {
  const { data: session, status } = useSession();
  const { user } = useUser();
  const isGod = session?.user.role === 'GOD';
  const isST = !!user?.currentSponsor?.st;

  const defaultListing =
    listing || getListingDefaults(isGod, !!isEditing, isST);
  console.log('isEditing', isEditing);

  const router = useRouter();
  if (!session && status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <Provider store={store}>
      <HydrateAtoms
        initialValues={[
          [isEditingAtom, isEditing],
          [isGodAtom, isGod],
          [isSTAtom, isST],
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
        />
      </HydrateAtoms>
    </Provider>
  );
}

export { ListingBuilderProvider as ListingBuilder };
