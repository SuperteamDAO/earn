import dayjs from 'dayjs';
import { useAtom } from 'jotai';

import { confirmModalAtom } from '../atoms';
import { SponsorVerificationForm } from './Form/SponsorVerificationForm';
import { UnderVerificationModal } from './Modals/UnderVerficationModal';

export const SponsorVerification = () => {
  const date = '02-08-2025';
  const isAfterNewVerificationDate = dayjs().isAfter(dayjs(date));
  const [confirmModal] = useAtom(confirmModalAtom);

  if (confirmModal !== 'VERIFICATION') {
    return null;
  }

  return isAfterNewVerificationDate ? (
    <SponsorVerificationForm />
  ) : (
    <UnderVerificationModal />
  );
};
