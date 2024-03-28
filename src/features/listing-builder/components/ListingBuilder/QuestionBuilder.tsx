import { Button, Flex, HStack, Image, Text, VStack } from '@chakra-ui/react';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import toast from 'react-hot-toast';

import { QuestionCard } from './QuestionCard';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  draftLoading: boolean;
  createDraft: () => void;
  questions: Ques[];
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
  editable: boolean;
  isNewOrDraft?: boolean;
  isDuplicating?: boolean;
}

export interface Ques {
  order: number;
  question: string;
  type: 'text';
  delete?: boolean;
  options?: string[];
  label: string;
}
type ErrorState = {
  order: number;
  errMessage: string;
};
export const QuestionBuilder = ({
  setSteps,
  createDraft,
  draftLoading,
  questions,
  setQuestions,
  isNewOrDraft,
  isDuplicating,
}: Props) => {
  const [error, setError] = useState<ErrorState[]>([]);

  const handleDelete = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={7}>
        <HStack gap={3} w={'full'} p={5} bg={'#F7FAFC'} rounded={'md'}>
          <Image alt={'hands'} src={'/assets/icons/hands.svg'} />
          <VStack align={'start'} justify={'start'}>
            <Text color={'#334254'} fontSize={'0.88rem'} fontWeight={600}>
              Note
            </Text>
            <Text mt={'0px !important'} color={'#94A3B8'} fontSize={'0.88rem'}>
              Names, Emails, Discord / Twitter IDs, SOL wallet and Profile Links
              are collected by default. Please use this space to ask about
              anything else!
            </Text>
          </VStack>
        </HStack>
        {questions.map((question, index) => {
          return (
            <Flex key={index} align="end" justify="space-end" w="full">
              <QuestionCard
                errorState={error}
                index={index}
                curentQuestion={question}
                setQuestions={setQuestions}
                handleDelete={() => handleDelete(index)}
              />
            </Flex>
          );
        })}
        <Button
          w={'full'}
          h={12}
          color={'#64758B'}
          bg={'#F1F5F9'}
          onClick={() => {
            setQuestions([
              ...questions,
              {
                order: (questions?.length || 0) + 1,
                question: '',
                type: 'text',
                label: '',
              },
            ]);
          }}
        >
          + Add Question
        </Button>
        <VStack gap={6} w={'full'} pt={10}>
          <Button
            w="100%"
            onClick={() => {
              if (questions.length === 0) {
                toast.error('Add minimum of one question');
                return;
              }
              const rejectedQuestion: any[] = [];

              questions.map((e) => {
                if (e.question.length === 0) {
                  rejectedQuestion.push(e);
                  setError([
                    ...error,
                    {
                      order: e.order,
                      errMessage: 'Add question',
                    },
                  ]);
                }
                return null;
              });

              if (rejectedQuestion.length === 0) {
                setSteps(5);
              }
            }}
            variant="solid"
          >
            Continue
          </Button>
          <Button
            w="100%"
            isLoading={draftLoading}
            onClick={() => {
              createDraft();
            }}
            variant="outline"
          >
            {isNewOrDraft || isDuplicating ? 'Save Draft' : 'Update Listing'}
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
