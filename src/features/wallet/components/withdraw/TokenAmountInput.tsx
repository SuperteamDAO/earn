import { ChevronDown } from 'lucide-react';

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
}: TokenAmountInputProps) => (
  <div className={`flex rounded-md border border-input ${className}`}>
    <Select onValueChange={onTokenChange} value={selectedToken?.tokenAddress}>
      <SelectTrigger className="w-[140px] rounded-r-none border-0 border-r bg-background">
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
    <Input
      type="number"
      value={amount}
      onChange={(e) => onAmountChange(e.target.value)}
      className="rounded-l-none border-0 pr-4 text-right"
      placeholder="0.00"
    />
  </div>
);
