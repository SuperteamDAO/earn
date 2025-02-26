import { type GrantApplication } from '@prisma/client';
import { useAtom } from 'jotai';
import { X } from 'lucide-react';
import { useRef } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { applicationStateAtom } from '../atoms/applicationStateAtom';
import { type Grant } from '../types';
import { ApplicationModal } from './Modals/ApplicationModal';
import { KYCModal } from './Modals/KYCModal';
import { TrancheFormModal } from './Modals/TrancheFormModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grant: Grant;
  editableGrantApplication?: GrantApplication;
  applicationId?: string;
  tranches?: number;
}

export const GrantModal = ({
  isOpen,
  onClose,
  grant,
  editableGrantApplication,
  applicationId,
  tranches,
}: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [applicationState] = useAtom(applicationStateAtom);

  const detailStates = ['APPLIED', 'ALLOW NEW', 'ALLOW EDIT'];
  const newTrancheFormStates =
    tranches && tranches > 2
      ? ['KYC APPROVED', 'TRANCHE1 PAID', 'TRANCHE2 PAID']
      : ['KYC APPROVED', 'TRANCHE1 PAID'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideCloseIcon
        className="max-w-xl p-0 md:max-h-[90svh]"
        ref={modalRef}
      >
        <X
          className="absolute right-4 top-7 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6"
          onClick={onClose}
        />
        {detailStates.includes(applicationState) && (
          <ApplicationModal
            grant={grant}
            grantApplication={editableGrantApplication}
            modalRef={modalRef}
            onClose={onClose}
          />
        )}
        {applicationState === 'KYC PENDING' && (
          <KYCModal
            applicationId={applicationId!}
            grantId={grant.id}
            onClose={onClose}
          />
        )}
        {newTrancheFormStates.includes(applicationState) && (
          <TrancheFormModal
            grant={grant}
            applicationId={applicationId!}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
