import Link from 'next/link';
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

  const header = isSponsor
    ? 'Add your talent profile'
    : 'Complete your profile';

  const body = isSponsor
    ? 'You already have a sponsor profile, but we need other details from you before proceeding with this action. Doing this will not impact your sponsor profile.'
    : bodyText;

  const CTA = isSponsor ? 'Add Talent Profile' : 'Complete Profile';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-xl bg-white px-6 py-3 shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="px-0 py-4 text-xl font-medium text-slate-700">
            {header}
          </DialogTitle>
        </DialogHeader>

        <div className="px-0">
          <p className="text-base leading-relaxed text-slate-500">{body}</p>
        </div>

        <DialogFooter className="px-0 pt-2">
          <Button
            className="ph-no-capture h-11 font-medium"
            asChild
            onClick={() => posthog.capture('complete profile_CTA pop up')}
          >
            <Link href="/new/talent">{CTA}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
