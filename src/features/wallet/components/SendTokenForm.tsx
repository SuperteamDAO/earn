import { zodResolver } from '@hookform/resolvers/zod';
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

import { type TokenAsset } from '../utils/fetchUserTokens';

const formSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Amount must be a number')
    .refine((val) => Number(val) > 0, 'Amount must be greater than 0'),
  address: z.string().min(32, 'Invalid Solana address'),
});

export function SendTokenForm({
  token,
  onSuccess,
}: {
  token: TokenAsset;
  onSuccess: () => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      address: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Implement transaction
    console.log(values);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="0.00"
                  max={token.amount}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                ≈ ${(Number(field.value) * token.usdValue).toLocaleString()} USD
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Address</FormLabel>
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
          Send Tokens
        </Button>
      </form>
    </Form>
  );
}
