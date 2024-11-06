import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { usePostHog } from "posthog-js/react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils";
import {StatusBadge} from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const UserMenu = dynamic(() =>
  import('@/features/navbar').then((mod) => mod.UserMenu)
);

export function Header() {
  const { data: session, status } = useSession();
  const posthog = usePostHog();

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
              <Button variant='outline' className='text-slate-400'>
                <Eye />
                Preview
              </Button>
              <Button className='px-6'>
                Continue
              </Button>
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
