import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { latestActiveSlugQuery } from '@/features/sponsor-dashboard';
import { useUpdateUser, useUser } from '@/store/user';

export const FeatureModal = ({
  isSponsorsRoute = false,
  forceOpen = false,
}: {
  isSponsorsRoute?: boolean;
  forceOpen?: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const [isOpen, setIsOpen] = useState(false);

  const { data: latestActiveSlug } = useQuery({
    ...latestActiveSlugQuery,
    enabled:
      !!user?.currentSponsorId &&
      user.featureModalShown === false &&
      (isSponsorsRoute || !router.pathname.includes('dashboard')),
  });

  useEffect(() => {
    const shouldShowModal = async () => {
      if (
        (user?.currentSponsorId &&
          user.featureModalShown === false &&
          (isSponsorsRoute || !router.pathname.includes('dashboard')) &&
          latestActiveSlug &&
          user.currentSponsor?.isVerified) ||
        forceOpen
      ) {
        if (!searchParams.has('scout')) setIsOpen(true);
        if (!forceOpen) {
          await updateUser.mutateAsync({ featureModalShown: true });
        }
      }
    };

    shouldShowModal();
  }, [user, router.pathname, latestActiveSlug, isSponsorsRoute, forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const onSubmit = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogOverlay />
      <DialogContent className="w-[480px] overflow-hidden rounded-lg">
        <div className="w-full bg-[#faf5ff] p-8">
          <img
            src={ASSET_URL + '/ScoutAnnouncement.png'}
            alt="Scouts Announcement Illustration"
            className="h-full w-[92%]"
          />
        </div>

        <div className="flex flex-col items-start gap-3 p-6">
          <p className="text-lg font-semibold">Introducing Scout</p>
          <p className="text-slate-500">
            A curated list of the best talent on Superteam Earn that you can
            invite to participate in your listings to get high quality
            submissions! Add a new listing, or check out any of your currently
            live listings to try Scout.
          </p>

          {latestActiveSlug ? (
            <Link
              href={`/dashboard/listings/${latestActiveSlug}/submissions?scout`}
              onClick={onSubmit}
              className="w-full"
            >
              <Button className="w-full gap-2 text-sm font-medium">
                Check it out <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full gap-2 text-sm font-medium"
              onClick={onSubmit}
            >
              Good to know!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
