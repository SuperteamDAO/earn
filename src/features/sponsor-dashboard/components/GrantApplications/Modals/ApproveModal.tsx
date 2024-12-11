import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

  return (
    <div className="relative w-[100px]">
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          if (
            !isNaN(newValue) &&
            newValue >= min &&
            (max === undefined || newValue <= max)
          ) {
            onChange(newValue);
          }
        }}
        className="pr-8 font-semibold text-slate-600"
      />
      <div className="absolute right-1 top-0 flex h-full flex-col">
        <button
          onClick={increment}
          className="flex-1 px-1 hover:text-brand-purple"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={decrement}
          className="flex-1 px-1 hover:text-brand-purple"
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
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  token: string;
  onApproveGrant: (applicationId: string, approvedAmount: number) => void;
  max: number | undefined;
}

export const ApproveModal = ({
  applicationId,
  approveIsOpen,
  approveOnClose,
  ask,
  granteeName,
  token,
  onApproveGrant,
  max,
}: ApproveModalProps) => {
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>(ask);
  const [loading, setLoading] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleAmountChange = (value: number) => {
    if (value > (ask as number)) {
      setWarningMessage(
        'Approved amount is greater than the requested amount. Are you sure you want to approve?',
      );
    } else {
      setWarningMessage(null);
    }
    setApprovedAmount(value);
  };

  const approveGrant = async () => {
    if (approvedAmount === undefined || approvedAmount === 0 || !applicationId)
      return;

    setLoading(true);
    try {
      await onApproveGrant(applicationId, approvedAmount);
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
  }, [applicationId, ask]);

  return (
    <Dialog open={approveIsOpen} onOpenChange={approveOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md font-semibold text-slate-500">
            Approve Grant Payment
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="text-[0.95rem] font-medium">
          <p className="mt-3 text-slate-500">
            You are about to approve {granteeName}’s grant request. They will be
            notified via email.
          </p>

          <br />

          <div className="mb-6 flex items-center justify-between">
            <p className="text-slate-500">Grant Request</p>
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
                max={max}
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
            <p className="font-sm text-center text-yellow-500">
              {warningMessage}
            </p>
          )}

          <Button
            className="mb-3 mt-2 w-full bg-[#079669] text-white hover:bg-[#079669]/90"
            disabled={loading || approvedAmount === 0}
            onClick={approveGrant}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Approving
              </>
            ) : (
              <>
                <div className="mr-2 rounded-full bg-white p-[5px]">
                  <Check className="h-2.5 w-2.5 text-[#079669]" />
                </div>
                Approve Grant
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
