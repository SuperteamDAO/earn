import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CopyIcon, ExternalLink, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PDTG } from '@/constants/Telegram';
import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getRankLabels } from '@/utils/rank';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';
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
  listing: ListingWithSubmissions | undefined;
}

export const VerifyPaymentModal = ({
  listing,
  isOpen,
  onClose,
}: VerifyPaymentModalProps) => {
  const { user } = useUser();
  const [status, setStatus] = useState<
    'idle' | 'retry' | 'loading' | 'success' | 'error'
  >('idle');
  const [selectedToken, setSelectedToken] = useState<(typeof tokenList)[0]>();
  const [showMultiplePayments, setShowMultiplePayments] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    ...listingSubmissionsQuery({
      slug: listing?.slug ?? '',
      isWinner: true,
    }),
    enabled: !!listing?.slug,
  });
  const totalWinnerRanks = calculateTotalPrizes(
    listing?.rewards ?? {},
    listing?.maxBonusSpots || 0,
  );

  useEffect(() => {
    setStatus('idle');
    setShowMultiplePayments(false);
  }, [listing?.slug]);

  const refetchQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['sponsor-submissions', listing?.slug],
    });

    await queryClient.invalidateQueries({
      queryKey: ['sponsor-dashboard-listing', listing?.slug],
    });

    await queryClient.invalidateQueries({
      queryKey: ['dashboard', user?.currentSponsorId],
    });

    await queryClient.invalidateQueries({
      queryKey: [
        'listing-submissions',
        { slug: listing?.slug, isWinner: true },
      ],
    });
  };

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

  const paymentLinks = watch('paymentLinks');

  useEffect(() => {
    if (data?.submission && data?.bounty && isOpen) {
      const isProject = listing?.type === 'project';

      if (isProject) {
        reset(
          {
            paymentLinks: [
              {
                submissionId:
                  data.submission.find((sub) => sub.winnerPosition === 1)?.id ||
                  '',
                link: '',
                isVerified: false,
                txId: '',
              },
            ],
          },
          {
            keepErrors: false,
            keepDirty: false,
            keepIsSubmitted: false,
            keepTouched: false,
            keepIsValid: false,
            keepSubmitCount: false,
          },
        );
      } else {
        reset(
          {
            paymentLinks: data.submission
              .filter((sub) => sub.winnerPosition !== null)
              .sort((a, b) => (a.winnerPosition || 0) - (b.winnerPosition || 0))
              .map((submission) => ({
                submissionId: submission.id,
                link: '',
                isVerified: submission.isPaid,
                txId: submission.paymentDetails?.[0]?.txId || '',
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
      }

      if (data?.bounty?.token)
        setSelectedToken(
          tokenList.find((s) => s.tokenSymbol === data?.bounty?.token),
        );
    }
  }, [data?.bounty.slug, reset, listing?.type, isOpen]);

  useEffect(() => {
    reset({});
    setShowMultiplePayments(false);
  }, [listing?.slug]);

  const verifyPaymentMutation = async (body: VerifyPaymentsFormData) => {
    return await api.post<{ validationResults: ValidatePaymentResult[] }>(
      '/api/sponsor-dashboard/listings/verify-external-payment',
      {
        paymentLinks: body.paymentLinks,
        listingId: listing?.id,
      },
    );
  };

  const { mutate: verifyPayment, isPending: verifyPaymentPending } =
    useMutation({
      mutationFn: (body: VerifyPaymentsFormData) => verifyPaymentMutation(body),
      onSuccess: async (data, variables) => {
        await refetchQueries();
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
            setValue(`paymentLinks.${fieldIndex}.isVerified`, true, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setValue(`paymentLinks.${fieldIndex}.txId`, result.txId);
          }
        });

        const successfulResults = validationResults.filter(
          (v) => v.status === 'SUCCESS',
        );

        if (successfulResults.length > 0) {
          await queryClient.invalidateQueries({
            queryKey: ['dashboard', user?.currentSponsorId],
          });
        }
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

  const tryAgain = async () => {
    await refetchQueries();

    reset({});
    setStatus('idle');
    setShowMultiplePayments(false);
    clearErrors();
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open) {
      setStatus('idle');
      setShowMultiplePayments(false);
      clearErrors();
    } else {
      reset({});
      setStatus('idle');
      setShowMultiplePayments(false);
      clearErrors();
      onClose();
    }
  };

  const addPaymentField = () => {
    const currentLinks = paymentLinks || [];
    const winnerSubmission = data?.submission.find(
      (sub) => sub.winnerPosition === 1,
    );
    if (winnerSubmission) {
      setValue('paymentLinks', [
        ...currentLinks,
        {
          submissionId: winnerSubmission.id,
          link: '',
          isVerified: false,
          txId: '',
        },
      ]);
    }
  };

  const removePaymentField = (indexToRemove: number) => {
    const currentLinks = paymentLinks || [];
    if (indexToRemove > 0 && currentLinks.length > 1) {
      const newLinks = currentLinks.filter(
        (_, index) => index !== indexToRemove,
      );
      setValue('paymentLinks', newLinks);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center">
          <div className="border-t-brand-purple h-8 w-8 animate-spin rounded-full border-4 border-slate-200" />
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
            <div className="flex gap-3">
              <div className="w-1/2" />
              <Button variant="ghost" type="button" onClick={onClose}>
                Close
              </Button>
              <Button
                className="flex-1 cursor-wait bg-slate-300 font-medium text-slate-800"
                disabled
                type="submit"
              >
                <span className="loading loading-spinner mr-2" />
                Verifying Payment...
              </Button>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="flex h-full flex-col gap-10">
            <div className="py-10">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-emerald-50 p-6">
                  <div className="rounded-full bg-emerald-600 p-3">
                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-[20rem] flex-col items-center gap-1">
                <p className="mt-6 font-medium text-slate-900">
                  External Payment(s) Added
                </p>
                <p className="text-center text-sm text-slate-400">
                  We have successfully added external payment(s) to your
                  listing.
                </p>
              </div>
            </div>

            {listing?.totalPaymentsMade !== totalWinnerRanks && (
              <div className="flex gap-3">
                <div className="w-1/2" />
                <Button variant="ghost" type="button" onClick={onClose}>
                  Close
                </Button>
                <Button
                  className="flex-1 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                  onClick={tryAgain}
                >
                  Verify More
                </Button>
              </div>
            )}
          </div>
        );
      case 'error':
        return (
          <div className="flex h-full flex-col">
            <div className="py-6">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-red-50 p-6">
                  <div className="rounded-full bg-red-600 p-2.5">
                    <X className="h-7 w-7 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-[20rem] flex-col items-center gap-2">
                <p className="mt-10 font-medium text-slate-900">
                  Oh-Uh Verification Failed
                </p>
                <p className="text-center text-sm text-slate-500">
                  We couldn&apos;t verify your payment status. <br />
                  Please check your links again and make sure it&apos;s the
                  exact amount
                </p>
              </div>
              <div className="mx-auto mt-2 flex flex-col items-center gap-2">
                <a
                  href={PDTG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Button
                    className="bg-none text-sm font-normal text-slate-400"
                    variant="link"
                    type="button"
                  >
                    Think We Made A Mistake?{' '}
                    <span className="text-slate-500 underline">Text Us</span>
                  </Button>
                </a>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <div className="w-3/5" />
              <Button variant="ghost" type="button" onClick={onClose}>
                Close
              </Button>
              <Button
                className="flex-1 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                onClick={tryAgain}
              >
                Try Again
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
                <p className="text-sm font-normal text-slate-500">
                  If you have paid the winners outside of Earn and want to
                  update the status of this listing as &quot;Completed&quot;,
                  please add the transaction links of the payments made to the
                  winners.
                </p>
              </div>

              <div className="my-6 flex flex-col gap-6">
                {listing?.type === 'bounty' &&
                  data?.submission
                    .filter((sub) => sub.winnerPosition !== null)
                    .sort(
                      (a, b) =>
                        (a.winnerPosition || 0) - (b.winnerPosition || 0),
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
                                <div className="flex gap-1 text-xs font-semibold text-slate-500 uppercase">
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
                                        type="button"
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
                                      <Check className="h-full w-full stroke-3 text-white" />
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
                {listing?.type === 'project' && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                      {(() => {
                        const winnerSubmission = data?.submission.find(
                          (sub) => sub.winnerPosition === 1,
                        );
                        const totalPrizeAmount = listing?.rewards?.[1] || 0;
                        const totalPaidAmount =
                          winnerSubmission?.paymentDetails?.reduce(
                            (sum, payment) => sum + payment.amount,
                            0,
                          ) || 0;
                        const remainingAmount =
                          totalPrizeAmount - totalPaidAmount;

                        return (
                          <>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center">
                                <p className="w-32 font-normal text-slate-500">
                                  Winner Amount
                                </p>
                                <div className="flex items-center gap-1">
                                  <img
                                    className="h-[1.2rem] w-[1.2rem] rounded-full"
                                    alt={selectedToken?.tokenName}
                                    src={selectedToken?.icon}
                                  />
                                  <p className="font-medium text-slate-800">
                                    {formatNumberWithSuffix(
                                      totalPrizeAmount,
                                      2,
                                      true,
                                    )}
                                  </p>
                                  <p className="font-medium text-slate-400">
                                    {selectedToken?.tokenSymbol}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center">
                                <p className="w-32 font-normal text-slate-500">
                                  Wallet Address
                                </p>
                                <CopyButton
                                  text={
                                    winnerSubmission?.user?.walletAddress || ''
                                  }
                                  contentProps={{
                                    side: 'right',
                                    className: 'text-[0.6875rem] px-2 py-0.5',
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    <p className="text-sm font-medium text-slate-800">
                                      {truncatePublicKey(
                                        winnerSubmission?.user?.walletAddress,
                                        8,
                                      )}
                                    </p>
                                    <CopyIcon className="h-3 w-3" />
                                  </div>
                                </CopyButton>
                              </div>
                            </div>

                            {totalPaidAmount > 0 && (
                              <>
                                <div className="flex items-center gap-8">
                                  <p className="font-normal text-slate-500">
                                    Remaining Amount
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <img
                                      className="h-[1.2rem] w-[1.2rem] rounded-full"
                                      alt={selectedToken?.tokenName}
                                      src={selectedToken?.icon}
                                    />
                                    <p className="font-medium text-slate-800">
                                      {formatNumberWithSuffix(
                                        remainingAmount,
                                        2,
                                        true,
                                      )}
                                    </p>
                                    <p className="font-medium text-slate-400">
                                      {selectedToken?.tokenSymbol}
                                    </p>
                                  </div>
                                </div>

                                {winnerSubmission?.paymentDetails &&
                                  winnerSubmission.paymentDetails.length >
                                    0 && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                      <p className="mb-3 text-sm font-medium text-slate-700">
                                        Existing Payments
                                      </p>
                                      <div className="space-y-2">
                                        {winnerSubmission.paymentDetails.map(
                                          (payment, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center justify-between rounded bg-white p-3 text-sm"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-slate-600">
                                                  Tranche {payment.tranche}:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  <img
                                                    className="h-4 w-4 rounded-full"
                                                    alt={
                                                      selectedToken?.tokenName
                                                    }
                                                    src={selectedToken?.icon}
                                                  />
                                                  <span className="font-medium text-slate-800">
                                                    {formatNumberWithSuffix(
                                                      payment.amount,
                                                      2,
                                                      true,
                                                    )}
                                                  </span>
                                                  <span className="text-slate-400">
                                                    {selectedToken?.tokenSymbol}
                                                  </span>
                                                </div>
                                              </div>
                                              <a
                                                href={`https://solscan.io/tx/${payment.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                              >
                                                <ExternalLink className="h-4 w-4" />
                                              </a>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex flex-col gap-4">
                      <p className="text-sm font-medium tracking-wide text-slate-600 uppercase">
                        Transaction Link
                      </p>

                      {paymentLinks?.map((_, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <FormField
                            control={control}
                            name={`paymentLinks.${index}.link`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="text-sm placeholder:text-slate-400"
                                    placeholder="Paste your link here"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-0 flex size-9 items-center justify-center p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => removePaymentField(index)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {!showMultiplePayments && (
                        <Button
                          type="button"
                          variant="link"
                          className="text-brand-purple hover:text-brand-purple-dark w-fit p-0 text-sm"
                          onClick={() => {
                            setShowMultiplePayments(true);
                            addPaymentField();
                          }}
                        >
                          Multiple payments? Click here to add multiple tx links
                        </Button>
                      )}

                      {showMultiplePayments &&
                        paymentLinks &&
                        paymentLinks.length < 5 && (
                          <Button
                            type="button"
                            variant="link"
                            className="text-brand-purple hover:text-brand-purple-dark w-fit p-0 text-sm"
                            onClick={addPaymentField}
                          >
                            Click here to add another payment link
                          </Button>
                        )}
                    </div>
                  </div>
                )}
              </div>
              <FormField
                name={`paymentLinks.root` as any}
                control={control}
                render={() => {
                  return (
                    <FormItem className="mx-auto w-fit">
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="flex gap-3">
                <div className="w-1/2" />
                <Button variant="ghost" type="button" onClick={onClose}>
                  Close
                </Button>
                <Button
                  className="flex-1 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600"
                  disabled={data?.submission.every((sub) => sub.isPaid)}
                  type="submit"
                >
                  <div className="rounded-full bg-emerald-600 p-0.5">
                    <Check className="size-2 text-white" />
                  </div>
                  Add External Payment
                </Button>
              </div>

              {status === 'retry' && (
                <div className="mt-4 text-center">
                  <a
                    href={PDTG}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center"
                  >
                    <Button
                      className="bg-none text-sm font-normal text-slate-400"
                      variant="link"
                      type="button"
                    >
                      Think We Made A Mistake?{' '}
                      <span className="text-slate-500 underline">Text Us</span>
                    </Button>
                  </a>
                </div>
              )}
              <div className="mt-4">
                <p className="text-sm text-slate-400">
                  *To verify, ensure the amount, token, and wallet address in
                  the tx link match the details above
                </p>
              </div>
            </form>
          </Form>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange} modal>
      <DialogContent className="m-0 max-w-2xl p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Verify Payment
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
