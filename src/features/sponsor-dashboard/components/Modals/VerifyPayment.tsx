import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Button,
  Center,
  CircularProgress,
  FormControl,
  FormErrorMessage,
  HStack,
  Icon,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuCheck, LuX } from 'react-icons/lu';
import { toast } from 'sonner';

import { BONUS_REWARD_POSITION, tokenList } from '@/constants';
import {
  listingSubmissionsQuery,
  type ListingWithSubmissions,
} from '@/features/listings';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getRankLabels } from '@/utils/rank';

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

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    setError,
    clearErrors,
    watch,
  } = useForm<VerifyPaymentsFormData>({
    resolver: zodResolver(verifyPaymentsSchema),
  });

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
        <HStack>
          <CircularProgress mx="auto" color="brand.purple" isIndeterminate />
        </HStack>
      );
    }

    if (error) {
      return <Text color="red.500">提交加载错误。请再试一次。</Text>;
    }

    switch (status) {
      case 'loading':
        return (
          <VStack h="100%" spacing={4}>
            <VStack py={14}>
              <CircularProgress
                mb={4}
                color="#4F46E5"
                isIndeterminate
                size="8rem"
                thickness={6}
              />
              <VStack maxW="20rem">
                <Text color="brand.slate.900" fontWeight={500}>
                  验证付款
                </Text>
                <Text align="center" color="brand.slate.500" fontSize="sm">
                  我们正在验证您所有的链接，请稍候！
                  <br /> 应该不会超过一分钟
                </Text>
              </VStack>
            </VStack>
            <Button
              w="full"
              mt={'auto'}
              color="brand.slate.800"
              fontWeight={500}
              bg="brand.slate.300"
              cursor="wait"
              type="submit"
            >
              Verifying Payment....
            </Button>
          </VStack>
        );
      case 'success':
        return (
          <VStack h="100%" py={16} spacing={10}>
            <Center p={6} bg="#ECFDF5" rounded={'full'}>
              <Center
                w="fit-content"
                mx="auto"
                p={3}
                bg={'#059669'}
                rounded={'full'}
              >
                <LuCheck
                  strokeWidth={3}
                  color="white"
                  style={{ width: '2.5em', height: '2.5em' }}
                />
              </Center>
            </Center>
            <VStack maxW="20rem">
              <Text color="brand.slate.900" fontWeight={500}>
                外部支付方式已添加
              </Text>
              <Text align="center" color="brand.slate.500" fontSize="sm">
                我们已成功为您任务添加了外部支付方式。
              </Text>
            </VStack>
            {listing?.totalPaymentsMade !== listing?.totalWinnersSelected && (
              <Button
                fontSize="sm"
                fontWeight={400}
                textDecoration={'underline'}
                bg="none"
                onClick={tryAgain}
                variant="link"
              >
                Verify More
              </Button>
            )}
          </VStack>
        );
      case 'error':
        return (
          <VStack h="100%" py={16} spacing={10}>
            <Center p={6} bg="#FEF2F2" rounded={'full'}>
              <Center
                w="fit-content"
                mx="auto"
                p={3}
                bg={'#DC2626'}
                rounded={'full'}
              >
                <LuX
                  strokeWidth={3}
                  color="white"
                  style={{ width: '2.5em', height: '2.5em' }}
                />
              </Center>
            </Center>
            <VStack maxW="20rem">
              <Text color="brand.slate.900" fontWeight={500}>
                外部支付方式验证失败
              </Text>
              <Text align="center" color="brand.slate.500" fontSize="sm">
                我们验证您的付款状态 <br /> 请再次检查您的链接 并确保金额正确
              </Text>
            </VStack>
            <VStack>
              <Link
                href="https://t.me/cryptosheep1/"
                isExternal
                rel="noopener noreferrer"
              >
                <Button
                  fontSize="sm"
                  fontWeight={400}
                  textDecoration={'underline'}
                  bg="none"
                  variant="link"
                >
                  Think We Made A Mistake? Text Us
                </Button>
              </Link>
              <Button
                fontSize="sm"
                fontWeight={400}
                bg="none"
                onClick={tryAgain}
                variant="link"
              >
                Try Again?
              </Button>
            </VStack>
          </VStack>
        );
      default:
        return (
          <form onSubmit={handleSubmit(onSubmit)} style={{ height: '100%' }}>
            <VStack align="start">
              <Text color="brand.slate.900" fontSize="medium" fontWeight={500}>
                添加奖励支付链接
              </Text>
              <Text
                mt={2}
                color="brand.slate.500"
                fontSize="sm"
                fontWeight={400}
              >
                如果您已在 Earn 之外向获奖者支付了奖金，并想将此列表的状态更新为
                {`"已完成"`}，请添加支付给获奖者的交易链接。
              </Text>
            </VStack>
            <VStack gap={6} my={6}>
              {data?.submission
                .filter((sub) => sub.winnerPosition !== null)
                .sort(
                  (a, b) => (a.winnerPosition || 0) - (b.winnerPosition || 0),
                )
                .map((submission, index) => (
                  <Controller
                    key={submission.id}
                    name={`paymentLinks.${index}.link`}
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        isInvalid={
                          !!errors.paymentLinks?.[index]?.root ||
                          !!errors.paymentLinks?.[index]?.link
                        }
                      >
                        <HStack justify="space-between">
                          <VStack align="start" gap={2} w="40%">
                            <HStack
                              gap={1}
                              color="brand.slate.500"
                              fontSize="small"
                              fontWeight={600}
                              textTransform="uppercase"
                            >
                              <Text>
                                {getRankLabels(submission.winnerPosition || 0)}{' '}
                                奖项
                              </Text>
                              {submission.winnerPosition ===
                                BONUS_REWARD_POSITION && (
                                <HStack gap={0}>
                                  <Text>(</Text>
                                  <Text
                                    overflow="hidden"
                                    maxW="5rem"
                                    textTransform="none"
                                    textOverflow="ellipsis"
                                    noOfLines={1}
                                  >
                                    @{submission.user.username}
                                  </Text>
                                  <Text>)</Text>
                                </HStack>
                              )}
                            </HStack>
                            <HStack>
                              <Image
                                w={'1.2rem'}
                                alt={selectedToken?.tokenName}
                                rounded={'full'}
                                src={selectedToken?.icon}
                              />
                              <Text color="brand.slate.800" fontWeight={600}>
                                {formatNumberWithSuffix(
                                  listing?.rewards?.[
                                    submission.winnerPosition || 0
                                  ] || 0,
                                )}
                              </Text>
                              <Text color="brand.slate.400" fontWeight={600}>
                                {selectedToken?.tokenSymbol}
                              </Text>
                            </HStack>
                          </VStack>
                          <VStack align="start" gap={0} w="full">
                            {paymentLinks?.[index]?.isVerified ? (
                              <HStack w="full">
                                <Link
                                  w="full"
                                  href={`https://solscan.io/tx/${paymentLinks?.[index]?.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`}
                                  isExternal
                                >
                                  <Button
                                    justifyContent="start"
                                    w="full"
                                    color="brand.slate.500"
                                    fontSize="sm"
                                    fontWeight={500}
                                    borderWidth={1.5}
                                    borderColor="green"
                                    _hover={{
                                      bg: 'green.100',
                                    }}
                                    variant="outline"
                                  >
                                    <Text mr={2}>支付已验证。查看交易</Text>
                                    <Icon as={ExternalLinkIcon} />
                                  </Button>
                                </Link>

                                <Icon
                                  as={LuCheck}
                                  w={6}
                                  h={6}
                                  p={1}
                                  color="white"
                                  bg="green"
                                  rounded="full"
                                  strokeWidth={3}
                                />
                              </HStack>
                            ) : (
                              <Input
                                {...field}
                                fontSize="sm"
                                _placeholder={{
                                  color: 'brand.slate.400',
                                }}
                                placeholder=""
                              />
                            )}
                            <FormErrorMessage>
                              {errors.paymentLinks?.[index]?.root?.message}
                              {errors.paymentLinks?.[index]?.link?.message}
                            </FormErrorMessage>
                          </VStack>
                        </HStack>
                      </FormControl>
                    )}
                  />
                ))}
            </VStack>
            <VStack>
              <Button
                w="full"
                isDisabled={data?.submission.every((sub) => sub.isPaid)}
                type="submit"
              >
                Add External Payment
              </Button>
              {status === 'retry' && (
                <Link
                  href="https://t.me/cryptosheep1/"
                  isExternal
                  rel="noopener noreferrer"
                >
                  <Button
                    fontSize="sm"
                    fontWeight={400}
                    textDecoration={'underline'}
                    bg="none"
                    variant="link"
                  >
                    Think We Made A Mistake? Text Us
                  </Button>
                </Link>
              )}
            </VStack>
          </form>
        );
    }
  };

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p={6}>{renderContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
