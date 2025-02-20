import { Loader2 } from 'lucide-react';
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
  onSubmit: (values: WithdrawFormData) => Promise<string>;
  tokens: TokenAsset[];
  isProcessing: boolean;
}

export const WithdrawForm = ({
  form,
  selectedToken,
  onSubmit,
  tokens,
  isProcessing,
}: WithdrawFormProps) => {
  const hasInsufficientBalance =
    selectedToken && Number(form.watch('amount')) > selectedToken.amount;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <FormLabel className="flex justify-between text-xs text-slate-500 sm:text-xs">
            <p>ASSET</p>
            <p>AMOUNT</p>
          </FormLabel>
          <div className="space-y-1">
            <TokenAmountInput
              tokens={tokens}
              selectedToken={selectedToken}
              onTokenChange={(value) => {
                form.setValue('tokenAddress', value);
                form.trigger('tokenAddress');
              }}
              amount={form.watch('amount')}
              onAmountChange={(value) => {
                form.setValue('amount', value);
                form.trigger('amount');
              }}
            />
            {selectedToken && !hasInsufficientBalance && (
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>
                  Balance:{' '}
                  {new Intl.NumberFormat('en-US').format(selectedToken.amount)}{' '}
                  {selectedToken.tokenSymbol}
                </span>
                <span>
                  ~
                  {selectedToken
                    ? (
                        Number(form.watch('amount') || 0) *
                        ((selectedToken.usdValue || 0) /
                          (selectedToken.amount || 1))
                      ).toLocaleString() || '0'
                    : '0'}{' '}
                  USD
                </span>
              </div>
            )}
            {hasInsufficientBalance && (
              <p className="text-destructive text-xs font-medium">
                Insufficient Balance
              </p>
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
                <Input
                  {...field}
                  placeholder="Enter recipient address"
                  onBlur={() => {
                    form.trigger('address');
                  }}
                  onChange={(e) => {
                    field.onChange(e);
                    form.trigger('address');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full font-semibold"
          disabled={
            !form.formState.isValid ||
            form.formState.isSubmitting ||
            hasInsufficientBalance ||
            isProcessing
          }
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Withdrawing...
            </>
          ) : (
            'Withdraw Funds'
          )}
        </Button>
      </form>
      <div className="mt-3 flex gap-2 rounded-lg border border-yellow-100 bg-yellow-50 px-4 pt-2 pb-4">
        <p className="mt-1.5 h-fit w-[3.3rem] rounded-full bg-yellow-500 text-center text-sm font-bold text-white">
          !
        </p>
        <div>
          <AlertTitle className="mt-1 text-base font-semibold text-yellow-800">
            Heads up!
          </AlertTitle>
          <AlertDescription className="text-xs text-yellow-800">
            Once you click on &quot;Withdraw Funds&quot;, your tokens will be
            sent instantly and permanently. Please double-check all details
            before proceeding, as transactions cannot be reversed.
          </AlertDescription>
        </div>
      </div>
    </Form>
  );
};
