import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bodyText?: string;
  isSponsor: boolean;
}

export function CompleteProfileModal({
  isOpen,
  onClose,
  bodyText,
  isSponsor,
}: Props) {
  const posthog = usePostHog();
  const router = useRouter();

  const header = isSponsor
    ? 'Add your talent profile'
    : 'Complete your profile';

  const body = isSponsor
    ? 'You already have a sponsor profile, but we need other details from you before proceeding with this action. Doing this will not impact your sponsor profile.'
    : bodyText;

  const CTA = isSponsor ? 'Add Talent Profile' : 'Complete Profile';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-xl bg-white px-6 py-6 shadow-xl sm:max-w-md lg:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{header}</DialogTitle>
        </DialogHeader>

        <div className="px-0">
          <p className="text-slate-500">{body}</p>
        </div>

        <DialogFooter className="px-0 pt-2">
          <Button
            className="ph-no-capture h-10 w-full"
            asChild
            onClick={() => posthog.capture('complete profile_CTA pop up')}
          >
            <Link href={`/new/talent?originUrl=${router.asPath}`}>{CTA}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
