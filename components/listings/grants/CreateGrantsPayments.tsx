import { ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
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
  Text,
  VStack,
} from '@chakra-ui/react';
import { OutputData } from '@editorjs/editorjs';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { tokenList, PrizeList, MultiSelectOptions } from '../../../constants';
import { PrizeListType } from '../../../interface/listings';
import { PrizeLabels } from '../../../interface/types';
import { SponsorStore } from '../../../store/sponsor';

interface PrizeList {
  label: string;
  placeHolder: number;
}
interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  editorData: OutputData | undefined;
  mainSkills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
}
export const CreateGrantsPayment = ({
  setSteps,
  editorData,
  mainSkills,
  subSkills,
}: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  // handles which token is selected
  const [tokenIndex, setTokenIndex] = useState<number | undefined>(undefined);
  // stores the state for prize

  return (
    <>
      <VStack pb={10} color={'gray.500'} pt={7} align={'start'} w={'2xl'}>
        <form
          onSubmit={handleSubmit(async (e) => {
            console.log(e);
          })}
          style={{ width: '100%' }}
        >
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
          <HStack my={6}>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'min_sal'}
                >
                  Minimum Salary (USD)
                </FormLabel>
              </Flex>

              <Input
                id="min_sal"
                type={'number'}
                placeholder="100,000"
                {...register('min_sal')}
              />
              <FormErrorMessage>
                {errors.min_sal ? <>{errors.min_sal.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'max_sal'}
                >
                  Maximum Salary (USD)
                </FormLabel>
              </Flex>

              <Input
                id="max_sal"
                placeholder="150,000"
                type={'number'}
                {...register('max_sal')}
              />
              <FormErrorMessage>
                {errors.max_sal ? <>{errors.max_sal.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
          </HStack>
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
