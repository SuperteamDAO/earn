import { useIsFetching, useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { CheckIcon, Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/components/ui/multi-select';
import { CHAIN_NAME } from '@/constants/project';

import { slugCheckQuery } from '@/features/listing-builder/queries/slug-check';

import { isEditingAtom } from '../../../atoms';
import { useListingForm } from '../../../hooks';

export function Slug() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);

  // const [isValidated, setIsValidated] = useState(false);
  const isSlugLoading = useIsFetching({ queryKey: ['slug'] }) > 0;

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
      form.formState.errors.slug === undefined && !isEditing && !!debouncedSlug,
    [form.formState.errors.slug, isEditing, debouncedSlug],
  );

  const slugCheckQueryResult = useMemo(() => {
    return slugCheckQuery({ slug: debouncedSlug, check: true, id: listingId });
  }, [debouncedSlug, listingId]);
  const { isError: isSlugCheckError, isFetching: slugCheckFetching } = useQuery(
    {
      ...slugCheckQueryResult,
      enabled: queryEnabled,
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (isSlugCheckError) {
      if (slug === '') return;
      form.setError('slug', {
        message: 'Slug already exists. Please try another.',
        type: 'manual',
      });
      form.setFocus('slug');
    }
  }, [isSlugCheckError]);

  useEffect(() => {
    async function validateSlug() {
      await form.trigger('slug');
      form.setFocus('slug');
      form.saveDraft();
    }
    validateSlug();
  }, [debouncedSlug]);

  return (
    <FormField
      control={form.control}
      name="slug"
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div>
              <FormLabel className="">Customise Listing Slug</FormLabel>
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder={`write-a-twitter-thread-on-${CHAIN_NAME}`}
                  disabled={!!publishedAt || isSlugLoading}
                  onBlur={() => null}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-'); // Replace spaces with dashes
                    field.onChange(value);
                  }}
                />
                {slugCheckFetching || isSlugLoading ? (
                  <Loader2 className="absolute right-2 top-1.5 animate-spin text-slate-300" />
                ) : (
                  form.formState.errors.slug === undefined &&
                  !isSlugCheckError &&
                  !isEditing && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 scale-75 items-center rounded-full bg-emerald-500 p-1 text-background">
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
