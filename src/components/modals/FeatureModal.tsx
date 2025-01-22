import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUpdateUser, useUser } from '@/store/user';

import { ExternalImage } from '../ui/cloudinary-image';

export const FeatureModal = () => {
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    updateUser.mutateAsync({ featureModalShown: true });
  };

  useEffect(() => {
    if (user?.featureModalShown === false) {
      setIsOpen(true);
    }
  }, [user]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[480px] overflow-hidden rounded-lg p-0">
        <div className="w-full bg-purple-50 p-8">
          <ExternalImage
            src="/ScoutAnnouncement.png"
            alt="Scouts Announcement Illustration"
            className="h-full w-[92%]"
          />
        </div>

        <div className="flex flex-col items-start gap-3 p-6">
          <p className="text-lg font-semibold">Introducing Scout</p>
          <p className="pb-4 text-slate-500">
            A curated list of the best talent on Superteam Earn that you can
            invite to participate in your listings to get high quality
            submissions! Add a new listing, or check out any of your currently
            live listings to try Scout.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
