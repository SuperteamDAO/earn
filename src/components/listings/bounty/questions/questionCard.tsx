/* tslint:disable */
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import type { Ques } from './builder';

interface Props {
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
  curentQuestion: Ques;
  questions: Ques[];
  index: number;
  errorState: ErrorState[];
}
type ErrorState = {
  order: number;
  errMessage: string;
};
export const QuestionCard = ({
  setQuestions,
  curentQuestion,
  questions,
  index,
  errorState,
}: Props) => {
  console.log('file: questionCard.tsx:36 ~ questions:', questions);
  const [option, setOption] = useState<string>('');
  const handleChangeQuestion = (newq: string) => {
    setQuestions((prev) => {
      return prev.map((q) => {
        if (q.order === curentQuestion.order) {
          return {
            ...q,
            question: newq,
            label: newq,
          };
        }
        return q;
      });
    });
  };
  // const handleChangeType = (newType: QuestionType) => {
  //   setQuestions((prev) => {
  //     return prev.map((q) => {
  //       if (q.order === curentQuestion.order) {
  //         return {
  //           ...q,
  //           type: newType,
  //         };
  //       }
  //       return q;
  //     });
  //   });
  // };
  return (
    <>
      <VStack align={'start'} w={'full'}>
        <FormControl
          w={'full'}
          isInvalid={
            !!errorState.filter((e) => e.order === curentQuestion.order)[0]
          }
        >
          <FormLabel color={'gray.500'}>
            <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
              Question {index + 1}
            </Text>
          </FormLabel>
          <Input
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => {
              handleChangeQuestion(e.target.value);
            }}
            placeholder="Enter your question here"
            value={curentQuestion.question}
          />
          <FormErrorMessage>
            {errorState?.filter((e) => e?.order === curentQuestion.order)[0] &&
              errorState?.filter((e) => e?.order === curentQuestion.order)[0]
                ?.errMessage}
          </FormErrorMessage>
        </FormControl>
        {/* <HStack justify={'space-between'} w={'full'}>
          <Select
            w={'10rem'}
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => {
              handleChangeType(e.target.value as QuestionType);
            }}
            value={curentQuestion.type}
          >
            <option value="text">Text</option>
            <option value="checkbox">Checkbox</option>
            <option value="long-text">Long Text</option>
            <option value="single-choice">Single Choice</option>
            <option value="multi-choice">Multiple Choice</option>
            <option value="url">URL</option>
          </Select>
          <HStack>
            {index + 1 !== 1 && (
              <Button
                onClick={() => {
                  setQuestions((prev: any) => {
                    return prev.map((q: any, i: number) => {
                      if (i === index) {
                        return prev[i - 1];
                      }
                      if (i === index - 1) {
                        return prev[i + 1];
                      }
                      return q;
                    });
                  });
                }}
                variant={'unstyled'}
              >
                <ChevronUpIcon />
              </Button>
            )}
            {index + 1 !== questions.length && (
              <Button
                onClick={() => {
                  setQuestions((prev: any) => {
                    return prev?.map((q: any, i: number) => {
                      if (i === index) {
                        return prev[i + 1];
                      }
                      if (i === index + 1) {
                        return prev[i - 1];
                      }
                      return q;
                    });
                  });
                }}
                variant={'unstyled'}
              >
                <ChevronDownIcon />
              </Button>
            )}
            {questions.length !== 1 && curentQuestion.delete && (
              <Button
                onClick={() => {
                  setQuestions((prev) => {
                    return prev.filter((q) => q.id !== curentQuestion.id);
                  });
                }}
                variant={'unstyled'}
              >
                <DeleteIcon />
              </Button>
            )}
          </HStack>
        </HStack> */}
        {(curentQuestion.type === 'single-choice' ||
          curentQuestion.type === 'multi-choice') && (
          <>
            <VStack w={'full'}>
              {curentQuestion.options?.map((currentOption, currentIndex) => {
                return (
                  <HStack key={currentIndex} w={'full'}>
                    <HStack w={'full'}>
                      <Text
                        color={'gray.600'}
                        fontSize={'0.88rem'}
                        fontWeight={600}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M1.5 9C1.5 4.86 4.86 1.5 9 1.5C13.14 1.5 16.5 4.86 16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9ZM3 9C3 12.315 5.685 15 9 15C12.315 15 15 12.315 15 9C15 5.685 12.315 3 9 3C5.685 3 3 5.685 3 9Z"
                            fill="#94A3B8"
                          />
                        </svg>
                      </Text>
                      <Text>{currentOption}</Text>
                    </HStack>
                    <Button
                      onClick={() => {
                        setQuestions((prev) => {
                          return prev.map((q) => {
                            if (q.order === curentQuestion.order) {
                              return {
                                ...q,
                                options: q.options?.filter(
                                  (_o, i) => i !== currentIndex
                                ),
                              };
                            }
                            return q;
                          });
                        });
                      }}
                      variant={'unstyled'}
                    >
                      <CloseIcon />
                    </Button>
                  </HStack>
                );
              })}
              <HStack w={'full'}>
                <FormControl
                  isInvalid={
                    !!errorState.filter(
                      (e) => e.order === curentQuestion.order
                    )[0]
                  }
                >
                  <Input
                    _placeholder={{
                      color: 'gray.400',
                    }}
                    onChange={(e) => {
                      setOption(e.target.value);
                    }}
                    value={option}
                  />
                </FormControl>
                <Button
                  onClick={() => {
                    if (option.length === 0) return;
                    setQuestions((prev) => {
                      return prev.map((q) => {
                        if (q.order === curentQuestion.order) {
                          return {
                            ...q,
                            options: [...(q.options as string[]), option],
                          };
                        }
                        return q;
                      });
                    });
                    setOption('');
                  }}
                >
                  <AddIcon />
                </Button>
              </HStack>
            </VStack>
          </>
        )}
      </VStack>
    </>
  );
};
