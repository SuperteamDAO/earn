import { useAtomValue } from 'jotai';
import { CheckIcon, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { CopyButton } from '@/components/ui/copy-tooltip';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/components/ui/multi-select';

import { useSlugCheck } from '@/features/listing-builder/queries/slug-check';

import { isEditingAtom, slugCheckingAtom } from '../../../atoms';
import { useListingForm } from '../../../hooks';

export function Slug() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);

  // const [isValidated, setIsValidated] = useState(false);
  const isSlugLoading = useAtomValue(slugCheckingAtom) > 0;

  const slug = useWatch({
    control: form.control,
    name: 'slug',
  });

  const listingId = useWatch({
    control: form.control,
    name: 'id',
  });
  const publishedAt = useWatch({
    control: form.control,
    name: 'publishedAt',
  });

  const debouncedSlug = useDebounce(slug, 1000);

  const queryEnabled = useMemo(
    () =>
      form.formState.errors.slug === undefined &&
      !isEditing &&
      !!debouncedSlug &&
      !!listingId,
    [form.formState.errors.slug, isEditing, debouncedSlug, listingId],
  );

  const {
    data: slugCheckData,
    isError: isSlugCheckError,
    isFetching: slugCheckFetching,
  } = useSlugCheck(
    { slug: debouncedSlug, check: true, id: listingId },
    queryEnabled,
  );

  // A taken slug answers 400 with slugExists (fetchSlugCheck reads it).
  const isSlugTaken = slugCheckData?.slugExists === true;
  const isSlugAvailable = slugCheckData?.slugExists === false;

  useEffect(() => {
    if (isSlugTaken) {
      if (slug === '') return;
      form.setError('slug', {
        message: 'Slug already exists. Please try another.',
        type: 'manual',
      });
      form.setFocus('slug');
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies, react-hooks/exhaustive-deps -- Earn's dependencies, kept so it runs when it did
  }, [isSlugTaken]);

  const prevDebouncedSlugRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    async function validateSlug() {
      await form.trigger('slug');
      form.setFocus('slug');
      // Only save if slug actually changed
      if (prevDebouncedSlugRef.current !== debouncedSlug) {
        prevDebouncedSlugRef.current = debouncedSlug;
        form.saveDraft();
      }
    }
    void validateSlug();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies, react-hooks/exhaustive-deps -- Earn's dependencies, kept so it runs when it did
  }, [debouncedSlug]);

  return (
    <FormField
      control={form.control}
      name="slug"
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div>
              <FormLabel className="">Customise URL (Slug)</FormLabel>
              <FormDescription className="cursor-pointer">
                <CopyButton
                  text={`https://superteam.fun/earn/listing/${slug}`}
                  contentProps={{
                    side: 'right',
                    className: 'px-1.5 py-0.5 text-[0.6875rem]',
                  }}
                >
                  <button className="max-w-md cursor-pointer truncate text-slate-400">
                    <span>https://superteam.fun/earn/listing/</span>
                    <span className="underline underline-offset-2">{slug}</span>
                  </button>
                </CopyButton>
              </FormDescription>
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="write-a-twitter-thread-on-Solana"
                  disabled={!!publishedAt || isSlugLoading}
                  onBlur={() => null}
                  className="pr-8"
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-'); // Replace spaces with dashes
                    field.onChange(value);
                  }}
                />
                {slugCheckFetching || isSlugLoading ? (
                  <Loader2 className="absolute top-1.5 right-2 animate-spin text-slate-300" />
                ) : (
                  form.formState.errors.slug === undefined &&
                  isSlugAvailable &&
                  !isSlugCheckError &&
                  !isEditing && (
                    <span className="text-background absolute top-2 right-2 flex h-5 w-5 scale-75 items-center rounded-full bg-emerald-500 p-1">
                      <CheckIcon className="h-full w-full stroke-[3px]" />
                    </span>
                  )
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
