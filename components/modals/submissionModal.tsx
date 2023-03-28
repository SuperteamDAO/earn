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
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MultiSelectOptions } from '../../constants';
import { TalentStore } from '../../store/talent';
import { createSubmission, fetchOgImage } from '../../utils/functions';
import { genrateuuid } from '../../utils/helpers';
import { Ques } from '../listings/bounty/questions/builder';
import { QuestionHandler } from '../listings/bounty/questions/questionHandler';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  SubmssionMutation: UseMutationResult<
    void,
    any,
    {
      link: string;
      questions: string;
    },
    unknown
  >;
  questions: string;
  eligibility: string;
}
export const SubmissionModal = ({
  isOpen,
  onClose,
  SubmssionMutation,
  questions,
  eligibility,
}: Props) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm();
  const questionsArr = JSON.parse(questions) as Ques[];
  return (
    <>
      <Modal size={'xl'} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay></ModalOverlay>
        <ModalContent>
          <ModalHeader>Bounty Submission</ModalHeader>
          <VStack gap={3} p={5} align={'start'}>
            <Text color={'gray.500'} fontWeight={500} fontSize={'1rem'}>
              {eligibility !== 'premission-less'
                ? `This is a permissioned bounty - which means only the applicant that the sponsor will select will be eligible to work on this bounty`
                : `We can't wait to see what you've created! Winners will receive
              prizes as well as instant admission to our DAO.`}
            </Text>
            <Text color={'gray.500'} fontWeight={500} fontSize={'1rem'}>
              {eligibility !== 'premission-less'
                ? 'Please shill your best work/profile in the application link field below, and do your best to answer any custom questions added by the sponsor. We will send you an email once the applicant has been selected by the sponsor. All the best!'
                : 'Please note that bounties typically take ~5 days after the end date to be evaluated.'}
            </Text>
            <form
              style={{ width: '100%' }}
              onSubmit={handleSubmit((e) => {
                SubmssionMutation.mutate({
                  link: e.link,
                  questions: JSON.stringify(e),
                });
              })}
            >
              <VStack gap={4} my={5}>
                {questionsArr.map((e) => {
                  return (
                    <FormControl key={e.id} isRequired>
                      <QuestionHandler
                        control={control}
                        register={register}
                        index={e.id}
                        question={e.question}
                        type={e.type}
                        label={e.label ?? undefined}
                        options={e.options ?? []}
                      />
                    </FormControl>
                  );
                })}
              </VStack>

              <Button
                isLoading={SubmssionMutation.isLoading}
                type="submit"
                bg={'#6562FF'}
                color={'white'}
                w={'full'}
              >
                {eligibility === 'premission-less' ? 'Submit' : 'Apply Now'}
              </Button>
            </form>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
