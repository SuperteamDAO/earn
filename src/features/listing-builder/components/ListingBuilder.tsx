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
  draftStorageAtom,
  formAtom,
  listingStatusAtom,
  listingToStatus,
} from "@/features/listing-builder";
import { useUser } from "@/store/user";
import { HydrateAtoms, useInitAtom, useInitAtomValue } from "@/utils/atoms";
import { zodResolver } from "@hookform/resolvers/zod";
import { Provider, useAtomValue, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface Props {
  listingSlug?: string;
  isEditing?: boolean;
  isDuplicating?: boolean;
}

// export function ListingBuilder({listingSlug, isEditing, isDuplicating}: Props) {
function ListingBuilder() {

  // const listingSlugValue = useInitAtomValue(listingSlugAtom, listingSlug)
  const listingSlugValue = useAtomValue(listingSlugAtom)
  const listingIdValue = useAtomValue(listingIdAtom)
  const listingStatusValue = useAtomValue(listingStatusAtom)
  const setListingId = useSetAtom(listingIdAtom)

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
  const draftStorage = useAtomValue(draftStorageAtom);

  const formHook = useForm<ListingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? listing ?? draftStorage : draftStorage,
    mode: 'onChange'
  });
  useInitAtom(formAtom, formHook)
  return (
    <ListingBuilderLayout>
      <>
      </>
    </ListingBuilderLayout>
  )
}

// atom values wont be available here, will only exist in child of HydrateAtoms
function ListingBuilderProvider({listingSlug, isEditing, isDuplicating}: Props) {
  const { data: session } = useSession();
  const { user } = useUser();
  return (
    <Provider>
      <HydrateAtoms initialValues={[
        [listingSlugAtom, listingSlug],
        [isEditingAtom, isEditing],
        [isDuplicatingAtom, isDuplicating],
        [isGodAtom, session?.user.role === 'GOD'],
        [isSTAtom, !!user?.currentSponsor?.st],
      ]}>
        <ListingBuilder />
      </HydrateAtoms>
    </Provider>
  );
}

export { ListingBuilderProvider as ListingBuilder}
