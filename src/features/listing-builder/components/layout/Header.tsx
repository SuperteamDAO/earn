import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { usePostHog } from "posthog-js/react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils";
import {StatusBadge} from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, Loader2 } from "lucide-react";
import { PrePublish } from "../Form/PrePublish";
import { useListingForm } from "../../hooks";
import { useAtomValue, useSetAtom } from "jotai";
import { isDraftSavingAtom, previewAtom } from "../../atoms";
import { useWatch } from "react-hook-form";

const UserMenu = dynamic(() =>
  import('@/features/navbar').then((mod) => mod.UserMenu)
);

export function Header() {
  const { data: session, status } = useSession();
  const posthog = usePostHog();
  const isDraftSaving = useAtomValue(isDraftSavingAtom)
  const setShowPreview = useSetAtom(previewAtom)
  const form = useListingForm()
  const id = useWatch({
    control: form.control,
    name: 'id'
  })

  return (
    <div className="hidden border-b bg-background lg:block">
      <div className={cn(
        "mx-auto flex w-full justify-between px-6 py-2",
      )}>
        <div className="flex items-center gap-6">
          <NextLink 
            href="/"
            onClick={() => posthog.capture('homepage logo click_universal')}
            className="flex items-center gap-3 hover:no-underline"
          >
            <img
              src="/assets/logo/logo.svg"
              alt="Superteam Earn"
              className="h-5 w-auto cursor-pointer object-contain"
            />
            <Separator orientation="vertical" className="h-6 w-[3px]" />
            <span className="text-sm tracking-wider">
              SPONSORS
            </span>
          </NextLink>
          <NextLink href='/dashboard/listings'>
            <Button variant='outline'>
              <ChevronLeft /> Go Back
            </Button>
          </NextLink>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 py-2">
          {status === 'loading' && !session && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}
          {status === 'authenticated' && session && (
            <>
              <StatusBadge />
              <p className='text-sm text-slate-400 font-medium w-20'>
                {isDraftSaving ? (
                  <Loader2 className="animate-spin mx-auto w-4 h-4" />
                ): "auto saved"}
              </p>
              <Button variant='outline' className='text-slate-400'
                disabled={isDraftSaving || !id}
                onClick={() => {
                  setShowPreview(true)
                }}
              >
                <Eye />
                Preview
              </Button>
              <PrePublish />
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
