import { usePrivy } from '@privy-io/react-auth';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUpdateUser, useUser } from '@/store/user';

import {
  popupOpenAtom,
  popupTimeoutAtom,
} from '@/features/conversion-popups/atoms';

import { CreditFeature } from './CreditFeature';

export const FeatureModal = ({
  isAnyModalOpen = false,
}: {
  isAnyModalOpen?: boolean;
  isAuth?: boolean;
}) => {
  const { user } = useUser();
  const { authenticated, ready } = usePrivy();

  const updateUser = useUpdateUser();
  const [isPopupOpen, setPopupOpen] = useAtom(popupOpenAtom);
  const popupTimeout = useAtomValue(popupTimeoutAtom);
  const [isSponsor, setIsSponsor] = useState(false);
  const talentModalShownRef = useRef(false);

  const router = useRouter();

  const SPONSOR_LOCAL_STORAGE_KEY = 'sponsor-credit-feature-shown';
  const isDashboardRoute = router.pathname.startsWith('/dashboard');

  const handleClose = () => {
    setPopupOpen(false);
    if (popupTimeout) {
      popupTimeout.resume();
    }

    if (isSponsor) {
      localStorage.setItem(SPONSOR_LOCAL_STORAGE_KEY, 'true');
    } else {
      talentModalShownRef.current = true;
      updateUser.mutateAsync({ featureModalShown: true });
    }
  };

  useEffect(() => {
    if (
      user &&
      user.featureModalShown === false &&
      user.isTalentFilled &&
      !isPopupOpen &&
      !isDashboardRoute &&
      !talentModalShownRef.current &&
      ready &&
      authenticated
    ) {
      setIsSponsor(false);
      setPopupOpen(true);
      if (popupTimeout) {
        popupTimeout.pause();
      }
      return;
    }
    const sponsorModalShown = localStorage.getItem(SPONSOR_LOCAL_STORAGE_KEY);

    if (
      !sponsorModalShown &&
      isDashboardRoute &&
      user &&
      !!user.currentSponsorId &&
      !isPopupOpen &&
      ready &&
      authenticated
    ) {
      setIsSponsor(true);
      setPopupOpen(true);
      if (popupTimeout) {
        popupTimeout.pause();
      }
    }
  }, [user, isPopupOpen, popupTimeout, router.pathname]);

  if (isAnyModalOpen) return null;

  return (
    <Dialog open={isPopupOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px] rounded-lg p-0">
        <CreditFeature onClick={handleClose} isSponsor={isSponsor} />
      </DialogContent>
    </Dialog>
  );
};
