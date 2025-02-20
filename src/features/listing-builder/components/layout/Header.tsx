import { usePrivy } from '@privy-io/react-auth';
import { useIsFetching } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChevronLeft, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import { UserMenu } from '@/features/navbar/components/UserMenu';

import {
  hideAutoSaveAtom,
  isDraftSavingAtom,
  isEditingAtom,
  previewAtom,
} from '../../atoms';
import { useListingForm } from '../../hooks';
import { PrePublish } from '../Form/PrePublish/Modal';
import { StatusBadge } from './StatusBadge';

export function Header() {
  const { authenticated, ready } = usePrivy();
  const posthog = usePostHog();
  const isDraftSaving = useAtomValue(isDraftSavingAtom);
  const setShowPreview = useSetAtom(previewAtom);
  const form = useListingForm();
  const id = useWatch({
    control: form.control,
    name: 'id',
  });
  const isEditing = useAtomValue(isEditingAtom);
  const hideAutoSave = useAtomValue(hideAutoSaveAtom);
  const isSlugLoading = useIsFetching({ queryKey: ['slug'] }) > 0;

  return (
    <div className="bg-background hidden border-b md:block">
      <div className={cn('mx-auto flex w-full justify-between px-6 py-2')}>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            onClick={() => posthog.capture('homepage logo click_universal')}
            className="flex items-center gap-3 hover:no-underline"
          >
            <img
              src="/assets/logo.svg"
              alt="Superteam Earn"
              className="h-[1.4rem] w-auto cursor-pointer object-contain"
            />
            <div className="h-6 w-[1.5px] bg-slate-300" />
            <p className="text-sm tracking-[1.5px] text-slate-600">SPONSORS</p>
          </Link>
          <Link href="/dashboard/listings">
            <Button variant="outline">
              <ChevronLeft /> Go Back
            </Button>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 py-2">
          {!ready && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}
          {ready && authenticated && (
            <>
              {!isEditing && (
                <p className="w-20 text-sm font-medium text-slate-400">
                  {isDraftSaving ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    <>{hideAutoSave ? '' : 'auto saved'}</>
                  )}
                </p>
              )}
              <StatusBadge />
              {!isEditing && (
                <Tooltip
                  content={'Please fix slug to visit preview'}
                  disabled={!form.formState.errors.slug}
                >
                  <Button
                    variant="outline"
                    className="ph-no-capture text-slate-400"
                    disabled={
                      isDraftSaving ||
                      !id ||
                      !!form.formState.errors.slug ||
                      isSlugLoading ||
                      hideAutoSave
                    }
                    onClick={() => {
                      posthog.capture('preview_listing');
                      setShowPreview(true);
                    }}
                  >
                    <Eye />
                    Preview
                  </Button>
                </Tooltip>
              )}
              <PrePublish />
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
