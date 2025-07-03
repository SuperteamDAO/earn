import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { tokenList } from '@/constants/tokenList';

const CustomNumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 100,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  step?: number;
}) => {
  const increment = () => {
    if (max === undefined || value + step <= max) {
      onChange(value + step);
    }
  };

  const decrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
      return;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue === '') {
      onChange(0);
      return;
    }

    const numericValue = parseFloat(newValue);
    onChange(numericValue);
  };

  return (
    <div className="relative w-[160px]">
      <Input
        value={value || ''}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        className="rounded-r-none pr-8 font-semibold text-slate-600"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <div className="absolute top-0 right-1 flex h-full flex-col">
        <button
          type="button"
          onClick={increment}
          className="flex-1 px-1 text-slate-400 hover:text-slate-600"
          aria-label="Increment value"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={decrement}
          className="flex-1 px-1 text-slate-400 hover:text-slate-600"
          aria-label="Decrement value"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

interface ApproveModalProps {
  approveIsOpen: boolean;
  approveOnClose: () => void;
  trancheId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  token: string;
  onApproveTranche: (trancheId: string, approvedAmount: number) => void;
  grantApprovedAmount: number;
  grantTotalPaid: number;
}

export const ApproveTrancheModal = ({
  trancheId,
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  token,
  onApproveTranche,
  grantApprovedAmount,
  grantTotalPaid,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const remainingAmount = grantApprovedAmount - grantTotalPaid;

  const handleAmountChange = (value: number) => {
    if (value > remainingAmount) {
      setWarningMessage(
        `Amount exceeds remaining grant budget (${remainingAmount} ${token})`,
      );
    } else if (value > (ask as number)) {
      setWarningMessage('Approved amount is greater than the requested amount');
    } else {
      setWarningMessage(null);
    }
    setApprovedAmount(value);
  };

  const approveTranche = async () => {
    if (approvedAmount === undefined || approvedAmount === 0 || !trancheId)
      return;

    setLoading(true);
    try {
      await onApproveTranche(trancheId, approvedAmount);
      approveOnClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setApprovedAmount(ask);
    setWarningMessage(null);
    setLoading(false);
  }, [trancheId, ask]);

  return (
    <Dialog open={approveIsOpen} onOpenChange={approveOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Approve Tranche Payment
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <p className="mb-4 text-slate-500">
            You are about to approve {granteeName}&apos;s tranche payment. They
            will be notified via email.
          </p>

          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-500">Tranche Payment</p>
            <div className="flex items-center">
              <img
                className="h-5 w-5 rounded-full"
                alt={`${token} icon`}
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              />
              <p className="ml-1 font-semibold text-slate-600">
                {ask} <span className="text-slate-400">{token}</span>
              </p>
            </div>
          </div>

          <div className="mb-6 flex w-full items-center justify-between">
            <p className="w-full whitespace-nowrap text-slate-500">
              Approved Amount
            </p>
            <div className="flex">
              <CustomNumberInput
                value={approvedAmount || 0}
                onChange={handleAmountChange}
                min={1}
                max={remainingAmount}
              />
              <div className="flex items-center rounded-r-md border border-l-0 bg-white px-3 text-[0.95rem] text-slate-400">
                <img
                  className="mr-1 h-5 w-5 rounded-full"
                  alt={`${token} icon`}
                  src={
                    tokenList.find((t) => t.tokenSymbol === token)?.icon || ''
                  }
                />
                {token}
              </div>
            </div>
          </div>

          {warningMessage && (
            <p className="mb-4 text-center text-sm text-yellow-500">
              {warningMessage}
            </p>
          )}

          <div className="flex gap-3">
            <div className="w-1/2" />
            <Button variant="ghost" onClick={approveOnClose} disabled={loading}>
              Close
            </Button>
            <Button
              className="flex-1 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
              disabled={
                loading ||
                approvedAmount === 0 ||
                (warningMessage?.includes('exceeds') ?? false)
              }
              onClick={approveTranche}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner mr-2" />
                  <span>Approving</span>
                </>
              ) : (
                <>
                  <div className="mr-2 rounded-full bg-emerald-600 p-0.5">
                    <Check className="size-2.5 text-white" />
                  </div>
                  <span>Approve Tranche</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
