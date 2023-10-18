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
          <ModalHeader>
            {eligibility !== 'permission-less'
              ? 'Submit Your Application'
              : 'Bounty Submission'}
          </ModalHeader>
          <VStack align={'start'} gap={3} p={5}>
            <Text color={'gray.500'} fontSize={'1rem'} fontWeight={500}>
              {eligibility !== 'permission-less'
                ? `Don't start working just yet! Apply first, and then begin working only once you've been hired for the project by the sponsor.`
                : `We can't wait to see what you've created! Winners will receive
              prizes as well as instant admission to our DAO.`}
            </Text>
            <Text color={'gray.500'} fontSize={'1rem'} fontWeight={500}>
              {eligibility !== 'permission-less'
                ? 'Please note that the sponsor might contact you to assess fit before picking the winner.'
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
              <VStack gap={4} overflow={'scroll'} h={'20rem'} my={5}>
                {questionsArr.map((e) => {
                  return (
                    <FormControl key={e.order} isRequired>
                      <QuestionHandler
                        control={control}
                        register={register}
                        question={e.question}
                        type={e.type}
                        label={e.label}
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
                {eligibility === 'permission-less' ? 'Submit' : 'Apply'}
              </Button>
            </form>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
