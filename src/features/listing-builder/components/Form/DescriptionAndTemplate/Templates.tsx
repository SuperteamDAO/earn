import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { ChevronRight, Eye, LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

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
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { getURL } from '@/utils/validUrl';

import { isEditingAtom } from '../../../atoms';
import { useListingForm } from '../../../hooks';
import {
  isCreateListingAllowedQuery,
  listingTemplatesQuery,
} from '../../../queries';
import { cleanTemplate } from '../../../utils';

export function Templates() {
  const posthog = usePostHog();
  const { data: session } = useSession();
  const { user } = useUser();
  const router = useRouter();

  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const { data: templates = [], isLoading: templatesLoading } = useQuery(
    listingTemplatesQuery(type || 'bounty'),
  );

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
    session?.user.role !== 'GOD' &&
    !isEditing;

  const [open, setOpen] = useState(router.pathname === '/dashboard/new');
  useEffect(() => {
    setOpen(router.pathname === '/dashboard/new');
  }, [router.pathname]);

  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (!isDisabled) setOpen(e);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-blue-600 hover:text-blue-600"
          size="sm"
        >
          <LayoutGrid className="fill-blue-600" />
          Browse Templates
        </Button>
      </DialogTrigger>
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
                  announce the winners for such listings to create new listings.
                </p>
              ) : (
                <>
                  Save hours of work writing a description, use existing tried{' '}
                  {'&'}
                  tested templates
                </>
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
            <DialogClose>
              <Button
                className="ph-no-capture flex h-full w-60 flex-col items-center justify-center gap-4 bg-white text-slate-500 hover:text-slate-700"
                variant="outline"
                disabled={isDisabled}
                onClick={() => {
                  posthog.capture('start from scratch_sponsor');
                }}
              >
                <Plus className="h-6 w-6" />
                <span className="text-base font-medium">
                  Start from Scratch
                </span>
              </Button>
            </DialogClose>
            {templatesLoading &&
              Array(7)
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
                    <div>
                      <h3 className="font-medium text-slate-700">
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
                                <img
                                  src={sponsor.logo || ''}
                                  alt={sponsor.name}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">
                            Used by {uniqueSponsors[0]?.name}
                            {uniqueSponsors[1] &&
                              ` & ${uniqueSponsors[1].name}`}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          {`Pre-fill info with "${template.title}" template`}
                        </p>
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
                        Preview
                      </Link>
                    </Button>
                    <DialogClose asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="ph-no-capture flex-1"
                        disabled={isDisabled}
                        onClick={() => {
                          posthog.capture('template_sponsor');
                          console.log('template', template);
                          form.reset(
                            cleanTemplate(
                              template as any,
                              form.getValues(),
                            ) as any,
                          );
                          form.saveDraft();
                        }}
                      >
                        Use
                      </Button>
                    </DialogClose>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
