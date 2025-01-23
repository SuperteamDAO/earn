import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { type TokenAsset } from '../utils/fetchUserTokens';

const formSchema = z.object({
  tokenAddress: z.string().min(1, 'Please select a token'),
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Amount must be a number')
    .refine((val) => Number(val) > 0, 'Amount must be greater than 0'),
  address: z.string().min(32, 'Invalid Solana address'),
});

const TokenAmountInput = ({
  tokens,
  selectedToken,
  onTokenChange,
  amount,
  onAmountChange,
  className,
}: {
  tokens: TokenAsset[];
  selectedToken?: TokenAsset;
  onTokenChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  className?: string;
}) => {
  return (
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
        style={{ textAlign: 'right' }}
      />
    </div>
  );
};

export function SendTokenForm({
  tokens,
  onSuccess,
}: {
  tokens: TokenAsset[];
  onSuccess: () => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: tokens[0]?.tokenAddress ?? '',
      amount: '',
      address: '',
    },
  });

  const selectedToken = tokens.find(
    (token) => token.tokenAddress === form.watch('tokenAddress'),
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <FormLabel className="text-xs text-slate-500 sm:text-xs">
            ASSET
          </FormLabel>
          <div className="space-y-1">
            <TokenAmountInput
              tokens={tokens}
              selectedToken={selectedToken}
              onTokenChange={(value) => form.setValue('tokenAddress', value)}
              amount={form.watch('amount')}
              onAmountChange={(value) => form.setValue('amount', value)}
            />
            {selectedToken && (
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>
                  Balance: {selectedToken.amount} {selectedToken.tokenSymbol}
                </span>
                <span>
                  ~
                  {selectedToken
                    ? (
                        Number(form.watch('amount')) *
                        (selectedToken.usdValue / selectedToken.amount)
                      ).toLocaleString()
                    : 0}{' '}
                  USD
                </span>
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2 text-xs text-slate-500 sm:text-xs">
                RECIPIENT&apos;S SOLANA WALLET ADDRESS
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter recipient address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid}
        >
          Withdraw Funds
        </Button>
      </form>
    </Form>
  );
}
