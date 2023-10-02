import { DeleteIcon } from '@chakra-ui/icons';
import { Button, Flex, HStack, Image, Text, VStack } from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import { QuestionCard } from './questionCard';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  draftLoading: boolean;
  createDraft: () => void;
  questions: Ques[];
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
  isEditMode: boolean;
}
export type QuestionType =
  | 'text'
  | 'single-choice'
  | 'long-text'
  | 'checkbox'
  | 'multi-choice'
  | 'url';
export interface Ques {
  order: number;
  question: string;
  type: QuestionType;
  delete?: boolean;
  options?: string[];
  label: string;
}
type ErrorState = {
  order: number;
  errMessage: string;
};
const Builder = ({
  setSteps,
  createDraft,
  draftLoading,
  questions,
  setQuestions,
  isEditMode,
}: Props) => {
  const [error, setError] = useState<ErrorState[]>([]);

  const handleDelete = () => {
    const temp = questions.filter(
      (_el, index) => index !== questions.length - 1
    );
    setQuestions(temp);
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
                questions={questions}
                curentQuestion={question}
                setQuestions={setQuestions}
              />
              {index === questions.length - 1 && (
                <Button ml={4} onClick={() => handleDelete()}>
                  <DeleteIcon />
                </Button>
              )}
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
        <Toaster />
        <VStack gap={6} w={'full'} pt={10}>
          <Button
            w="100%"
            onClick={() => {
              if (questions.length === 0) {
                toast.error('Add minimun of one question');
                return;
              }
              const rejectedQuestion: any[] = [];

              questions
                .filter(
                  (e) => e.type === 'single-choice' || e.type === 'multi-choice'
                )
                .map((e) => {
                  if (e.options?.length === 0) {
                    rejectedQuestion.push(e);
                    setError([
                      ...error,
                      {
                        order: e.order,
                        errMessage:
                          'Please add at least one more option for this question',
                      },
                    ]);
                    return e;
                  }
                  if (e.options?.length === 1) {
                    rejectedQuestion.push(e);
                    setError([
                      ...error,
                      {
                        order: e.order,
                        errMessage:
                          'Please add at least one more option for this question',
                      },
                    ]);
                    return e;
                  }
                  return null;
                });

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
            {isEditMode ? 'Update' : 'Save as Draft'}
          </Button>
        </VStack>
      </VStack>
    </>
  );
};

export default Builder;
