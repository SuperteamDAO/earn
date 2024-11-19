import {
  AddIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DeleteIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { produce } from 'immer';
import debounce from 'lodash.debounce';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LuEye } from 'react-icons/lu';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  tokenList,
} from '@/constants';
import { type Rewards } from '@/features/listings';
import { cleanRewardPrizes, cleanRewards, sortRank } from '@/utils/rank';

import { useListingFormStore } from '../../store';
import { type ListingFormType } from '../../types';
import {
  caculateBonus,
  calculateTotalOfArray,
  formatTotalPrice,
} from '../../utils';
import { ListingFormLabel, ListingTooltip } from './Form';

interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  coingeckoSymbol: string;
}

interface PrizeListInterface {
  value: number;
  label: string;
  placeHolder: number;
  defaultValue?: number;
}

interface Props {
  isDraftLoading: boolean;
  createDraft: (data: ListingFormType, isPreview?: boolean) => Promise<void>;
  createAndPublishListing: (closeConfirm: () => void) => void;
  isListingPublishing: boolean;
  editable: boolean;
  isNewOrDraft?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
}

interface FormValues {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  token?: string;
  rewards?: Rewards;
  maxBonusSpots?: number;
}

interface MessageState {
  type: 'warning' | 'error';
  content: string;
}

const BONUS_REWARD_LABEL = '额外赏金名额';
const BONUS_REWARD_LABEL_2 = '额外赏金/每人';

