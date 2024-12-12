import { type CompensationType } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Link } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
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
import { LocalImage } from '@/components/ui/local-image';
import { useDebounce } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getListingIcon } from '@/features/listings';

import { hackathonAtom, isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { slugCheckQuery } from '../../queries';
import { calculateTotalRewardsForPodium, getSuggestions } from '../../utils';

const typeOptions = [
  { value: 'bounty', label: 'Bounty' },
  { value: 'project', label: 'Project' },
] as const;

export function TitleAndType() {
  const form = useListingForm();
  const posthog = usePostHog();
  const type = useWatch({ name: 'type', control: form.control });
  const title = useWatch({ control: form.control, name: 'title' });
  const listingId = useWatch({ control: form.control, name: 'id' });

  const suggestions = useMemo(() => {
    return getSuggestions(title, type);
  }, [title, type]);

  const isEditing = useAtomValue(isEditingAtom);
  const placeholder = useMemo(() => {
    if (type === 'project') return 'Frontend Development for Superteam';
    else return 'Write a Deep Dive on IBRL';
  }, [type]);

  const debouncedTitle = useDebounce(title);
  const slugifiedTitle = useMemo(() => {
    return slugify(debouncedTitle, {
      lower: true,
      strict: true,
    });
  }, [debouncedTitle]);

  const queryEnabled = useMemo(
    () => !!(!!slugifiedTitle && !isEditing),
    [slugifiedTitle, isEditing],
  );
  const slugCheckQueryResult = useMemo(() => {
    return slugCheckQuery({
      slug: slugifiedTitle,
      check: false,
      id: listingId || undefined,
    });
  }, [slugifiedTitle, listingId]);
  const { data: generatedSlugValidated } = useQuery({
    ...slugCheckQueryResult,
    enabled: queryEnabled,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (generatedSlugValidated?.data.slug) {
      form.setValue('slug', generatedSlugValidated.data.slug, {
        shouldValidate: true,
        shouldDirty: true,
      });
      form.saveDraft();
    }
  }, [generatedSlugValidated]);

  return (
    <FormField
      name="title"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel isRequired>Listing Title</FormLabel>
            <div className="flex w-full rounded-md border ring-primary has-[:focus]:ring-1">
              <Type />
              <FormControl>
                <Input
                  placeholder={placeholder}
                  {...field}
                  className="mt-0 border-none focus-visible:ring-0"
                  defaultValue={''}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                />
              </FormControl>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                {form.formState.errors.title ? (
                  <FormMessage />
                ) : (
                  !isEditing &&
                  suggestions.length > 0 && (
                    <div className="flex flex-shrink gap-1 text-[0.7rem] font-medium italic text-emerald-600">
                      <p className="w-max">Reference Listings:</p>
                      <div className="flex flex-wrap items-center gap-x-1.5">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.link}
                            className="flex items-center gap-2"
                          >
                            <a
                              className="ph-no-capture underline"
                              href={suggestion.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                posthog.capture('similar listings_sponsor');
                              }}
                            >
                              {suggestion.label}
                              {suggestions.length - 1 !== index && ';'}
                            </a>
                            {suggestions.length - 1 === index && (
                              <Link className="text-slate-400" size={13} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="shrink-0 whitespace-nowrap text-right text-xs text-slate-400">
                {100 - (title?.length || 0)} characters left
              </div>
            </div>
          </FormItem>
        );
      }}
    />
  );
}

function Type() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);
  const hackathon = useAtomValue(hackathonAtom);
  const [prevCompType, setPrevCompType] = useState<CompensationType>('fixed');
  return (
    <FormField
      name="type"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="w-fit">
            <FormControl>
              <Select
                value={field.value}
                disabled={isEditing}
                onValueChange={(e) => {
                  field.onChange(e);
                  if (e === 'hackathon') {
                    if (hackathon) {
                      form.setValue('hackathonId', hackathon.id);
                    }
                  } else {
                    form.setValue('hackathonId', undefined);
                  }
                  const values = form.getValues();
                  setPrevCompType(values.compensationType);
                  if (e !== 'project') {
                    form.setValue('compensationType', 'fixed');
                    form.setValue(
                      'rewardAmount',
                      calculateTotalRewardsForPodium(
                        values.rewards || {},
                        values.maxBonusSpots || 0,
                      ),
                    );
                  } else {
                    form.setValue('compensationType', prevCompType);
                    if (prevCompType === 'fixed') {
                      form.setValue('rewardAmount', values.rewards?.[1]);
                    } else {
                      form.setValue('rewardAmount', undefined);
                    }
                  }

                  if (!!form.getValues().id) form.saveDraft();
                }}
              >
                <SelectTrigger className="h-full w-32 rounded-none border-0 border-r focus:ring-0">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2 text-xs">
                        <LocalImage
                          src={getListingIcon(value)}
                          alt={value}
                          className="h-4 w-4"
                        />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {hackathon && (
                    <SelectItem key={'hackathon'} value={'hackathon'}>
                      <div className="flex items-center gap-2 text-xs">
                        <LocalImage
                          src={hackathon.altLogo || ''}
                          alt={hackathon.name}
                          className="h-4 w-4 object-contain"
                        />
                        <span className="max-w-20 truncate">
                          {hackathon.name}
                        </span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}
