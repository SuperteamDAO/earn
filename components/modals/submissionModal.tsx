import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import {
  useMutation,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { TalentStore } from '../../store/talent';
import { createSubmission, fetchOgImage } from '../../utils/functions';
import { genrateuuid } from '../../utils/helpers';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  SubmssionMutation: UseMutationResult<void, any, string, unknown>;
}
export const SubmissionModal = ({
  isOpen,
  onClose,
  SubmssionMutation,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  return (
    <>
      <Modal size={'xl'} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay></ModalOverlay>
        <ModalContent>
          <ModalHeader>Bounty Submission</ModalHeader>
          <VStack gap={3} p={5} align={'start'}>
            <Text color={'gray.500'} fontWeight={500} fontSize={'1rem'}>
              {`We can't wait to see what you've created! Winners will receive
              prizes as well as instant admission to our DAO.`}
            </Text>
            <Text color={'gray.500'} fontWeight={500} fontSize={'1rem'}>
              Please note that bounties typically take ~5 days after the end
              date to be evaluated.
            </Text>
            <form
              style={{ width: '100%' }}
              onSubmit={handleSubmit((e) => {
                SubmssionMutation.mutate(e.link);
              })}
            >
              <VStack w={'full'} gap={4}>
                <FormControl isRequired>
                  <Flex align={'center'} justify={'start'}>
                    <FormLabel
                      color={'gray.500'}
                      fontWeight={600}
                      fontSize={'15px'}
                      htmlFor={'username'}
                    >
                      Discord Username
                    </FormLabel>
                  </Flex>
                  <Input
                    w={'full'}
                    id="username"
                    placeholder="username"
                    color={'gray.500'}
                    {...register('username')}
                  />
                </FormControl>
                <FormControl>
                  <Flex align={'center'} justify={'start'}>
                    <FormLabel
                      color={'gray.500'}
                      fontWeight={600}
                      fontSize={'15px'}
                      htmlFor={'twitter'}
                    >
                      Tweet Link
                    </FormLabel>
                  </Flex>
                  <Input
                    w={'full'}
                    id="twitter"
                    placeholder="twitter"
                    color={'gray.500'}
                    {...register('twitter')}
                  />
                </FormControl>
                <FormControl isRequired>
                  <Flex align={'center'} justify={'start'}>
                    <FormLabel
                      color={'gray.500'}
                      fontWeight={600}
                      fontSize={'15px'}
                      htmlFor={'link'}
                    >
                      Submssion Link
                    </FormLabel>
                  </Flex>
                  <Input
                    w={'full'}
                    id="link"
                    placeholder="link"
                    color={'gray.500'}
                    {...register('link')}
                  />
                </FormControl>
                <FormControl isRequired>
                  <Flex align={'center'} justify={'start'}>
                    <FormLabel
                      color={'gray.500'}
                      fontWeight={600}
                      fontSize={'15px'}
                      htmlFor={'wallet'}
                    >
                      Sol Wallet
                    </FormLabel>
                  </Flex>
                  <Input
                    w={'full'}
                    id="wallet"
                    placeholder="wallet"
                    color={'gray.500'}
                    {...register('wallet')}
                  />
                </FormControl>
                <Button
                  isLoading={isSubmitting}
                  type="submit"
                  bg={'#6562FF'}
                  color={'white'}
                  w={'full'}
                >
                  Submit
                </Button>
              </VStack>
            </form>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
