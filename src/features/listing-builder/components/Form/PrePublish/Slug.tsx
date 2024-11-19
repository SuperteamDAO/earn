import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { CheckIcon, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import slugify from 'slugify';

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

  const [isValidated, setIsValidated] = useState(false);

  const title = useWatch({
    control: form.control,
    name: 'title',
  });
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

  const debouncedTitle = useDebounce(title);
  const slugifiedTitle = useMemo(() => {
    return slugify(title, {
      lower: true,
      strict: true,
    });
  }, [debouncedTitle]);

  const { data: generatedSlugValidated, isFetching: generatedSlugFetching } =
    useQuery({
      ...slugCheckQuery({ slug: slugifiedTitle, check: false }),
      enabled: !!(!!title && !isEditing) && !slug,
      retry: false,
    });

  useEffect(() => {
    if (generatedSlugValidated?.data.slug) {
      console.log('is this running?');
      form.setValue('slug', generatedSlugValidated.data.slug, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [generatedSlugValidated]);

  const debouncedSlug = useDebounce(slug);
  const { isError: isSlugCheckError, isFetching: slugCheckFetching } = useQuery(
    {
      ...slugCheckQuery({ slug: debouncedSlug, check: true, id: listingId }),
      enabled: isValidated && !!!isEditing && !!debouncedSlug,
      retry: false,
    },
  );

  useEffect(() => {
    if (isSlugCheckError) {
      if (slug === '') return;
      form.setError('slug', {
        message: 'Slug already exists. Please try another.',
        type: 'manual',
      });
    }
  }, [isSlugCheckError, debouncedSlug]);

  useEffect(() => {
    console.log('slugCheckFetching', slugCheckFetching);
  }, [slugCheckFetching]);

  useEffect(() => {
    async function validateSlug() {
      setIsValidated(false);
      const validated = await form.trigger('slug');
      setIsValidated(validated);
    }
    validateSlug();
  }, [slug]);
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
                  disabled={!!publishedAt || generatedSlugFetching}
                  onBlur={() => null}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                />
                {slugCheckFetching || generatedSlugFetching ? (
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
