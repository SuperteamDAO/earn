import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubmissionWithUser } from '@/interface/submission';

const formSchema = z
  .object({
    status: z.enum(['Pending', 'Approved', 'Rejected']),
    label: z.enum(['New', 'Reviewed', 'Shortlisted', 'Spam'] as const),
    isPaid: z.boolean().default(false),
    paymentLink: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isPaid && !data.paymentLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment link is required when marked as paid',
        path: ['paymentLink'],
      });
    }

    if (data.status === 'Approved' && data.label !== 'Reviewed') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label must be Reviewed if status is Approved',
        path: ['label'],
      });
    }

    if (data.isPaid && data.status !== 'Approved') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Status must be Approved if payment is marked as paid',
        path: ['isPaid'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface EditSubmissionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionWithUser | undefined;
  onSuccess: (updatedSubmission: any) => void;
}

export const EditSubmissionStatusModal = ({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: EditSubmissionStatusModalProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: submission?.status || 'Pending',
      label: submission?.label || 'New',
      isPaid: submission?.isPaid || false,
      paymentLink: submission?.paymentDetails?.link,
    },
  });

  const { watch, setValue } = form;
  const status = watch('status');
  const isPaid = watch('isPaid');

  useEffect(() => {
    if (submission) {
      setValue('status', submission.status || 'Pending');
      setValue('label', submission.label || 'New');
      setValue('isPaid', submission.isPaid || false);
      setValue('paymentLink', submission.paymentDetails?.link);
    }
  }, [submission, setValue]);

  useEffect(() => {
    if (status !== 'Pending') {
      setValue('label', 'Reviewed');
    }
    if (status !== 'Approved') {
      setValue('isPaid', false);
      setValue('paymentLink', undefined);
    }
  }, [status, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!submission) return;

    try {
      const response = await fetch(
        '/api/sponsor-dashboard/god/edit-submission-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: submission.id,
            ...values,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Submission updated successfully');
        onSuccess(data.submission);
        onClose();
      } else {
        toast.error(data.error || 'Failed to update submission');
      }
    } catch (error) {
      console.error('Submission update error:', error);
      toast.error('An error occurred while updating the submission');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>[GOD MODE] Edit Submission Status</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {status === 'Pending' && (
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Label</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="label">
                          <SelectValue placeholder="Select label" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="Spam">Spam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {status === 'Approved' && (
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex space-x-2">
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isPaid"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormLabel>Mark as paid</FormLabel>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isPaid && (
              <FormField
                control={form.control}
                name="paymentLink"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Payment Link</FormLabel>
                    <FormControl>
                      <Input
                        id="paymentLink"
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter payment details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                <CheckCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
