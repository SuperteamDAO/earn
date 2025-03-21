import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { type TokenAsset } from '../../types/TokenAsset';

interface TokenAmountInputProps {
  tokens: TokenAsset[];
  selectedToken?: TokenAsset;
  onTokenChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  className?: string;
}

export const TokenAmountInput = ({
  tokens,
  selectedToken,
  onTokenChange,
  amount,
  onAmountChange,
  className,
}: TokenAmountInputProps) => {
  const handleMaxClick = () => {
    if (selectedToken) {
      onAmountChange(selectedToken.amount.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleMaxClick();
    }
  };

  return (
    <>
      <div className={`border-input flex rounded-md border ${className}`}>
        <Select
          onValueChange={onTokenChange}
          value={selectedToken?.tokenAddress}
        >
          <SelectTrigger className="bg-background w-[140px] rounded-r-none border-0 border-r">
            <SelectValue>
              {selectedToken && (
                <div className="flex items-center gap-2">
                  <img
                    src={selectedToken.tokenImg}
                    alt={selectedToken.tokenSymbol}
                    className="h-5 w-5 rounded-full"
                  />
                  <span>{selectedToken.tokenSymbol}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.tokenAddress} value={token.tokenAddress}>
                <div className="flex items-center gap-2">
                  <img
                    src={token.tokenImg}
                    alt={token.tokenSymbol}
                    className="h-5 w-5 rounded-full"
                  />
                  <span>{token.tokenSymbol}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="my-auto ml-2 h-auto bg-gray-400 px-1.5 py-0.5 text-[10px] hover:bg-gray-500"
          onClick={handleMaxClick}
          onKeyDown={handleKeyDown}
          disabled={!selectedToken}
          tabIndex={0}
          aria-label="Set maximum amount"
          type="button"
        >
          MAX
        </Button>

        <Input
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="rounded-l-none border-0 pr-4 text-right focus-visible:ring-transparent"
          placeholder="0.00"
          inputMode="decimal"
          min="0"
          onKeyDown={(e) => {
            if (
              !/[0-9]|\.|\.|\Backspace|\Tab|\Delete|\ArrowLeft|\ArrowRight/.test(
                e.key,
              ) ||
              (e.key === '.' && e.currentTarget.value.includes('.'))
            ) {
              e.preventDefault();
            }
          }}
        />
      </div>
    </>
  );
};
