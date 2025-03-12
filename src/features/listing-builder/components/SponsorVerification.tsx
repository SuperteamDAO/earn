import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { useUser } from '@/store/user';

import { confirmModalAtom } from '../atoms';
import { SponsorVerificationForm } from './Form/SponsorVerificationForm';
import { UnderVerificationModal } from './Modals/UnderVerficationModal';

export const SponsorVerification = () => {
  const [confirmModal] = useAtom(confirmModalAtom);

  const { user } = useUser();
  useEffect(() => {
    console.log(
      'user sponsor verification info - ',
      user?.currentSponsor?.verificationInfo,
    );
  }, [user]);

  if (!confirmModal || confirmModal === 'SUCCESS') {
    return null;
  }

  return confirmModal === 'VERIFICATION_SHOW_FORM' &&
    !user?.currentSponsor?.verificationInfo ? (
    <SponsorVerificationForm />
  ) : (
    <UnderVerificationModal />
  );
};
