import { Form } from "@/components/ui/form";
import { 
  isEditingAtom, 
  isDuplicatingAtom,
  ListingBuilderLayout,
  listingSlugAtom,
  fetchListingAtom,
  listingIdAtom,
  ListingFormData,
  formSchemaAtom,
  isGodAtom,
  isSTAtom,
  formAtom,
  listingStatusAtom,
  listingToStatus,
  getListingDefaults,
  store,
} from "@/features/listing-builder";
import { useUser } from "@/store/user";
import { HydrateAtoms, useInitAtom, useInitAtomValue } from "@/utils/atoms";
import { zodResolver } from "@hookform/resolvers/zod";
import { Provider, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DescriptionAndTemplate, TitleAndType } from "./Form";
import { Templates } from "./Modals";

interface Props {
  listingSlug?: string;
  isEditing?: boolean;
  isDuplicating?: boolean;
}

// export function ListingBuilder({listingSlug, isEditing, isDuplicating}: Props) {
function ListingBuilder({defaultListing}: {defaultListing: ListingFormData}) {

  // const listingSlugValue = useInitAtomValue(listingSlugAtom, listingSlug)
  const listingSlugValue = useAtomValue(listingSlugAtom)
  const listingIdValue = useAtomValue(listingIdAtom)
  const listingStatusValue = useAtomValue(listingStatusAtom)
  // const setListingId = useSetAtom(listingIdAtom)

  useEffect(() => {
    console.log('check listingSlugValue',listingSlugValue)
  },[listingSlugValue])
  useEffect(() => {
    console.log('check listingIdValue',listingIdValue)
  },[listingIdValue])
  useEffect(() => {
    console.log('check listingStatusValue',listingStatusValue)
  },[listingStatusValue])

  const { data: listing } = useAtomValue(fetchListingAtom);
  useInitAtom(listingIdAtom, listing?.id)
  useInitAtom(listingStatusAtom, listing ? listingToStatus(listing) : undefined)

  const formSchema = useAtomValue(formSchemaAtom);
  const isEditing = useAtomValue(isEditingAtom);

  const formHook = useForm<ListingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? listing ?? defaultListing : defaultListing,
    mode: 'onChange',
  });
  useInitAtom(formAtom, formHook)

const preventEnterKeySubmission = (e: React.KeyboardEvent<HTMLFormElement>) => {
	const target = e.target;
	if (e.key === "Enter" && target instanceof HTMLInputElement) {
		e.preventDefault();
	}
};
  
  return (
    <ListingBuilderLayout>
      <>
        <Form {...formHook} >
          <form onSubmit={formHook.handleSubmit(() => {})} className="space-y-8 max-w-5xl mx-auto py-10 w-full"
            onKeyDown={preventEnterKeySubmission}
          >
            <TitleAndType />
            <DescriptionAndTemplate />

          </form>
        </Form>
      </>
    </ListingBuilderLayout>
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
