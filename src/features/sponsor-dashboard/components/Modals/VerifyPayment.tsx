import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Check, ExternalLink, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { tokenList } from '@/constants/tokenList';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getRankLabels } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { listingSubmissionsQuery } from '@/features/listings/queries/submissions';
import { type ListingWithSubmissions } from '@/features/listings/types';

import {
  type ValidatePaymentResult,
  type VerifyPaymentsFormData,
  verifyPaymentsSchema,
} from '../../types';

interface VerifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | undefined;
  listing: ListingWithSubmissions | undefined;
  setListing: (listing: ListingWithSubmissions) => void;
  listingType: string | undefined;
}

export const VerifyPaymentModal = ({
  listingId,
  listing,
  setListing,
  isOpen,
  onClose,
}: VerifyPaymentModalProps) => {
  const { user } = useUser();
  const [status, setStatus] = useState<
    'idle' | 'retry' | 'loading' | 'success' | 'error'
  >('idle');
  const [selectedToken, setSelectedToken] = useState<(typeof tokenList)[0]>();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    ...listingSubmissionsQuery({
      slug: listing?.slug ?? '',
      isWinner: true,
    }),
    enabled: !!listing?.slug,
  });

  useEffect(() => {
    setStatus('idle');
  }, [listing?.slug]);

  const form = useForm<VerifyPaymentsFormData>({
    resolver: zodResolver(verifyPaymentsSchema),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    setError,
    clearErrors,
    watch,
  } = form;

  useEffect(() => {
    console.log('errors', errors);
  }, [errors]);

  const paymentLinks = watch('paymentLinks');

  useEffect(() => {
    if (data?.submission && data?.bounty) {
      reset(
        {
          paymentLinks: data.submission
            .filter((sub) => sub.winnerPosition !== null)
            .sort((a, b) => (a.winnerPosition || 0) - (b.winnerPosition || 0))
            .map((submission) => ({
              submissionId: submission.id,
              link: '',
              isVerified: submission.isPaid,
              txId: submission.paymentDetails?.txId || '',
            })),
        },
        {
          keepErrors: true,
          keepDirty: true,
          keepIsSubmitted: true,
          keepTouched: true,
          keepIsValid: false,
          keepSubmitCount: true,
        },
      );
      if (data?.bounty?.token)
        setSelectedToken(
          tokenList.find((s) => s.tokenSymbol === data?.bounty?.token),
        );
    }
  }, [data?.bounty.slug, reset]);

  useEffect(() => {
    reset({});
  }, [listing?.slug]);

  const verifyPaymentMutation = async (body: VerifyPaymentsFormData) => {
    return await axios.post<{ validationResults: ValidatePaymentResult[] }>(
      '/api/sponsor-dashboard/listings/verify-external-payment',
      {
        paymentLinks: body.paymentLinks,
        listingId,
      },
    );
  };

  const { mutate: verifyPayment, isPending: verifyPaymentPending } =
    useMutation({
      mutationFn: (body: VerifyPaymentsFormData) => verifyPaymentMutation(body),
      onSuccess: async (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: listingSubmissionsQuery({
            slug: listing?.slug ?? '',
            isWinner: true,
          }).queryKey,
        });

        const { validationResults } = data.data;
        const failedResults = validationResults.filter(
          (v) => v.status === 'FAIL',
        );
        if (failedResults.length > 0) {
          clearErrors();
          failedResults.forEach((result) => {
            const fieldIndex = variables.paymentLinks.findIndex(
              (link) => link.submissionId === result.submissionId,
            );

            if (fieldIndex !== -1) {
              setError(`paymentLinks.${fieldIndex}.link`, {
                type: 'manual',
                message: result.message || 'Verification failed',
              });
            }
          });
          setStatus('retry');
        } else {
          setStatus('success');
        }
        const nonFailResults = validationResults.filter(
          (v) => v.status !== 'FAIL',
        );

        nonFailResults.forEach((result) => {
          const fieldIndex = variables.paymentLinks.findIndex(
            (link) => link.submissionId === result.submissionId,
          );
          if (fieldIndex !== -1) {
            setValue(`paymentLinks.${fieldIndex}.isVerified`, true);
            setValue(`paymentLinks.${fieldIndex}.txId`, result.txId);
          }
        });

        const successfulResults = validationResults.filter(
          (v) => v.status === 'SUCCESS',
        );

        if (listing) {
          const existingPayments = listing.totalPaymentsMade || 0;
          const newPayments = successfulResults.length;
          const newListing = {
            ...listing,
            totalPaymentsMade: existingPayments + newPayments,
          };
          queryClient.setQueryData<ListingWithSubmissions[]>(
            ['dashboard', user?.currentSponsorId],
            (oldData) =>
              oldData
                ? oldData.map((l) => (l.id === newListing.id ? newListing : l))
                : [],
          );
          setListing(newListing);
        }

        nonFailResults.forEach((result) => {
          const fieldIndex = variables.paymentLinks.findIndex(
            (link) => link.submissionId === result.submissionId,
          );
          if (fieldIndex !== -1) {
            setValue(`paymentLinks.${fieldIndex}.isVerified`, true, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        });
      },
      onError: () => {
        setStatus('error');
        toast.error('Error occurred while verifying payment');
      },
    });

  useEffect(() => {
    if (verifyPaymentPending) {
      setStatus('loading');
    }
  }, [verifyPaymentPending]);

  const onSubmit = async (data: VerifyPaymentsFormData) => {
    verifyPayment({ paymentLinks: data.paymentLinks });
  };

  const tryAgain = () => {
    setStatus('idle');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-purple" />
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-red-500">
          Error loading submissions. Please try again.
        </p>
      );
    }

    switch (status) {
      case 'loading':
        return (
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-col py-14">
              <div className="mb-4 flex justify-center">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-slate-200 border-t-indigo-600"
                  style={{ borderWidth: '3px' }}
                />
              </div>
              <div className="mx-auto flex max-w-[20rem] flex-col items-center gap-2">
                <p className="font-medium text-slate-900">Verifying Payment</p>
                <p className="text-center text-sm text-slate-500">
                  {`We're`} verifying all your links, hang tight! <br /> This
                  should take less than a minute
                </p>
              </div>
            </div>
            <Button
              className="mt-auto w-full cursor-wait bg-slate-300 font-medium text-slate-800"
              disabled
              type="submit"
            >
              Verifying Payment....
            </Button>
          </div>
        );
      case 'success':
        return (
          <div className="flex h-full flex-col gap-10 py-10">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center rounded-full bg-emerald-50 p-6">
                <div className="rounded-full bg-emerald-600 p-3">
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="mx-auto flex max-w-[20rem] flex-col items-center gap-2">
              <p className="font-medium text-slate-900">
                External Payment(s) Added
              </p>
              <p className="text-center text-sm text-slate-500">
                We have successfully added external payment(s) to your listing.
              </p>
            </div>

            {listing?.totalPaymentsMade !== listing?.totalWinnersSelected && (
              <Button
                className="bg-none text-sm font-normal underline"
                onClick={tryAgain}
                variant="link"
              >
                Verify More
              </Button>
            )}
          </div>
        );
      case 'error':
        return (
          <div className="flex h-full flex-col gap-10 py-10">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center rounded-full bg-red-50 p-6">
                <div className="rounded-full bg-red-600 p-2.5">
                  <X className="h-7 w-7 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="mx-auto flex max-w-[20rem] flex-col items-center gap-2">
              <p className="font-medium text-slate-900">
                Oh-Uh Verification Failed
              </p>
              <p className="text-center text-sm text-slate-500">
                We couldn’t verify your payment status. <br />
                Please check your links again and make sure it’s the exact
                amount
              </p>
            </div>

            <div className="mx-auto flex flex-col items-center gap-2">
              <a
                href="https://t.me/pratikdholani/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center"
              >
                <Button
                  className="bg-none text-sm font-normal underline"
                  variant="link"
                >
                  Think We Made A Mistake? Text Us
                </Button>
              </a>

              <Button
                className="bg-none text-sm font-normal"
                onClick={tryAgain}
                variant="link"
              >
                Try Again?
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="h-full">
              <div className="flex flex-col items-start gap-2">
                <p className="font-medium text-slate-900">
                  Add Reward Payment Link
                </p>
                <p className="mt-2 text-sm font-normal text-slate-500">
                  If you have paid the winners outside of Earn and want to
                  update the status of this listing as &quot;Completed&quot;,
                  please add the transaction links of the payments made to the
                  winners.
                </p>
              </div>

              <div className="my-6 flex flex-col gap-6">
                {data?.submission
                  .filter((sub) => sub.winnerPosition !== null)
                  .sort(
                    (a, b) => (a.winnerPosition || 0) - (b.winnerPosition || 0),
                  )
                  .map((submission, index) => (
                    <FormField
                      key={submission.id}
                      control={control}
                      name={`paymentLinks.${index}.link`}
                      render={({ field }) => (
                        <FormItem
                          className={cn(
                            'space-y-2',
                            errors.paymentLinks?.[index]?.root ||
                              errors.paymentLinks?.[index]?.link
                              ? 'text-red-500'
                              : '',
                          )}
                        >
                          <div className="flex justify-between gap-2">
                            <div className="flex w-[40%] flex-col items-start gap-1">
                              <div className="flex gap-1 text-xs font-semibold uppercase text-slate-500">
                                <p>
                                  {getRankLabels(
                                    submission.winnerPosition || 0,
                                  )}{' '}
                                  PRIZE
                                </p>
                                {submission.winnerPosition ===
                                  BONUS_REWARD_POSITION && (
                                  <div className="flex">
                                    <p>(</p>
                                    <p className="line-clamp-1 max-w-[5rem] normal-case">
                                      @{submission.user.username}
                                    </p>
                                    <p>)</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <img
                                  className="h-[1.2rem] w-[1.2rem] rounded-full"
                                  alt={selectedToken?.tokenName}
                                  src={selectedToken?.icon}
                                />
                                <p className="font-semibold text-slate-800">
                                  {formatNumberWithSuffix(
                                    listing?.rewards?.[
                                      submission.winnerPosition || 0
                                    ] || 0,
                                  )}
                                </p>
                                <p className="font-semibold text-slate-400">
                                  {selectedToken?.tokenSymbol}
                                </p>
                              </div>
                            </div>

                            <div className="flex w-full flex-col items-start gap-1">
                              {paymentLinks?.[index]?.isVerified ? (
                                <div className="flex w-full items-center gap-2">
                                  <a
                                    className="w-full"
                                    href={`https://solscan.io/tx/${paymentLinks?.[index]?.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      className="w-full justify-start border-green-500 text-sm font-medium text-slate-500 hover:bg-green-100"
                                      variant="outline"
                                    >
                                      <p className="mr-2">
                                        Payment Verified. View Tx
                                      </p>
                                      <ExternalLink className="ml-auto h-4 w-4" />
                                    </Button>
                                  </a>

                                  <div className="h-6 w-6 rounded-full bg-green-500 p-1">
                                    <Check className="h-full w-full stroke-[3] text-white" />
                                  </div>
                                </div>
                              ) : (
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="text-sm placeholder:text-slate-400"
                                    placeholder="Paste your link here"
                                  />
                                </FormControl>
                              )}
                              <FormMessage />
                              <FormField
                                name={`paymentLinks.${index}.root` as any}
                                control={control}
                                render={() => {
                                  return (
                                    <FormItem>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
              </div>
              <FormField
                name={`paymentLinks.root` as any}
                control={control}
                render={() => {
                  return (
                    <FormItem className="mx-auto mb-4 w-fit">
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  disabled={data?.submission.every((sub) => sub.isPaid)}
                  type="submit"
                >
                  Add External Payment
                </Button>

                {status === 'retry' && (
                  <a
                    href="https://t.me/pratikdholani/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center"
                  >
                    <Button
                      className="bg-transparent text-sm font-normal underline"
                      variant="link"
                    >
                      Think We Made A Mistake? Text Us
                    </Button>
                  </a>
                )}
              </div>
            </form>
          </Form>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-2xl p-6">{renderContent()}</DialogContent>
    </Dialog>
  );
};
