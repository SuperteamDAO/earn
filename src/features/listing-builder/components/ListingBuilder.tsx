import { Form } from "@/components/ui/form";
import { 
  isEditingAtom, 
  isDuplicatingAtom,
  ListingBuilderLayout,
  ListingFormData,
  isGodAtom,
  isSTAtom,
  getListingDefaults,
  store,
  listingToStatus,
  listingStatusAtom,
  draftQueueAtom,
} from "@/features/listing-builder";
import { useUser } from "@/store/user";
import { HydrateAtoms, useInitAtom } from "@/utils/atoms";
import { Provider, useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import { Deadline, DescriptionAndTemplate, POC, TitleAndType, EligibilityQuestions, Skills, Rewards } from "./Form";
import { useListingForm } from "../hooks";
import { ListingSuccessModal, PreviewListingModal, UnderVerificationModal } from "./Modals";
import { useSearchParams } from "next/navigation";
import { BountyType } from "@prisma/client";
import { useEffect } from "react";

interface Props {
  isEditing?: boolean;
  isDuplicating?: boolean;
  listing?: ListingFormData
}

function ListingBuilder({defaultListing}: {defaultListing: ListingFormData}) {

  const isEditing = useAtomValue(isEditingAtom)
  useEffect(() => {
    console.log('isEditing type', isEditing)
  },[isEditing])

  const form = useListingForm(defaultListing)
  useInitAtom(listingStatusAtom, defaultListing ? listingToStatus(defaultListing) : undefined)

  const params = useSearchParams()
  form.setValue('type',params.get('type') as BountyType || 'bounty')

  const preventEnterKeySubmission = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target;
    if (e.key === "Enter" && target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    console.log('errors',form.formState.errors)
  },[form.formState.errors])
  return (
    <>
      <Form {...form} >
        <form onSubmit={(e) => {
          e.preventDefault()
        }} 
          onKeyDown={preventEnterKeySubmission}
          onChange={form.onChange}
        >
          <ListingBuilderLayout>
            <div className="space-y-8 max-w-5xl mx-auto py-10 w-full">
              <div className="grid grid-cols-9 gap-4">
                <div className="col-span-6 space-y-4">
                  <TitleAndType />
                  <DescriptionAndTemplate />
                </div>
                <div className="col-span-3 space-y-4">
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
  )
}

// atom values wont be available here, will only exist in child of HydrateAtoms immeditealy
function ListingBuilderProvider({isEditing, isDuplicating, listing}: Props) {
  const { data: session } = useSession();
  const { user } = useUser();
  const isGod = session?.user.role === 'GOD'
  const isST = !!user?.currentSponsor?.st

  const defaultListing = listing || getListingDefaults(isGod, !!isEditing, !!isDuplicating, isST)
  console.log('isEditing',isEditing)


  return (
    <Provider store={store}>
      <HydrateAtoms initialValues={[
        [isEditingAtom, isEditing],
        [isDuplicatingAtom, isDuplicating],
        [isGodAtom, isGod],
        [isSTAtom, isST],
        [listingStatusAtom,listingToStatus(defaultListing)],
        [draftQueueAtom, {
          isProcessing: false,
          shouldProcessNext: false,
          id: defaultListing.id
        }]
      ]}>
        <ListingBuilder defaultListing={defaultListing} />
      </HydrateAtoms>
    </Provider>
  );
}

export { ListingBuilderProvider as ListingBuilder}
