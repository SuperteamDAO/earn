import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

interface RecordPaymentModalProps {
  recordPaymentIsOpen: boolean;
  recordPaymentOnClose: () => void;
  applicationId: string | undefined;
  approvedAmount: number;
  totalPaid: number;
  token: string;
  onPaymentRecorded: (newTotalPaid: number) => void;
}

const paymentSchema = (maxAmount: number, token: string) =>
  z.object({
    amount: z
      .number()
      .min(1, 'Amount is required')
      .max(
        maxAmount,
        `${maxAmount} ${token} is the total amount remaining to be paid. Tx amount here can't be higher than the remaining amount to be paid.`,
      ),
    transactionLink: z
      .url('Invalid URL')
      .min(1, 'Transaction link is required')
      .refine((link) => {
        const solscanRegex =
          /^https:\/\/solscan\.io\/tx\/[A-Za-z0-9]{44,}(\?cluster=[a-zA-Z-]+)?$/;
        const solanaFmRegex =
          /^https:\/\/solana\.fm\/tx\/[A-Za-z0-9]{44,}(\?cluster=[a-zA-Z-]+)?$/;
        return solscanRegex.test(link) || solanaFmRegex.test(link);
      }, 'Invalid transaction link. Must be a solscan.io or solana.fm link with a valid transaction ID.'),
  });

type PaymentFormInput = z.input<ReturnType<typeof paymentSchema>>;
type PaymentFormInputs = z.output<ReturnType<typeof paymentSchema>>;

export const RecordPaymentModal = ({
  applicationId,
  recordPaymentIsOpen,
  recordPaymentOnClose,
  approvedAmount,
  totalPaid,
  token,
  onPaymentRecorded,
}: RecordPaymentModalProps) => {
  const maxAmount = approvedAmount - totalPaid;

  const form = useForm<PaymentFormInput, unknown, PaymentFormInputs>({
    resolver: zodResolver(paymentSchema(maxAmount, token)),
    defaultValues: {
      amount: 0,
      transactionLink: '',
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormInputs) => {
      const response = await api.post(
        `/api/sponsor-dashboard/grants/add-tranche`,
        {
          id: applicationId,
          trancheAmount: data.amount,
          txId: data.transactionLink,
        },
      );
      return response.data;
    },
    onSuccess: (updatedApplication) => {
      onPaymentRecorded(updatedApplication);
      toast.success('Payment recorded successfully');
      form.reset();
      recordPaymentOnClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error recording payment. Please try again.');
    },
  });

  const onSubmit = (data: PaymentFormInputs) => {
    addPaymentMutation.mutate(data);
  };

  return (
    <Dialog open={recordPaymentIsOpen} onOpenChange={recordPaymentOnClose}>
      <DialogContent className="m-0 p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Add Grant Payment
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="font-medium"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[0.95rem] text-slate-500">
                      Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="focus-visible:ring-brand-purple border-slate-300 text-slate-800"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionLink"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-[0.95rem] text-slate-500">
                      Transaction Link
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="border-slate-300"
                        placeholder="Enter transaction link"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-6 flex gap-3">
                <div className="w-1/2" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={recordPaymentOnClose}
                  disabled={addPaymentMutation.isPending}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                  disabled={addPaymentMutation.isPending}
                  type="submit"
                >
                  {addPaymentMutation.isPending ? (
                    <>
                      <span className="loading loading-spinner mr-2" />
                      <span>Adding Payment</span>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full bg-emerald-600 p-0.5">
                        <Plus className="size-2 text-white" />
                      </div>
                      <span>Add Payment</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
