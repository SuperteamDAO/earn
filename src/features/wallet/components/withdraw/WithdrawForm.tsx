import { type UseFormReturn } from 'react-hook-form';

import { AlertDescription, AlertTitle } from '@/components/ui/alert';
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

import { type TokenAsset } from '../../types/TokenAsset';
import { type WithdrawFormData } from '../../utils/withdrawFormSchema';
import { TokenAmountInput } from './TokenAmountInput';

interface WithdrawFormProps {
  form: UseFormReturn<WithdrawFormData>;
  selectedToken?: TokenAsset;
  onSubmit: (values: WithdrawFormData) => Promise<void>;
  tokens: TokenAsset[];
}

export const WithdrawForm = ({
  form,
  selectedToken,
  onSubmit,
  tokens,
}: WithdrawFormProps) => (
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
        className="w-full font-semibold"
        disabled={!form.formState.isValid}
      >
        Withdraw Funds
      </Button>
    </form>
    <div className="mt-3 flex gap-2 rounded-lg border border-yellow-100 bg-yellow-50 px-4 pb-4 pt-2">
      <p className="mt-1.5 h-fit w-[3.3rem] rounded-full bg-yellow-500 text-center text-sm font-bold text-white">
        !
      </p>
      <div>
        <AlertTitle className="mt-1 text-base font-semibold text-yellow-800">
          Heads up!
        </AlertTitle>
        <AlertDescription className="text-xs text-yellow-800">
          Once you click on &quot;Withdraw Funds&quot;, your tokens will be sent
          instantly and permanently. Please double-check all details before
          proceeding, as transactions cannot be reversed.
        </AlertDescription>
      </div>
    </div>
  </Form>
);
