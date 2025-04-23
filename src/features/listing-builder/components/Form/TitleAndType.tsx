import type { CompensationType } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Link } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import slugify from 'slugify';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

import { getListingIcon } from '@/features/listings/utils/getListingIcon';

import { hackathonsAtom, isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { slugCheckQuery } from '../../queries/slug-check';
import { calculateTotalRewardsForPodium } from '../../utils/rewards';
import { getSuggestions } from '../../utils/suggestions';

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

  const { dirtyFields } = form.formState;
  const isTitleDirty = dirtyFields.title;

  const queryEnabled = useMemo(() => {
    return !!(!!slugifiedTitle && !isEditing && isTitleDirty);
  }, [slugifiedTitle, isEditing, isTitleDirty]);

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
    if (generatedSlugValidated?.data.slug && isTitleDirty) {
      form.setValue('slug', generatedSlugValidated.data.slug, {
        shouldValidate: true,
        shouldDirty: true,
      });
      form.saveDraft();
    }
  }, [generatedSlugValidated, isTitleDirty]);

  return (
    <FormField
      name="title"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel isRequired>Listing Title</FormLabel>
            <div className="ring-primary flex w-full rounded-md border has-focus:ring-1">
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
                    <div className="flex shrink gap-1 text-[0.7rem] font-medium text-emerald-600 italic">
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
              <div className="shrink-0 text-right text-xs whitespace-nowrap text-slate-400">
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
  const hackathons = useAtomValue(hackathonsAtom);
  const [prevCompType, setPrevCompType] = useState<CompensationType>('fixed');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<string | null>(
    null,
  );
  const hackathonId = useWatch({
    name: 'hackathonId',
    control: form.control,
  });
  const compensationType = useWatch({
    name: 'compensationType',
    control: form.control,
  });
  const currentHackathon = useMemo(() => {
    return hackathons?.find((h) => h.id === hackathonId);
  }, [hackathonId, hackathons]);

  const handleTypeChange = (newType: string) => {
    if (newType !== 'bounty' && newType !== 'project') {
      form.setValue('type', 'hackathon');
      const hackathon = hackathons?.find((s) => s.slug === newType);
      if (!!hackathon) {
        form.setValue('hackathonId', hackathon.id);
        form.setValue('eligibility', hackathon?.eligibility as any);
      }
    } else {
      form.setValue('type', newType);
      form.setValue('hackathonId', undefined);
    }
    if (newType === 'bounty') {
      form.setValue('eligibility', []);
    }
    if (newType === 'project') {
      form.setValue('eligibility', []);
    }
    const values = form.getValues();
    setPrevCompType(values.compensationType);
    if (newType !== 'project') {
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

    form.clearErrors([
      'rewards',
      'eligibility',
      'rewardAmount',
      'minRewardAsk',
      'maxRewardAsk',
      'token',
      'maxBonusSpots',
    ]);
    if (!!form.getValues().id) form.saveDraft();
  };

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
                onValueChange={(newValue) => {
                  if (newValue === field.value) return;
                  if (newValue === currentHackathon?.slug) return;
                  if (newValue === 'hackathon') return;
                  if (newValue === '') return;
                  setPendingTypeChange(newValue);
                  setConfirmDialogOpen(true);
                }}
              >
                <SelectTrigger className="h-full w-32 rounded-none border-0 border-r focus:ring-0">
                  <div className="flex items-center gap-2">
                    {field.value !== 'hackathon' ? (
                      <SelectValue />
                    ) : (
                      <SelectValue>
                        <div className="flex items-center gap-2 text-xs">
                          <LocalImage
                            src={getListingIcon('hackathon')}
                            alt={'hackahton'}
                            className="h-4 w-4"
                          />
                          <span className="max-w-20 truncate">
                            {currentHackathon?.name}
                          </span>
                        </div>
                      </SelectValue>
                    )}
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
                  {hackathons?.map((hackathon) => (
                    <SelectItem key={hackathon.id} value={hackathon.slug}>
                      <div className="flex items-center gap-2 text-xs">
                        <LocalImage
                          src={getListingIcon('hackathon')}
                          alt={'hackahton'}
                          className="h-4 w-4"
                        />
                        <span className="max-w-20 truncate">
                          {hackathon.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>

            <AlertDialog
              open={confirmDialogOpen}
              onOpenChange={() => setConfirmDialogOpen(false)}
            >
              <AlertDialogContent className="">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Change Listing Type from{' '}
                    <span className="capitalize">{field.value}</span> to{' '}
                    <span className="capitalize">{pendingTypeChange}</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Changing the listing type will affect your listing details.
                    <ul className="list-inside list-disc py-2">
                      {pendingTypeChange === 'project' &&
                        field.value !== 'project' && (
                          <>
                            <li>
                              Your rewards structure will change from Podiums to{' '}
                              <span className="capitalize">{prevCompType}</span>{' '}
                              type
                            </li>
                            <li>
                              Your existing custom questions will be cleared
                            </li>
                          </>
                        )}
                      {pendingTypeChange !== 'project' &&
                        field.value === 'project' && (
                          <>
                            <li>
                              Your rewards structure will change from{' '}
                              <span className="capitalize">
                                {compensationType}
                              </span>{' '}
                              type to Podiums
                            </li>
                            <li>
                              Your existing custom questions will be cleared
                              {pendingTypeChange !== 'bounty' && (
                                <span>
                                  {' '}
                                  and replaced by hackathon custom questions
                                </span>
                              )}
                            </li>
                          </>
                        )}
                      {pendingTypeChange === 'bounty' &&
                        field.value !== 'project' && (
                          <>
                            <li>
                              Your existing custom questions will be cleared
                            </li>
                          </>
                        )}
                      {pendingTypeChange !== 'bounty' &&
                        pendingTypeChange !== 'project' &&
                        field.value === 'bounty' && (
                          <>
                            <li>
                              Your existing custom questions will be cleared and
                              replaced by hackathon custom questions
                            </li>
                          </>
                        )}
                      {pendingTypeChange !== 'bounty' &&
                        pendingTypeChange !== 'project' &&
                        field.value === 'hackathon' && (
                          <>
                            <li>
                              Your existing custom questions will be cleared and
                              replaced by hackathon custom questions
                            </li>
                          </>
                        )}
                    </ul>
                    Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (pendingTypeChange) {
                        handleTypeChange(pendingTypeChange);
                        setPendingTypeChange(null);
                      }
                      setConfirmDialogOpen(false);
                    }}
                  >
                    Yes, Change Type
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </FormItem>
        );
      }}
    />
  );
}
