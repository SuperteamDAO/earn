import { useIsFetching, useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { CheckIcon, Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

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
              <FormLabel className="">Customise URL (Slug)</FormLabel>
              <FormDescription className="cursor-pointer">
                <button
                  className="max-w-[28rem] cursor-pointer truncate text-slate-400"
                  onClick={() => {
                    toast.promise(
                      async () => {
                        await navigator.clipboard.writeText(
                          `https://earn.superteam.fun/listing/${slug}`,
                        );
                      },
                      {
                        loading: 'Copying Listing URL...',
                        success: 'Listing URL copied!',
                        error: 'Failed to copy Listing URL!',
                      },
                    );
                  }}
                >
                  <span>https://earn.superteam.fun/listing/</span>
                  <span className="underline underline-offset-2">{slug}</span>
                </button>
              </FormDescription>
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="write-a-twitter-thread-on-Solana"
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
                  <Loader2 className="absolute top-1.5 right-2 animate-spin text-slate-300" />
                ) : (
                  form.formState.errors.slug === undefined &&
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
