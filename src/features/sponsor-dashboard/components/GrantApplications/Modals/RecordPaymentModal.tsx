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
import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BiPlus } from 'react-icons/bi';
import { z } from 'zod';

interface RecordPaymentModalProps {
  recordPaymentIsOpen: boolean;
  recordPaymentOnClose: () => void;
  applicationId: string | undefined;
}

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
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
  note: z.string().optional(),
});

type PaymentFormInputs = z.infer<typeof paymentSchema>;

export const RecordPaymentModal = ({
  applicationId,
  recordPaymentIsOpen,
  recordPaymentOnClose,
}: RecordPaymentModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormInputs>({
    resolver: zodResolver(paymentSchema),
  });

  const addPayment = async (data: PaymentFormInputs) => {
    setLoading(true);
    try {
      await axios.get(`/api/sponsor-dashboard/grants/add-tranche`, {
        params: {
          id: applicationId,
          trancheAmount: data.amount,
          txId: data.transactionLink,
          note: data.note,
        },
      });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      recordPaymentOnClose();
    }
  };

  return (
    <Modal isOpen={recordPaymentIsOpen} onClose={recordPaymentOnClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={'brand.slate.500'} fontSize={'md'} fontWeight={600}>
          Add Grant Payment
        </ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody fontWeight={500}>
          <form onSubmit={handleSubmit(addPayment)}>
            <FormControl isInvalid={!!errors.amount}>
              <FormLabel color="brand.slate.500" fontSize={'0.95rem'}>
                Amount
              </FormLabel>
              <NumberInput focusBorderColor="brand.purple">
                <NumberInputField
                  color={'brand.slate.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  {...register('amount', {
                    required: 'This field is required',
                    setValueAs: (value) => parseFloat(value),
                  })}
                  placeholder="Enter amount"
                />
              </NumberInput>
              <FormErrorMessage>
                {errors.amount && <p>{errors.amount.message}</p>}
              </FormErrorMessage>
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.transactionLink}>
              <FormLabel color="brand.slate.500" fontSize={'0.95rem'}>
                Transaction Link
              </FormLabel>
              <Input
                mt={-1}
                {...register('transactionLink')}
                placeholder="Enter transaction link"
              />
              <FormErrorMessage>
                {errors.transactionLink && (
                  <p>{errors.transactionLink.message}</p>
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color="brand.slate.500" fontSize={'0.95rem'}>
                Note
              </FormLabel>
              <Input mt={-1} {...register('note')} placeholder="Enter note" />
            </FormControl>
            <Button
              w="full"
              my={6}
              isLoading={loading}
              leftIcon={
                loading ? (
                  <Spinner color="white" size="sm" />
                ) : (
                  <BiPlus color="white" size="18px" />
                )
              }
              loadingText="Adding Payment"
              type="submit"
            >
              Add Payment
            </Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
