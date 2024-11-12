import { Form } from "@/components/ui/form";
import { 
  isEditingAtom, 
  isDuplicatingAtom,
  ListingBuilderLayout,
  listingSlugAtom,
  fetchListingAtom,
  ListingFormData,
  isGodAtom,
  isSTAtom,
  listingStatusAtom,
  listingToStatus,
  getListingDefaults,
  store,
} from "@/features/listing-builder";
import { useUser } from "@/store/user";
import { HydrateAtoms, useInitAtom } from "@/utils/atoms";
import { Provider, useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import { Deadline, DescriptionAndTemplate, POC, TitleAndType, EligibilityQuestions, Skills, Rewards } from "./Form";
import { useListingForm } from "../hooks";
import { useEffect } from "react";

interface Props {
  listingSlug?: string;
  isEditing?: boolean;
  isDuplicating?: boolean;
}

function ListingBuilder({defaultListing}: {defaultListing: ListingFormData}) {

  const { data: listing } = useAtomValue(fetchListingAtom);
  useInitAtom(listingStatusAtom, listing ? listingToStatus(listing) : undefined)

  const isEditing = useAtomValue(isEditingAtom);
  const form = useListingForm(isEditing ? listing ?? defaultListing : defaultListing)

  // const preventEnterKeySubmission = (e: React.KeyboardEvent<HTMLFormElement>) => {
  //   const target = e.target;
  //   if (e.key === "Enter" && target instanceof HTMLInputElement) {
  //     e.preventDefault();
  //   }
  // };

  useEffect(() => {
    console.log('form errors', form.formState.errors)
  }, [form]);
  useEffect(() => {
    console.log('formHook',form)
  },[form])
  return (
    <>
      <Form {...form} >
        <form 
          // onKeyDown={preventEnterKeySubmission}
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
          </ListingBuilderLayout>
        </form>
      </Form>
    </>
  )
}

// atom values wont be available here, will only exist in child of HydrateAtoms
function ListingBuilderProvider({listingSlug, isEditing, isDuplicating}: Props) {
  const { data: session } = useSession();
  const { user } = useUser();
  const isGod = session?.user.role === 'GOD'
  const isST = !!user?.currentSponsor?.st

  const defaultListing = getListingDefaults(isGod, !!isEditing, !!isDuplicating, isST)
  console.log('defaultListing', defaultListing)

  return (
    <Provider store={store}>
      <HydrateAtoms initialValues={[
        [listingSlugAtom, listingSlug],
        [isEditingAtom, isEditing],
        [isDuplicatingAtom, isDuplicating],
        [isGodAtom, isGod],
        [isSTAtom, isST],
      ]}>
        <ListingBuilder defaultListing={defaultListing} />
      </HydrateAtoms>
    </Provider>
  );
}

export { ListingBuilderProvider as ListingBuilder}
