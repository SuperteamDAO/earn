import { ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { tokenList, PrizeList } from '../../constants';
import { Skill, SkillList, TalentSkillMap } from '../../interface/types';

interface PrizeList {
  label: string;
  placeHolder: number;
}
interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
}
export const CreatebountyPayment = ({ setSteps }: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  const [tokenIndex, setTokenIndex] = useState<number | undefined>(undefined);
  const [prizes, setPrize] = useState<PrizeList[]>([
    {
      label: 'First prize',
      placeHolder: 2500,
    },
  ]);
  return (
    <>
      <VStack pb={10} color={'gray.500'} pt={7} align={'start'} w={'2xl'}>
        <form onSubmit={handleSubmit((e) => {})} style={{ width: '100%' }}>
          <FormControl isRequired>
            <FormLabel>Select Token</FormLabel>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                w="100%"
                h="100%"
                fontSize="1rem"
                height={'2.6rem'}
                fontWeight={500}
                color="gray.400"
                bg="transparent"
                textAlign="start"
                overflow="hidden"
                border={'1px solid #cbd5e1'}
              >
                {tokenIndex === undefined ? (
                  'Select'
                ) : (
                  <HStack>
                    <Image
                      w={'1.6rem'}
                      rounded={'full'}
                      src={tokenList[tokenIndex as number]?.icon}
                      alt={tokenList[tokenIndex as number]?.tokenName}
                    />
                    <Text>{tokenList[tokenIndex as number]?.tokenName}</Text>
                  </HStack>
                )}
              </MenuButton>
              <MenuList
                w="40rem"
                fontSize="1rem"
                fontWeight={500}
                color="gray.400"
                maxHeight="15rem"
                overflow="scroll"
              >
                {tokenList.map((token, index) => {
                  return (
                    <>
                      <MenuItem
                        key={token.mintAddress}
                        onClick={() => {
                          setTokenIndex(index);
                        }}
                      >
                        <HStack>
                          <Image
                            w={'1.6rem'}
                            rounded={'full'}
                            src={token.icon}
                            alt={token.tokenName}
                          />
                          <Text>{token.tokenName}</Text>
                        </HStack>
                      </MenuItem>
                    </>
                  );
                })}
              </MenuList>
            </Menu>
          </FormControl>
          <VStack gap={2} mt={5}>
            {prizes.map((el, index) => {
              return (
                <FormControl key={el.label}>
                  <FormLabel>{el.label}</FormLabel>
                  <Flex gap={3}>
                    <Input
                      type={'number'}
                      placeholder={JSON.stringify(el.placeHolder)}
                    />
                    {index === prizes.length - 1 && (
                      <Button
                        onClick={() => {
                          let temp: PrizeList[] = [];
                          prizes.map((el, index) => {
                            if (index !== prizes.length - 1) {
                              temp.push(el);
                            }
                          });
                          setPrize(temp);
                        }}
                      >
                        <DeleteIcon />
                      </Button>
                    )}
                  </Flex>
                </FormControl>
              );
            })}
            <Button
              isDisabled={prizes.length === 5 && true}
              bg={'transparent'}
              w="full"
              border={'1px solid #e2e8f0'}
              onClick={() => {
                setPrize([
                  ...prizes,
                  {
                    label: PrizeList[prizes.length] + ' ' + 'prize',
                    placeHolder: (5 - prizes.length) * 500,
                  },
                ]);
              }}
            >
              Add Prize
            </Button>
          </VStack>
          <VStack gap={6} mt={10}>
            <Button
              w="100%"
              bg={'#6562FF'}
              color={'white'}
              fontSize="1rem"
              fontWeight={600}
              type={'submit'}
            >
              Finish the listing
            </Button>
            <Button
              w="100%"
              fontSize="1rem"
              fontWeight={600}
              color="gray.500"
              border="1px solid"
              borderColor="gray.200"
              bg="transparent"
            >
              Save as Drafts
            </Button>
          </VStack>
        </form>
      </VStack>
    </>
  );
};
