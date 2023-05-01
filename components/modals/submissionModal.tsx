import {
  Button,
  FormControl,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { UseMutationResult } from '@tanstack/react-query';
import React from 'react';
import { useForm } from 'react-hook-form';

import type { Ques } from '../listings/bounty/questions/builder';
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
  const { register, handleSubmit, control } = useForm();
  const questionsArr = JSON.parse(questions) as Ques[];
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={'xl'}>
        <ModalOverlay></ModalOverlay>
        <ModalContent>
          <ModalHeader>Bounty Submission</ModalHeader>
          <VStack align={'start'} gap={3} p={5}>
            <Text color={'gray.500'} fontSize={'1rem'} fontWeight={500}>
              {eligibility !== 'premission-less'
                ? `This is a permissioned bounty - which means only the applicant that the sponsor will select will be eligible to work on this bounty`
                : `We can't wait to see what you've created! Winners will receive
              prizes as well as instant admission to our DAO.`}
            </Text>
            <Text color={'gray.500'} fontSize={'1rem'} fontWeight={500}>
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
                w={'full'}
                color={'white'}
                bg={'#6562FF'}
                isLoading={SubmssionMutation.isLoading}
                type="submit"
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
