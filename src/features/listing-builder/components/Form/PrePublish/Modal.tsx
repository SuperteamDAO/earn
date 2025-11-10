import { useIsFetching, useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { useUser } from '@/store/user';

import { isCreateListingAllowedQuery } from '@/features/listing-builder/queries/is-create-allowed';
import { type SponsorVerificationSchema } from '@/features/sponsor/utils/sponsorVerificationSchema';

import {
  confirmModalAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isSTAtom,
  listingStatusAtom,
  previewAtom,
  submitListingMutationAtom,
} from '../../../atoms';
import { useListingForm } from '../../../hooks';
import { Foundation } from './Foundation';
import { GeoLock } from './GeoLock';
import { ProOnly } from './ProOnly';
import { ReferredBy } from './ReferredBy';
import { Slug } from './Slug';
import { Visibility } from './Visibility';

export function PrePublish() {
  const isST = useAtomValue(isSTAtom);
  const form = useListingForm();
  const [open, isOpen] = useState(false);
  const status = useAtomValue(listingStatusAtom);

  const isSlugLoading = useIsFetching({ queryKey: ['slug'] }) > 0;

  const isDraftSaving = useAtomValue(isDraftSavingAtom);
  const setConfirmModal = useSetAtom(confirmModalAtom);
  const setShowPreview = useSetAtom(previewAtom);

  const isEditing = useAtomValue(isEditingAtom);

  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const submitListingMutation = useAtomValue(submitListingMutationAtom);

  const router = useRouter();

  const { user } = useUser();

  const {
    data: isCreateListingAllowed,
    refetch: isCreateListingAllowedRefetch,
  } = useQuery(isCreateListingAllowedQuery);

  useEffect(() => {
    isCreateListingAllowedRefetch();
  }, [user]);

  const isDisabledHard = useMemo(
    () =>
      (isCreateListingAllowed !== undefined &&
        isCreateListingAllowed === false &&
        user?.role !== 'GOD' &&
        !isEditing) ||
      status === 'verification failed' ||
      status === 'blocked',
    [isCreateListingAllowed, isEditing, status],
  );

  const [isDisabledSoft, setIsDisabledSoft] = useState(true);

  useEffect(() => {
    if (router.pathname.includes('/dashboard/new')) {
      if (isST) {
        form.setValue('isFndnPaying', true);
      } else {
        form.setValue('isFndnPaying', false);
      }
    }
  }, [isST, router.pathname]);

  useEffect(() => {
    const shouldBeDisabled =
      isDraftSaving ||
      submitListingMutation.isPending ||
      isDisabledHard ||
      submitListingMutation.isSuccess ||
      isSlugLoading;

    if (shouldBeDisabled) {
      setIsDisabledSoft(true);
    } else {
      const timer = setTimeout(() => {
        setIsDisabledSoft(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return () => null;
  }, [
    isDraftSaving,
    submitListingMutation.isPending,
    submitListingMutation.isSuccess,
    isDisabledHard,
    isSlugLoading,
  ]);

  const isDisabledSoftForButtons = useMemo(
    () => !!form.formState.errors.slug || isDisabledSoft,
    [form.formState.errors.slug, isDisabledSoft],
  );

  const isUpdate = useMemo(
    () => !!isEditing || status === 'verifying',
    [isEditing, status],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (isDraftSaving) return;
        isOpen(e);
      }}
    >
      <Tooltip
        content={
          status === 'verification failed' || status === 'blocked' ? (
            <p>Editing this listing is blocked</p>
          ) : (
            <p>
              Creating a new listing has been temporarily locked for you since
              you have 5 listings which are &quot;In Review&quot;. Please
              announce the winners for such listings to create new listings.
            </p>
          )
        }
        disabled={!isDisabledHard}
      >
        <Button
          className="ph-no-capture"
          disabled={isDraftSaving || isDisabledHard}
          onClick={async () => {
            posthog.capture('basics_sponsor');
            if (await form.validateBasics()) isOpen(true);
            else {
              toast.warning('Please resolve all errors to continue');
            }
          }}
        >
          Continue
        </Button>
      </Tooltip>
      <DialogContent className="overflow-y-visible py-4 sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center gap-4">
          <DialogTitle className="relative flex h-5 items-center text-base">
            {isUpdate ? (
              <span>Update Listing</span>
            ) : (
              <span>Publish Listing</span>
            )}
            {isDisabledSoft && (
              <span className="absolute -right-7 flex h-4 w-4 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <Separator className="relativerl w-[100%]" />
        <div className="space-y-4">
          <Visibility />
          <GeoLock />
          <ReferredBy />
          <Slug />
          {isST && type !== 'project' && <Foundation />}
          <ProOnly />
        </div>
        <DialogFooter className="flex w-full pt-20 sm:justify-between">
          {!isEditing && (
            <Button
              variant="outline"
              className="ph-no-capture gap-8"
              disabled={isDisabledSoftForButtons}
              onClick={() => {
                posthog.capture('preview_listing');
                setShowPreview(true);
              }}
            >
              <span>Preview</span> <ExternalLink />{' '}
            </Button>
          )}
          <Button
            className="ml-auto px-12"
            onClick={async () => {
              if (await form.trigger()) {
                try {
                  const data = await form.submitListing();
                  if (isEditing) {
                    posthog.capture('update listing_sponsor');
                    router.push('/dashboard/listings');
                    toast.success('Listing Updated Successfully', {
                      description: 'Redirecting to dashboard',
                    });
                  } else {
                    isOpen(false);
                    if (isUpdate) posthog.capture('update listing_sponsor');
                    else posthog.capture('publish listing_sponsor');
                    if (data.status === 'VERIFYING') {
                      const verificationInfo = user?.currentSponsor
                        ?.verificationInfo as SponsorVerificationSchema;
                      if (
                        !verificationInfo?.fundingSource ||
                        !verificationInfo?.telegram ||
                        !verificationInfo?.superteamLead
                      )
                        setConfirmModal('VERIFICATION_SHOW_FORM');
                      else setConfirmModal('VERIFICATION_SHOW_MODAL');
                    } else {
                      setConfirmModal('SUCCESS');
                    }
                  }
                } catch (error) {
                  console.log(error);
                  toast.error(
                    'Failed to create listing, please try again later',
                    {},
                  );
                }
              }
            }}
            disabled={isDisabledSoftForButtons}
          >
            {submitListingMutation.isPending ||
            submitListingMutation.isSuccess ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isUpdate ? (
              <span>Update</span>
            ) : (
              <span>Publish</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
