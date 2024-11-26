import {
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Spinner,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { BiPlus } from 'react-icons/bi';
import { toast } from 'sonner';
import { z } from 'zod';

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
      }, '无效的交易链接,必须是solscan.io 或 solana.fm 交易链接，且必须包含有效的交易ID。'),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentFormInputs>({
    resolver: zodResolver(paymentSchema(maxAmount, token)),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormInputs) => {
      const response = await axios.post(
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
      toast.success('支付成功');
      reset();
      recordPaymentOnClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error('支付失败，请重试。');
    },
  });

  const onSubmit = (data: PaymentFormInputs) => {
    addPaymentMutation.mutate(data);
  };

  return (
    <Modal isOpen={recordPaymentIsOpen} onClose={recordPaymentOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={'brand.slate.500'} fontSize={'md'} fontWeight={600}>
          添加付款
        </ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody fontWeight={500}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl isInvalid={!!errors.amount}>
              <FormLabel color="brand.slate.500" fontSize={'0.95rem'}>
                总计
              </FormLabel>
              <NumberInput focusBorderColor="brand.purple">
                <NumberInputField
                  color={'brand.slate.800'}
                  borderColor="brand.slate.300"
                  {...register('amount', {
                    required: '必填字段',
                    setValueAs: (value) => parseFloat(value),
                  })}
                  placeholder=""
                />
              </NumberInput>
              <FormErrorMessage>
                {errors.amount && <p>{errors.amount.message}</p>}
              </FormErrorMessage>
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.transactionLink}>
              <FormLabel color="brand.slate.500" fontSize={'0.95rem'}>
                交易链接
              </FormLabel>
              <Input mt={-1} {...register('transactionLink')} placeholder="" />
              <FormErrorMessage>
                {errors.transactionLink && (
                  <p>{errors.transactionLink.message}</p>
                )}
              </FormErrorMessage>
            </FormControl>
            <Button
              w="full"
              my={6}
              isLoading={addPaymentMutation.isPending}
              leftIcon={
                addPaymentMutation.isPending ? (
                  <Spinner color="white" size="sm" />
                ) : (
                  <BiPlus color="white" size="18px" />
                )
              }
              loadingText="正在支付"
              type="submit"
            >
              添加支付
            </Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