const TokenSelector: React.FC<{
  selectedToken: Token | undefined;
  onTokenSelect: (token: Token) => void;
  disabled?: boolean;
}> = ({ selectedToken, onTokenSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTokens, setFilteredTokens] = useState(tokenList);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tokenList.filter(
        (token) =>
          token.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredTokens(filtered);
    } else {
      setFilteredTokens(tokenList);
    }
  }, [searchTerm]);

  return (
    <FormControl isDisabled={disabled}>
      <Flex align="center" gap={2}>
        <ListingFormLabel htmlFor="token">代币</ListingFormLabel>
        <Box pos="relative" w="full">
          <InputGroup>
            <Input
              borderColor="brand.slate.300"
              _hover={{
                borderColor: 'brand.purple',
              }}
              _focus={{
                borderColor: 'brand.purple',
                boxShadow: 'none',
              }}
              id="token"
              onClick={() => !disabled && setIsOpen(true)}
              placeholder="选择代币"
              readOnly
              value={selectedToken?.tokenSymbol || ''}
            />
            <InputRightElement>
              <ChevronDownIcon color="brand.slate.500" />
            </InputRightElement>
          </InputGroup>
          {isOpen && !disabled && (
            <Box
              pos="absolute"
              zIndex={10}
              top="100%"
              left={0}
              overflowY="auto"
              w="full"
              maxH="200px"
              bg="white"
              borderWidth={1}
              borderColor="brand.slate.300"
              borderRadius="sm"
              shadow="sm"
            >
              <Input
                borderWidth={0}
                borderBottomWidth={1}
                borderRadius={0}
                _focus={{
                  boxShadow: 'none',
                  borderColor: 'brand.purple',
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索代币..."
                value={searchTerm}
              />
              {filteredTokens.map((token) => (
                <Flex
                  key={token.tokenSymbol}
                  align="center"
                  gap={2}
                  px={3}
                  py={2}
                  _hover={{ bg: 'brand.slate.50' }}
                  cursor="pointer"
                  onClick={() => {
                    onTokenSelect(token);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <Image
                    w={6}
                    h={6}
                    borderRadius="full"
                    alt={token.tokenName}
                    src={token.icon}
                  />
                  <Box>
                    <Text fontWeight={500}>{token.tokenSymbol}</Text>
                    <Text color="brand.slate.500" fontSize="sm">
                      {token.tokenName}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Box>
          )}
        </Box>
      </Flex>
    </FormControl>
  );
};

const RewardInput: React.FC<{
  type: 'fixed' | 'min' | 'max';
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}> = ({ type, value, onChange, placeholder, error, disabled }) => {
  const label =
    type === 'fixed' ? '赏金金额' : type === 'min' ? '最小金额' : '最大金额';

  return (
    <FormControl isDisabled={disabled}>
      <Flex align="center" gap={2}>
        <ListingFormLabel htmlFor={`reward-${type}`}>{label}</ListingFormLabel>
        <Box w="full">
          <NumberInput
            borderColor="brand.slate.300"
            focusBorderColor="brand.purple"
            id={`reward-${type}`}
            min={0}
            onChange={(_, value) => onChange(value)}
            value={value}
          >
            <NumberInputField
              color="brand.slate.800"
              border={0}
              _focusWithin={{
                borderWidth: 0,
              }}
              _placeholder={{ color: 'brand.slate.300' }}
              placeholder={placeholder}
            />
            <NumberInputStepper>
              <NumberIncrementStepper h={1} border={0}>
                <ChevronUpIcon w={4} h={4} />
              </NumberIncrementStepper>
              <NumberDecrementStepper h={1} border={0}>
                <ChevronDownIcon w={4} h={4} />
              </NumberDecrementStepper>
            </NumberInputStepper>
          </NumberInput>
          {error && <FormHelperText color="red.500">{error}</FormHelperText>}
        </Box>
      </Flex>
    </FormControl>
  );
};

export const ListingPayments: React.FC<Props> = ({
  isListingPublishing,
  isDraftLoading,
  createDraft,
  createAndPublishListing,
  editable,
  isNewOrDraft,
  type,
  isDuplicating,
}) => {
  const { form, updateState } = useListingFormStore();
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();

  const [, setIsOpen] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    tokenList.find((t) => t.tokenSymbol === form?.token),
  );

  const clearMessage = () => {
    setMessage(null);
  };

  const showMessage = (type: 'warning' | 'error', content: string) => {
    setMessage({ type, content });
    const timer = setTimeout(clearMessage, 5000);
    return () => clearTimeout(timer);
  };

  const { setValue, watch, control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      compensationType: form?.compensationType as
        | 'fixed'
        | 'range'
        | 'variable'
        | undefined,
      rewardAmount: form?.rewardAmount,
      minRewardAsk: form?.minRewardAsk,
      maxRewardAsk: form?.maxRewardAsk,
      token: form?.token,
      rewards: form?.rewards,
      maxBonusSpots: form?.maxBonusSpots,
    },
  });

  const compensationType = watch('compensationType');
  const rewardAmount = watch('rewardAmount');
  const minRewardAsk = watch('minRewardAsk');
  const maxRewardAsk = watch('maxRewardAsk');
  const token = watch('token');
  const rewards = watch('rewards');
  const maxBonusSpots = watch('maxBonusSpots');

  useEffect(() => {
    if (form && maxBonusSpots !== undefined) {
      if (maxBonusSpots > MAX_BONUS_SPOTS) {
        showMessage('warning', '最大额外赏金名额为 50');
      } else if (maxBonusSpots === 0) {
        showMessage('warning', '额外赏金名额不能为 0');
      }
    }
  }, [maxBonusSpots, form]);

  useEffect(() => {
    if (form && rewards && rewards[BONUS_REWARD_POSITION] !== undefined) {
      if (rewards[BONUS_REWARD_POSITION] === 0) {
        showMessage('warning', '额外赏金/每人不能为 0');
      } else if (rewards[BONUS_REWARD_POSITION] < 0.01) {
        showMessage('warning', '额外赏金/每人不能小于 0.01');
      }
    }
  }, [rewards]);

  const [, setSearchTerm] = useState<string | undefined>(
    tokenList.find((t) => t.tokenSymbol === token)?.tokenName,
  );
  const [] = useState<number | null>(null);

  const [debouncedRewardAmount, setDebouncedRewardAmount] =
    useState(rewardAmount);

  const generatePrizeList = (
    rewards: Rewards | undefined,
  ): PrizeListInterface[] => {
    if (!rewards) {
      return [
        {
          value: 1,
          label: `第 1 名`,
          placeHolder: MAX_PODIUMS * 500,
        },
      ];
    }

    const sortedRanks = sortRank(cleanRewards(rewards));

    return sortedRanks.map((r, index) => {
      let placeHolder: number;

      if (r === BONUS_REWARD_POSITION) {
        placeHolder = 100;
      } else {
        placeHolder = Math.max((MAX_PODIUMS - index) * 500, 500);
      }

      return {
        value: r,
        label: r === BONUS_REWARD_POSITION ? BONUS_REWARD_LABEL : `第 ${r} 名`,
        placeHolder,
        defaultValue: rewards[r as keyof Rewards],
      };
    });
  };

  function deleteKeyRewards(rewards: Rewards, indexToDelete: string): Rewards {
    return produce(rewards, (draft) => {
      const entries = Object.entries(draft)
        .filter(([key]) => key !== BONUS_REWARD_POSITION + '')
        .sort(([a], [b]) => Number(a) - Number(b));
      const deleteIndex = entries.findIndex(([key]) => key === indexToDelete);

      if (deleteIndex !== -1) {
        entries.splice(deleteIndex, 1);
      }

      Object.keys(draft).forEach((key) => {
        if (key !== BONUS_REWARD_POSITION + '') {
          delete draft[Number(key)];
        }
      });

      entries.forEach(([, value], index) => {
        draft[`${index + 1}`] = value;
      });

      if (BONUS_REWARD_POSITION in rewards) {
        draft[BONUS_REWARD_POSITION] = rewards[BONUS_REWARD_POSITION];
      }
    });
  }

  const [prizes, setPrizes] = useState<PrizeListInterface[]>(() =>
    generatePrizeList(form?.rewards),
  );

  useEffect(() => {
    setPrizes(generatePrizeList(rewards));
  }, [rewards]);

  const handleTokenChange = (tokenSymbol: string | undefined) => {
    setValue('token', tokenSymbol);
    const selectedToken = tokenList.find((t) => t.tokenSymbol === tokenSymbol);
    setSearchTerm(selectedToken?.tokenName);
    setSelectedToken(selectedToken);
  };

  const handlePrizeValueChange = (prizeName: number, value: number) => {
    setValue('rewards', { ...rewards, [prizeName]: value });
  };

  const handleBonusChange = (value: number | undefined) => {
    setValue('maxBonusSpots', value);
    if (
      value === undefined &&
      prizes.find((p) => p.value === BONUS_REWARD_POSITION)
    ) {
      const updatedRewards = { ...rewards };
      delete updatedRewards[BONUS_REWARD_POSITION];
      setValue('rewards', updatedRewards, { shouldValidate: true });
    }
  };

  const handlePrizeDelete = (prizeToDelete: keyof Rewards) => {
    if (prizeToDelete === BONUS_REWARD_POSITION) return;
    if (rewards) {
      const updatedRewards = deleteKeyRewards(rewards, prizeToDelete + '');
      setValue('rewards', updatedRewards, { shouldValidate: true });
    }
  };

  const isProject = type === 'project';

  const validateForm = (data: FormValues) => {
    if (data.compensationType === 'fixed') {
      if (!data.rewardAmount || data.rewardAmount <= 0) {
        return '请输入有效的固定赏金金额';
      }
    } else if (data.compensationType === 'range') {
      if (!data.minRewardAsk || data.minRewardAsk <= 0) {
        return '请输入有效的最小赏金金额';
      }
      if (!data.maxRewardAsk || data.maxRewardAsk <= 0) {
        return '请输入有效的最大赏金金额';
      }
      if (data.minRewardAsk >= data.maxRewardAsk) {
        return '最小赏金金额必须小于最大赏金金额';
      }
    } else if (data.compensationType === 'variable') {
      const rewardValues = Object.values(data.rewards || {}).filter(
        (value): value is number => typeof value === 'number' && value > 0,
      );
      if (rewardValues.length === 0) {
        return '请至少设置一个有效的奖励金额';
      }
    }
    return '';
  };

  const onSubmit = async (data: FormValues) => {
    const errorMessage = validateForm(data);
    if (errorMessage) {
      showMessage('error', errorMessage);
      return;
    }

    let newState = { ...data };
    if (isProject) {
      if (compensationType === 'fixed') {
        newState = { ...data, rewards: { 1: rewardAmount } };
      } else {
        newState = { ...data, rewards: { 1: 0 } };
      }
    }
    updateState(newState);
    if (errorMessage) {
      setMessage({ type: 'error', content: errorMessage });
    } else {
      posthog.capture('发布赏金任务');
      confirmOnOpen();
    }
  };

  let compensationHelperText;

  switch (compensationType) {
    case 'fixed':
      compensationHelperText = '感兴趣的申请者将根据赏金金额申请';
      break;
    case 'range':
      compensationHelperText = '允许申请者在指定范围内提交报价';
      break;
    case 'variable':
      compensationHelperText = '允许申请者提交任意金额的报价';
      break;
  }

  const posthog = usePostHog();

  const isDraft = isNewOrDraft || isDuplicating;

  const calculateTotalPrizes = () =>
    cleanRewards(rewards, true).length + (maxBonusSpots ?? 0);

  const calculateTotalReward = () =>
    calculateTotalOfArray([
      ...cleanRewardPrizes(rewards, true),
      caculateBonus(maxBonusSpots || 0, rewards?.[BONUS_REWARD_POSITION] || 0),
    ]);

  useEffect(() => {
    if (compensationType === 'fixed' && type !== 'project')
      setValue('rewardAmount', calculateTotalReward());
  }, [rewards, maxBonusSpots, compensationType, type]);

  useEffect(() => {
    const debouncedUpdate = debounce((amount) => {
      setDebouncedRewardAmount(amount);
    }, 700);

    debouncedUpdate(rewardAmount);
    return () => {
      debouncedUpdate.cancel();
    };
  }, [rewardAmount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const input = document.getElementById('search-input');
      if (input && !input.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUpdateListing = async () => {
    const data = {
      compensationType,
      rewardAmount,
      minRewardAsk,
      maxRewardAsk,
      token,
      rewards,
      maxBonusSpots,
    };
    await createDraft(data);
  };

  const onDraftClick = async (isPreview?: boolean) => {
    const data = {
      compensationType,
      rewardAmount,
      minRewardAsk,
      maxRewardAsk,
      token,
      rewards,
      maxBonusSpots,
    };
    await createDraft(data, isPreview);
  };

  return (
    <>
      <Modal isOpen={confirmIsOpen} onClose={confirmOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>确认发布？</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {form?.isPrivate
                ? '由于该任务被标记为"非公开任务"，它只能通过链接访问，不会在网站其他地方显示。'
                : '赏金任务发布后会公开展示在Solar Earn 主页，在发布前请检查确认赏金任务详情。'}
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button mr={4} onClick={confirmOnClose} variant="ghost">
              关闭
            </Button>
            <Button
              mr={3}
              colorScheme="blue"
              disabled={isListingPublishing}
              isLoading={isListingPublishing}
              loadingText="发布中..."
              onClick={() => createAndPublishListing(confirmOnClose)}
            >
              发布
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <VStack
        align={'start'}
        gap={2}
        w={'2xl'}
        pt={5}
        pb={10}
        color={'gray.500'}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          {isProject && (
            <Box w="100%" mb={4}>
              <FormControl isRequired>
                <Flex>
                  <ListingFormLabel htmlFor="compensationType">
                    添加赏金数额
                  </ListingFormLabel>
                  <ListingTooltip label="添加赏金任务的奖池分配方案" />
                </Flex>
                <Controller
                  control={control}
                  name="compensationType"
                  render={({ field: { onChange, value, ref } }) => (
                    <Select
                      ref={ref}
                      h="2.8rem"
                      color="brand.slate.900"
                      borderColor="brand.slate.300"
                      borderRadius={'sm'}
                      isDisabled={!editable}
                      onChange={(e) => {
                        onChange(e);
                        setValue('minRewardAsk', undefined);
                        setValue('maxRewardAsk', undefined);
                        setValue('rewards', { 1: NaN });
                        setValue('rewardAmount', undefined);
                      }}
                      value={value}
                    >
                      <option hidden disabled value="">
                        选择代币
                      </option>
                      <option value="fixed">固定赏金</option>
                      <option value="range">固定范围</option>
                      <option value="variable">变动赏金</option>
                    </Select>
                  )}
                />
              </FormControl>
              <Text mt={1} color="green.500" fontSize={'xs'}>
                {compensationHelperText}
              </Text>
            </Box>
          )}
          <TokenSelector
            selectedToken={selectedToken}
            onTokenSelect={handleTokenChange}
            disabled={!editable}
          />
          {compensationType === 'fixed' && isProject && (
            <RewardInput
              type="fixed"
              value={rewardAmount}
              onChange={(value) => setValue('rewardAmount', value)}
              placeholder={(MAX_PODIUMS * 500).toString()}
              disabled={!editable}
            />
          )}
          {compensationType === 'range' && (
            <Flex gap="3" w="100%">
              <RewardInput
                type="min"
                value={minRewardAsk}
                onChange={(value) => setValue('minRewardAsk', value)}
                placeholder="输入最低赏金"
                disabled={!editable}
              />
              <RewardInput
                type="max"
                value={maxRewardAsk}
                onChange={(value) => setValue('maxRewardAsk', value)}
                placeholder="输入最高赏金"
                disabled={!editable}
              />
            </Flex>
          )}
          {type !== 'project' && (
            <VStack gap={4} w={'full'} mt={5}>
              <HStack
                justifyContent="space-between"
                w="full"
                pb={3}
                borderColor="brand.slate.200"
                borderBottomWidth="1px"
              >
                <Text>
                  {calculateTotalPrizes()}{' '}
                  {calculateTotalPrizes() > 1 ? '个奖励' : '个奖励'}
                </Text>
                <Text>
                  {formatTotalPrice(calculateTotalReward())}{' '}
                  {selectedToken?.tokenSymbol} 总赏金
                </Text>
              </HStack>
              {prizes.map((el) => (
                <FormControl key={el.value}>
                  <Flex w="full">
                    <FormLabel color={'gray.500'} textTransform="capitalize">
                      {el.label}
                    </FormLabel>
                    {el.value === BONUS_REWARD_POSITION && (
                      <FormLabel
                        pl={8}
                        color={'gray.500'}
                        textTransform="capitalize"
                      >
                        {BONUS_REWARD_LABEL_2}
                      </FormLabel>
                    )}
                  </Flex>
                  <Flex
                    pos="relative"
                    pr={4}
                    borderWidth={1}
                    borderStyle={'solid'}
                    borderColor="brand.slate.300"
                    borderRadius={'sm'}
                    _focusWithin={{
                      borderColor: 'brand.purple',
                    }}
                  >
                    {el.value === BONUS_REWARD_POSITION && (
                      <NumberInput
                        w={'30%'}
                        color="brand.slate.500"
                        border={'none'}
                        borderColor="brand.slate.300"
                        borderRightWidth={'1px'}
                        borderRightStyle={'solid'}
                        defaultValue={maxBonusSpots ?? 1}
                        focusBorderColor="rgba(0,0,0,0)"
                        isDisabled={!editable}
                        max={MAX_BONUS_SPOTS}
                        min={1}
                        onChange={(valueString) =>
                          handleBonusChange(parseInt(valueString))
                        }
                      >
                        <NumberInputField
                          color={'brand.slate.800'}
                          border={0}
                          _focusWithin={{
                            borderWidth: 0,
                          }}
                          _placeholder={{
                            color: 'brand.slate.300',
                          }}
                          placeholder={JSON.stringify(el.placeHolder)}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper h={1} border={0}>
                            <ChevronUpIcon w={4} h={4} />
                          </NumberIncrementStepper>
                          <NumberDecrementStepper h={1} border={0}>
                            <ChevronDownIcon w={4} h={4} />
                          </NumberDecrementStepper>
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                    <NumberInput
                      w={el.value === BONUS_REWARD_POSITION ? '70%' : '100%'}
                      color="brand.slate.500"
                      border={'none'}
                      borderColor="brand.slate.300"
                      focusBorderColor="brand.purple"
                      isDisabled={!editable}
                      min={el.value === BONUS_REWARD_POSITION ? 0.01 : 0}
                      onChange={(valueString) =>
                        handlePrizeValueChange(
                          el.value,
                          parseFloat(valueString),
                        )
                      }
                      value={
                        el.defaultValue !== null &&
                        el.defaultValue !== undefined &&
                        !isNaN(el.defaultValue)
                          ? el.defaultValue
                          : undefined
                      }
                    >
                      <NumberInputField
                        color={'brand.slate.800'}
                        border={0}
                        _focusWithin={{
                          borderWidth: 0,
                        }}
                        _placeholder={{
                          color: 'brand.slate.300',
                        }}
                        placeholder={JSON.stringify(el.placeHolder)}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper h={1} border={0}>
                          <ChevronUpIcon w={4} h={4} />
                        </NumberIncrementStepper>
                        <NumberDecrementStepper h={1} border={0}>
                          <ChevronDownIcon w={4} h={4} />
                        </NumberDecrementStepper>
                      </NumberInputStepper>
                    </NumberInput>

                    <SelectedToken token={selectedToken} />
                    {el.value > 1 && editable && (
                      <Button
                        pos="absolute"
                        right={-12}
                        px={0}
                        onClick={() => {
                          if (el.value === BONUS_REWARD_POSITION) {
                            handleBonusChange(undefined);
                          } else {
                            handlePrizeDelete(el.value as keyof Rewards);
                          }
                        }}
                        variant="ghost"
                      >
                        <DeleteIcon />
                      </Button>
                    )}
                  </Flex>
                  {!!message &&
                    message.type === 'warning' &&
                    el.value === BONUS_REWARD_POSITION && (
                      <Text pt={2} color="yellow.500" fontSize="sm">
                        {message.content}
                      </Text>
                    )}
                  {el.value === BONUS_REWARD_POSITION &&
                    !!rewards?.[BONUS_REWARD_POSITION] &&
                    rewards?.[BONUS_REWARD_POSITION] > 0 &&
                    !!maxBonusSpots &&
                    maxBonusSpots > 0 && (
                      <FormHelperText
                        display={'flex'}
                        w="full"
                        pt={2}
                        color="brand.slate.500"
                      >
                        <Text pr={1} fontWeight={700}>
                          {maxBonusSpots} 位参赛者
                        </Text>{' '}
                        将各自获得
                        <Text px={1} fontWeight={700}>
                          {' '}
                          {formatTotalPrice(
                            rewards?.[BONUS_REWARD_POSITION]!,
                          )}{' '}
                          {selectedToken?.tokenSymbol}{' '}
                        </Text>
                        个额外赏金（总额外赏金为{' '}
                        <Text pl={1} fontWeight={700}>
                          {formatTotalPrice(
                            caculateBonus(
                              maxBonusSpots,
                              rewards?.[BONUS_REWARD_POSITION],
                            ),
                          )}{' '}
                          {selectedToken?.tokenSymbol}
                        </Text>
                        ）
                      </FormHelperText>
                    )}
                </FormControl>
              ))}
            </VStack>
          )}
          <VStack
            gap={4}
            w={'full'}
            mt={10}
            pt={4}
            borderColor="brand.slate.200"
            borderTopWidth="1px"
          >
            <Text color="yellow.500">
              {!!debouncedRewardAmount &&
                debouncedRewardAmount <= 100 &&
                (token === 'USDT' || token === 'USDC') &&
                '注意：由于该任务赏金 ≤100 美元，它将不会显示在 Solar Earn 的首页。提高总赏金数额可以提升任务曝光度。'}
            </Text>
            {type !== 'project' && (
              <HStack w="full">
                <Button
                  w="full"
                  py={6}
                  color="brand.slate.700"
                  fontWeight={500}
                  borderColor="brand.slate.700"
                  borderRadius="sm"
                  isDisabled={
                    !editable ||
                    (prizes.filter((p) => p.value !== BONUS_REWARD_POSITION)
                      .length === MAX_PODIUMS &&
                      true)
                  }
                  leftIcon={<AddIcon />}
                  onClick={() => {
                    const filteredPrize = prizes.filter(
                      (p) => p.value !== BONUS_REWARD_POSITION,
                    );
                    handlePrizeValueChange(filteredPrize.length + 1 || 1, NaN);
                  }}
                  variant="outline"
                >
                  添加独立奖励
                </Button>
                {!prizes.find((p) => p.value === BONUS_REWARD_POSITION) && (
                  <Button
                    w="full"
                    py={6}
                    color="brand.slate.500"
                    fontWeight={500}
                    bg="brand.slate.100"
                    borderRadius="sm"
                    isDisabled={
                      !editable ||
                      (prizes.find((p) => p.value === BONUS_REWARD_POSITION) &&
                        true)
                    }
                    leftIcon={<AddIcon />}
                    onClick={() => {
                      handleBonusChange(1);
                      handlePrizeValueChange(BONUS_REWARD_POSITION, NaN);
                    }}
                  >
                    添加额外赏金
                  </Button>
                )}
              </HStack>
            )}
            {isDraft && (
              <Button
                className="ph-no-capture"
                w="100%"
                py={6}
                fontWeight={500}
                borderRadius="sm"
                disabled={isListingPublishing}
                isLoading={isListingPublishing}
                type="submit"
                variant={'solid'}
              >
                立即发布
              </Button>
            )}
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
                  保存草稿
                </Button>
                <Button
                  className="ph-no-capture"
                  w="100%"
                  py={6}
                  color="brand.slate.500"
                  fontWeight={500}
                  borderRadius="sm"
                  isLoading={isDraftLoading}
                  leftIcon={<LuEye />}
                  onClick={() => onDraftClick(true)}
                  variant={'outline'}
                >
                  预览
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
                onClick={() => {
                  posthog.capture('编辑赏金任务');
                  handleUpdateListing();
                }}
                variant={'solid'}
              >
                更新赏金任务
              </Button>
            )}
            {!!message && message.type === 'error' && (
              <Text color="red.500">{message.content}</Text>
            )}
          </VStack>
        </form>
      </VStack>
    </>
  );
};

const SelectedToken: React.FC<{
  token: Token | undefined;
}> = ({ token }) => {
  if (!token) return null;
  return (
    <Flex
      pos="absolute"
      top="50%"
      right={4}
      align="center"
      gap={1.5}
      px={2}
      bg="white"
      borderRadius="sm"
      transform="translateY(-50%)"
    >
      <Image
        w={4}
        h={4}
        borderRadius="full"
        alt={token.tokenName}
        src={token.icon}
      />
      <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
        {token.tokenSymbol}
      </Text>
    </Flex>
  );
};
