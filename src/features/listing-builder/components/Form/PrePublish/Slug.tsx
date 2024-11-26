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
import { slugCheckQuery } from '@/features/listing-builder';

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
  useEffect(() => {
    console.log('listingId', listingId);
  }, [listingId]);

  const debouncedSlug = useDebounce(slug);
  useEffect(() => {
    console.log('slug', slug);
  }, [slug]);
  useEffect(() => {
    console.log('debouncedSlug', debouncedSlug);
  }, [debouncedSlug]);

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
    console.log('slug error isSlugCheckError', isSlugCheckError);
    if (isSlugCheckError) {
      if (slug === '') return;
      form.setError('slug', {
        message: 'Slug already exists. Please try another.',
        type: 'manual',
      });
    }
  }, [isSlugCheckError]);

  useEffect(() => {
    console.log('slugCheckFetching', slugCheckFetching);
  }, [slugCheckFetching]);

  useEffect(() => {
    async function validateSlug() {
      const validated = await form.trigger('slug');
      console.log('slug error validated', validated);
      console.log(
        'slug error form.formState.errors.slug',
        form.formState.errors.slug,
      );
      form.saveDraft();
    }
    validateSlug();
  }, [debouncedSlug]);

  // useEffect(() => {
  //   if(!form.formState.errors.slug) form.saveDraft()
  // },[form.formState.errors.slug, debouncedSlug])
  // useEffect(() => {
  //   if(isValidated) form.saveDraft();
  // },[isValidated])

  return (
    <FormField
      control={form.control}
      name="slug"
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel className="">Customise URL (Slug)</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="write-a-twitter-thread-on-Solana"
                  disabled={!!publishedAt || isSlugLoading}
                  onBlur={() => null}
                />
                {slugCheckFetching || isSlugLoading ? (
                  <Loader2 className="absolute right-2 top-1.5 animate-spin text-slate-300" />
                ) : (
                  <span className="absolute right-2 top-1.5 flex h-5 w-5 scale-75 items-center rounded-full bg-slate-400 p-1 text-background">
                    <CheckIcon className="h-full w-full stroke-[3px]" />
                  </span>
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
