import { useAtom } from 'jotai';

import { confirmModalAtom } from '../atoms';
import { SponsorVerificationForm } from './Form/SponsorVerificationForm';
import { UnderVerificationModal } from './Modals/UnderVerficationModal';

export const SponsorVerification = () => {
  const [confirmModal] = useAtom(confirmModalAtom);

  if (!confirmModal || confirmModal === 'SUCCESS') {
    return null;
  }

  return confirmModal === 'VERIFICATION_SHOW_FORM' ? (
    <SponsorVerificationForm />
  ) : (
    <UnderVerificationModal />
  );
};
