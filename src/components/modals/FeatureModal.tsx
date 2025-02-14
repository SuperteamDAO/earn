import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUpdateUser, useUser } from '@/store/user';

import { WalletFeature } from './WalletFeature';

export const FeatureModal = () => {
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    updateUser.mutateAsync({ featureModalShown: true });
  };

  useEffect(() => {
    const targetDate = new Date('2025-02-09T00:00:00.000Z');
    const userCreatedDate = user?.createdAt ? new Date(user.createdAt) : null;

    if (
      user &&
      user.featureModalShown === false &&
      user.isTalentFilled &&
      userCreatedDate &&
      userCreatedDate < targetDate
    ) {
      setIsOpen(true);
    }
  }, [user]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px] rounded-lg p-0">
        <WalletFeature onClick={handleClose} />
      </DialogContent>
    </Dialog>
  );
};
