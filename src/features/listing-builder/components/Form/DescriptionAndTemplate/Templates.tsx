import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChevronRight, Eye, LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { Wand } from '@/svg/wand';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { isCreateListingAllowedQuery } from '@/features/listing-builder/queries/is-create-allowed';
import { listingTemplatesQuery } from '@/features/listing-builder/queries/listing-templates';
import { cleanTemplate } from '@/features/listing-builder/utils/form';

import { isAutoGenerateOpenAtom, isEditingAtom } from '../../../atoms';
import { useListingForm } from '../../../hooks';

export function Templates() {
  const posthog = usePostHog();
  const { user } = useUser();
  const router = useRouter();

  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const id = useWatch({
    control: form.control,
    name: 'id',
  });
  const { data: templates = [], isLoading: templatesLoading } = useQuery(
    listingTemplatesQuery(type || 'bounty'),
  );
  type ListingTemplate = (typeof templates)[0];

  const {
    data: isCreateListingAllowed,
    refetch: isCreateListingAllowedRefetch,
  } = useQuery(isCreateListingAllowedQuery);

  useEffect(() => {
    isCreateListingAllowedRefetch();
  }, [user]);

  const isEditing = useAtomValue(isEditingAtom);
  const isDisabled =
    isCreateListingAllowed !== undefined &&
    isCreateListingAllowed === false &&
    user?.role !== 'GOD' &&
    !isEditing;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(router.pathname === '/dashboard/new' && type !== 'hackathon');
  }, [router.pathname]);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ListingTemplate | null>(null);
  const [isStartFromScratchDialogOpen, setIsStartFromScratchDialogOpen] =
    useState(false);
  const setAutoGenerateOpen = useSetAtom(isAutoGenerateOpenAtom);

  const applyTemplate = async (templateToApply: ListingTemplate) => {
    if (!templateToApply) return;
    try {
      await posthog.capture('template_sponsor');
      const currentValues = form.getValues();
      const cleanedTemplate = cleanTemplate(
        templateToApply as any,
        currentValues,
      );

      form.reset(cleanedTemplate as any);
      await form.saveDraft();
    } catch (error) {
      console.error('Error applying template', { error });
    }
  };

  const handleUseClick = (template: ListingTemplate) => {
    if (id) {
      setSelectedTemplate(template);
      setIsConfirmDialogOpen(true);
    } else {
      applyTemplate(template);
      setOpen(false);
    }
  };

  const handleStartFromScratch = () => {
    if (id) {
      setIsStartFromScratchDialogOpen(true);
    } else {
      posthog.capture('start from scratch_sponsor');
      form.resetForm();
      setOpen(false);
    }
  };
  const handleAutoGenerate = () => {
    setAutoGenerateOpen(true);
    posthog.capture('template_auto-generate');
    setOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(e) => {
          if (!isDisabled) setOpen(e);
        }}
      >
        {type !== 'hackathon' && !isEditing && (
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-600"
              size="sm"
            >
              <LayoutGrid className="fill-blue-600" />
              <span>Browse Templates</span>
            </Button>
          </DialogTrigger>
        )}
        <DialogContent
          className="invisible w-max max-w-none p-8 md:visible"
          hideCloseIcon={isDisabled}
          classNames={{
            overlay: 'invisible md:visible',
          }}
        >
          <DialogHeader className="flex flex-row justify-between">
            <div className="space-y-2">
              <DialogTitle>
                {isDisabled ? (
                  <>You cannot create a listing</>
                ) : (
                  <>Start with Templates</>
                )}
              </DialogTitle>

              <DialogDescription className="max-w-2xl">
                {isDisabled ? (
                  <p className="text-red-500">
                    Creating a new listing has been temporarily locked for you
                    since you have 5 listings which are {`“In Review”`}. Please
                    announce the winners for such listings to create new
                    listings.
                  </p>
                ) : (
                  <>Go live in ~2 minutes by using our existing template.</>
                )}
              </DialogDescription>
            </div>
            {isDisabled && (
              <div>
                <Link href="/dashboard/listings">
                  <Button variant="default" className="text-sm">
                    Go to Dashboard <ChevronRight />
                  </Button>
                </Link>
              </div>
            )}
          </DialogHeader>
          <div className="mt-4">
            <div className="grid max-h-[80vh] gap-6 overflow-y-auto md:grid-cols-3 xl:grid-cols-4">
              <DialogClose asChild>
                <Button
                  className="ph-no-capture flex h-full w-60 flex-col items-center justify-center gap-4 bg-white text-slate-500 hover:text-slate-700"
                  variant="outline"
                  disabled={isDisabled}
                  onClick={handleStartFromScratch}
                >
                  <Plus className="!size-7" />
                  <span className="text-base font-medium">
                    Start from Scratch
                  </span>
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  className="ph-no-capture relative flex h-full w-60 flex-col items-center justify-center gap-4 bg-white text-slate-500 hover:text-slate-700 focus-visible:ring-0"
                  variant="outline"
                  disabled={isDisabled}
                  onClick={handleAutoGenerate}
                >
                  <Wand className="!size-6" />
                  <span className="text-base font-medium">Auto Generate</span>
                </Button>
              </DialogClose>
              {templatesLoading &&
                Array(5)
                  .fill(1)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex h-64 w-60 flex-col rounded-lg border"
                    >
                      <Skeleton className="h-2/4" />
                      <div className="flex h-2/4 w-full flex-col gap-2 p-4">
                        <Skeleton className="h-2/6 w-2/4" />
                        <div className="flex h-2/5 gap-2">
                          <Skeleton className="h-full w-1/4" />
                          <Skeleton className="h-full w-3/4" />
                        </div>
                        <div className="flex h-2/4 gap-2">
                          <Skeleton className="h-full w-2/4" />
                          <Skeleton className="h-full w-2/4" />
                        </div>
                      </div>
                    </div>
                  ))}

              {templates.map((template) => {
                const sponsors = [
                  ...new Set(template?.Bounties?.map((b) => b.sponsor)),
                ];
                const uniqueSponsors = sponsors.slice(0, 3);

                return (
                  <Card key={template.id} className="w-60">
                    <CardHeader
                      className={cn(
                        'flex h-28 items-center justify-center text-4xl',
                      )}
                      style={{
                        backgroundColor: template.color || 'white',
                      }}
                    >
                      {template.emoji}
                    </CardHeader>

                    <CardContent className="mt-4 space-y-4">
                      <div className="">
                        <h3 className="line-clamp-2 h-12 font-medium text-slate-700">
                          {template.title}
                        </h3>
                        {uniqueSponsors.length > 0 ? (
                          <div className="mt-1 flex items-center gap-4">
                            <div className="flex">
                              {uniqueSponsors.map((sponsor, idx) => (
                                <div
                                  key={sponsor.name}
                                  className={cn(
                                    'h-6 w-6 rounded-full border border-white',
                                    idx !== 0 && '-ml-3',
                                  )}
                                >
                                  <LocalImage
                                    src={sponsor.logo || ''}
                                    alt={sponsor.name}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            <span className="line-clamp-2 text-xs text-slate-400">
                              Used by {uniqueSponsors[0]?.name}
                              {uniqueSponsors[1] &&
                                ` & ${uniqueSponsors[1].name}`}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">{`Pre-fill info with "${template.title}" template`}</p>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-slate-500"
                        asChild
                      >
                        <Link
                          href={`${getURL()}templates/listings/${template.slug}`}
                          target="_blank"
                        >
                          <Eye />
                          <span>Preview</span>
                        </Link>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="ph-no-capture !w-full flex-1"
                        disabled={isDisabled}
                        onClick={() => handleUseClick(template)}
                      >
                        Use
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>

        <AlertDialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apply Template?</AlertDialogTitle>
              <AlertDialogDescription>
                Applying this template will overwrite the current description
                and skills. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>
                Cancel
              </AlertDialogCancel>
              <DialogClose asChild>
                <AlertDialogAction
                  onClick={async () => {
                    if (selectedTemplate) {
                      await applyTemplate(selectedTemplate);
                    }
                    setSelectedTemplate(null);
                  }}
                >
                  Apply Template
                </AlertDialogAction>
              </DialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog
          open={isStartFromScratchDialogOpen}
          onOpenChange={setIsStartFromScratchDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start from Scratch?</AlertDialogTitle>
              <AlertDialogDescription>
                Starting from scratch will reset all your current listing
                details. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <DialogClose asChild>
                <AlertDialogAction
                  onClick={() => {
                    posthog.capture('start from scratch_sponsor');
                    form.resetForm();
                    setOpen(false);
                  }}
                >
                  Start from Scratch
                </AlertDialogAction>
              </DialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    </>
  );
}
