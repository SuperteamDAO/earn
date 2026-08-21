import { useAtom } from 'jotai';
import { X } from 'lucide-react';
import { useRef } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';

import { applicationStateAtom } from '../atoms/applicationStateAtom';
import { type Grant } from '../types';
import { ApplicationModal } from './Modals/ApplicationModal';
import { KYCModal } from './Modals/KYCModal';
import { TrancheFormModal } from './Modals/TrancheFormModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grant: Grant;
  editableGrantApplication?: GrantApplicationModel;
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
  const [applicationState] = useAtom(applicationStateAtom(grant.id));

  const detailStates = ['APPLIED', 'ALLOW NEW', 'ALLOW EDIT'];
  const newTrancheFormStates =
    tranches === 4
      ? ['KYC APPROVED', 'TRANCHE1 PAID', 'TRANCHE2 PAID', 'TRANCHE3 PAID']
      : tranches && tranches === 3
        ? ['KYC APPROVED', 'TRANCHE1 PAID', 'TRANCHE2 PAID']
        : ['KYC APPROVED', 'TRANCHE1 PAID'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideCloseIcon
        unsetDefaultPosition
        className="inset-x-0 bottom-0 !max-h-none max-w-xl overflow-hidden !overflow-y-visible rounded-t-lg p-0 sm:top-[50%] sm:right-auto sm:bottom-auto sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg"
        ref={modalRef}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <ScrollArea className="h-full max-h-[100svh] md:h-auto md:max-h-[90svh]">
          <X
            className="absolute top-7 right-4 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6"
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
