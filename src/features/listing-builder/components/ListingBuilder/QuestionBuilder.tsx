import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  HStack,
  Image,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { usePostHog } from 'posthog-js/react';
import React, { type Dispatch, type SetStateAction, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useListingFormStore } from '../../store';
import { type ListingFormType } from '../../types';
import { ListingFormLabel } from './Form';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  createDraft: (data: ListingFormType, isPreview?: boolean) => Promise<void>;
  editable: boolean;
  isNewOrDraft?: boolean;
  isDuplicating?: boolean;
  isDraftLoading?: boolean;
}

export interface Ques {
  order: number;
  question: string;
  type: 'text';
  delete?: boolean;
  options?: string[];
  label: string;
}

interface QuestionCardProps {
  register: any;
  index: number;
  remove: (index: number) => void;
}

const QuestionCard = ({ register, index, remove }: QuestionCardProps) => {
  return (
    <VStack align={'start'} w={'full'}>
      <FormControl isRequired>
        <ListingFormLabel>Question {index + 1}</ListingFormLabel>
        <Flex gap="4">
          <Input
            {...register(`eligibility.${index}.question`)}
            placeholder="Enter your question here"
          />
          {index > 0 && (
            <Button colorScheme="red" onClick={() => remove(index)}>
              <DeleteIcon />
            </Button>
          )}
        </Flex>
      </FormControl>
    </VStack>
  );
};

export const QuestionBuilder = ({
  setSteps,
  createDraft,
  isNewOrDraft,
  isDuplicating,
  editable,
  isDraftLoading,
}: Props) => {
  const { form, updateState } = useListingFormStore();
  const { control, handleSubmit, register, reset, getValues } = useForm({
    defaultValues: {
      eligibility: form?.eligibility?.length
        ? form.eligibility
        : [{ order: 1, question: '', type: 'text', label: '', options: [] }],
    },
  });

  const isDraft = isNewOrDraft || isDuplicating;
  useEffect(() => {
    if (editable) {
      reset({
        eligibility: (form?.eligibility || []).map((e, index) => ({
          order: e.order,
          question: e.question,
          type: e.type as 'text',
          delete: index > 0,
          label: e.question,
        })),
      });
    }
  }, [form]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'eligibility',
  });

  const onSubmit = (data: any) => {
    if (data.eligibility.length === 0) {
      toast.error('Add a minimum of one question');
      return;
    }
    const hasEmptyQuestions = data.eligibility.some((q: Ques) => !q.question);
    if (hasEmptyQuestions) {
      toast.error('All questions must be filled out');
      return;
    }

    posthog.capture('questions_sponsor');
    updateState({ ...data });
    setSteps(5);
  };

  const onDraftClick = async (isPreview: boolean = false) => {
    const data = getValues();
    const formData = { ...form, ...data };
    if (isNewOrDraft || isDuplicating) {
      posthog.capture('save draft_sponsor');
    } else {
      posthog.capture('edit listing_sponsor');
    }
    createDraft(formData as any, isPreview);
  };

  const posthog = usePostHog();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack align={'start'} gap={3} w={'2xl'} pt={5}>
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
        {fields.map((field, index) => (
          <QuestionCard
            key={field.id}
            register={register}
            index={index}
            remove={remove}
          />
        ))}
        <Button
          w={'full'}
          h={12}
          mt={4}
          color={'#64758B'}
          bg={'#F1F5F9'}
          borderRadius="sm"
          onClick={() =>
            append({
              order: fields.length + 1,
              question: '',
              type: 'text',
              label: '',
              options: [],
            })
          }
        >
          + Add Question
        </Button>
        <VStack gap={6} w={'full'} pt={10}>
          <Button
            className="ph-no-capture"
            w="100%"
            py={6}
            fontWeight={500}
            borderRadius="sm"
            type="submit"
            variant={!isDraft ? 'outline' : 'solid'}
          >
            Continue
          </Button>
          {isDraft && (
            <HStack w="full">
              <Button
                className="ph-no-capture"
                w="100%"
                py={6}
                color="brand.purple"
                fontWeight={500}
                bg="#EEF2FF"
                borderRadius="sm"
                isLoading={isDraftLoading}
                onClick={() => onDraftClick()}
                variant={'ghost'}
              >
                Save Draft
              </Button>
            </HStack>
          )}
          {!isDraft && (
            <Button
              className="ph-no-capture"
              w="100%"
              py={6}
              fontWeight={500}
              borderRadius="sm"
              isLoading={isDraftLoading}
              onClick={() => onDraftClick()}
              variant={'solid'}
            >
              Update Listing
            </Button>
          )}
        </VStack>
      </VStack>
    </form>
  );
};
