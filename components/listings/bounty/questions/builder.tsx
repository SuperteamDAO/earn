import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import React, { Dispatch, SetStateAction, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { genrateuuid } from '../../../../utils/helpers';
import { QuestionCard } from './questionCard';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  draftLoading: boolean;
  createDraft: (payment: string) => void;
  questions: Ques[];
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
}
export type QuestionType =
  | 'text'
  | 'single-choice'
  | 'long-text'
  | 'checkbox'
  | 'multi-choice'
  | 'url';
export interface Ques {
  id: string;
  question: string;
  type: QuestionType;
  delete: boolean;
  options?: string[];
  label: string;
}
const Builder = ({
  setSteps,
  createDraft,
  draftLoading,
  questions,
  setQuestions,
}: Props) => {
  return (
    <>
      <VStack gap={3} pt={7} align={'start'} w={'2xl'}>
        <HStack p={5} gap={3} w={'full'} bg={'#F7FAFC'} rounded={'md'}>
          <Image src={'/assets/icons/hands.svg'} alt={'hands'} />
          <VStack justify={'start'} align={'start'}>
            <Text fontWeight={600} fontSize={'0.88rem'} color={'#334254'}>
              Note
            </Text>
            <Text mt={'0px !important'} fontSize={'0.88rem'} color={'#94A3B8'}>
              Names, Emails, Discord / Twitter IDs, SOL wallet and Profile Links
              are collected by default. Please use this space to ask about
              anything else!
            </Text>
          </VStack>
        </HStack>
        {questions.map((question, index) => {
          return (
            <>
              <QuestionCard
                index={index}
                questions={questions}
                curentQuestion={question}
                setQuestions={setQuestions}
              />
            </>
          );
        })}
        <Button
          onClick={() => {
            setQuestions([
              ...questions,
              {
                id: genrateuuid(),
                question: '',
                type: 'text',
                options: [],
                delete: true,
                label: '',
              },
            ]);
          }}
          color={'#64758B'}
          bg={'#F1F5F9'}
          w={'full'}
          h={12}
        >
          + Add Question
        </Button>
        <Toaster />
        <VStack w={'full'} gap={6} pt={10}>
          <Button
            w="100%"
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            onClick={() => {
              if (questions.length === 0) {
                toast.error('Add minimun of one question');
                return;
              }
              let rejectedQuestion: any[] = [];

              const a = questions
                .filter(
                  (e) => e.type === 'single-choice' || e.type === 'multi-choice'
                )
                .map((e) => {
                  if (e.options?.length === 0) {
                    toast.error('Missing Options for a questions');
                    rejectedQuestion.push(e);
                    return e;
                  }
                });
              if (rejectedQuestion.length === 0) {
                setSteps(5);
              }
            }}
          >
            Continue
          </Button>
          <Button
            w="100%"
            fontSize="1rem"
            fontWeight={600}
            color="gray.500"
            border="1px solid"
            borderColor="gray.200"
            bg="transparent"
            isLoading={draftLoading}
            onClick={() => {
              createDraft('nothing');
            }}
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
    </>
  );
};

export default Builder;
