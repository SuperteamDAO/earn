import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { tokenList } from '@/constants/tokenList';

import { type TokenAsset } from '../../types/TokenAsset';
import { type WithdrawFormData } from '../../utils/withdrawFormSchema';

interface ATAConfirmationProps {
  selectedToken?: TokenAsset;
  formData: WithdrawFormData;
  onConfirm: () => void;
  onCancel: () => void;
  ataCreationCost: number;
  isProcessing: boolean;
}

export const ATAConfirmation = ({
  selectedToken,
  formData,
  onConfirm,
  onCancel,
  ataCreationCost,
  isProcessing,
}: ATAConfirmationProps) => {
  const tokenDetails = tokenList.find(
    (token) => token.tokenSymbol === selectedToken?.tokenSymbol,
  );
  const ataCreationCostInTokens =
    ataCreationCost / 10 ** (tokenDetails?.decimals || 0);

  const token = selectedToken?.tokenSymbol;
  const ataLink =
    'https://medium.com/@ariannacr18/solanas-rent-system-explained-0eda0ac56203';

  const withdrawalAmount = Number(formData.amount || 0);
  const isInsufficient = withdrawalAmount < ataCreationCostInTokens;
  const deficitAmount = Math.max(ataCreationCostInTokens - withdrawalAmount, 0);
  const infoBoxClasses = `flex items-start gap-4 rounded-lg border p-4 ${
    isInsufficient ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'
  }`;
  const infoIconClasses = `mt-1 h-5 w-5 shrink-0 ${
    isInsufficient ? 'text-red-600' : 'text-slate-500'
  }`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 p-4">
        <h4 className="text-sm font-medium text-slate-500">
          TRANSACTION BREAKDOWN
        </h4>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Withdrawal Amount</span>
            <span className="font-medium">
              {formData.amount} {selectedToken?.tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Setup Fee</span>
            <span className="font-medium text-slate-600">
              - {ataCreationCostInTokens.toFixed(2)}{' '}
              {selectedToken?.tokenSymbol}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-600">Final Amount</span>
              <span
                className={`font-medium ${isInsufficient ? 'text-red-600' : ''}`}
              >
                {(Number(formData.amount) - ataCreationCostInTokens).toFixed(
                  2,
                )}{' '}
              </span>
            </div>
            {isInsufficient ? (
              <p className="mt-2 text-xs text-red-700">
                Your withdrawal amount is lower than the setup fee. Increase the
                amount by at least {deficitAmount.toFixed(2)}{' '}
                {selectedToken?.tokenSymbol} to continue.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={infoBoxClasses}>
        <AlertTriangle className={infoIconClasses} />
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            {isInsufficient
              ? 'Withdrawal amount too low'
              : 'Additional Setup Required'}
          </h3>
          {isInsufficient ? (
            <p className="mt-1 text-sm text-slate-700">
              Minimum withdrawal amount is {ataCreationCostInTokens.toFixed(2)}{' '}
              {token} for this transaction, to cover the one-time
              &quot;setup&quot; fee mentioned above. Please increase the amount
              to {ataCreationCostInTokens.toFixed(2)} {token} or more and try
              again.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-700">
              To withdraw {token} into this wallet address, it needs a special
              account to hold this {token}. Setting up this account incurs a
              small, one-time “rent” on the Solana blockchain, which is being
              deducted from your current withdrawal. After this setup, future{' '}
              {token} withdrawals to this wallet address won’t require
              additional fees. Read more{' '}
              <a href={ataLink} target="_blank" className="underline">
                here
              </a>
              .
            </p>
          )}
        </div>
      </div>

      {isInsufficient ? (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={onCancel} disabled={isProcessing}>
            Go Back
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm & Proceed'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
