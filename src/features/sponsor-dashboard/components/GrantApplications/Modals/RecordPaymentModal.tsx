import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
      .string()
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

type PaymentFormInputs = z.infer<ReturnType<typeof paymentSchema>>;

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

  const form = useForm<PaymentFormInputs>({
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
      <DialogContent className="px-0">
        <DialogHeader>
          <DialogTitle className="text-md px-4 font-semibold text-slate-500">
            Add Grant Payment
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="px-4">
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
                        className="border-slate-300 text-slate-800 focus-visible:ring-brand-purple"
                        placeholder="Enter amount"
                        {...field}
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

              <Button
                className="my-6 w-full"
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
                    <Plus className="mr-2 h-[18px] w-[18px]" />
                    <span>Add Payment</span>
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
