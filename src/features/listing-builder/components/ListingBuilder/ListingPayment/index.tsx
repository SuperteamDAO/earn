import { Button, Text, useDisclosure, VStack } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  tokenList,
} from '@/constants';
import { type Rewards } from '@/features/listings';
import {
  cleanRewardPrizes,
  cleanRewards,
  getRankLabels,
  sortRank,
} from '@/utils/rank';

import { useListingFormStore } from '../../../store';
import { type ListingFormType } from '../../../types';
import { caculateBonus, calculateTotalOfArray } from '../../../utils';
import { PrizeActionButtons } from './PrizeActionButtons';
import { PrizeInput } from './PrizeInput';
import { PublishConfirmModal } from './PublishConfirmModal';
import { RangeInput } from './RangeInput';
import { SelectCompensationType } from './SelectCompensationType';
import { SelectToken } from './SelectToken';
import { ShowTotalPrize } from './ShowTotalPrize';
import { TotalCompInput } from './TotalCompInput';
import { type FormType, type PrizeListInterface, type Token } from './types';

interface Props {
  isDraftLoading: boolean;
  createDraft: (data: ListingFormType) => Promise<void>;
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  editable: boolean;
  isNewOrDraft?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
}

const BONUS_REWARD_LABEL = '# of Bonus Prizes';
const BONUS_REWARD_LABEL_2 = 'Bonus Per Prize';

export const ListingPayments = ({
  isListingPublishing,
  createDraft,
  isDraftLoading,
  createAndPublishListing,
  editable,
  isNewOrDraft,
  type,
  isDuplicating,
}: Props) => {
  const { form, updateState } = useListingFormStore();
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();

  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    tokenList.find((t) => t.tokenSymbol === form?.token),
  );

  const { register, setValue, watch, control, handleSubmit, reset, getValues } =
    useForm<FormType>({
      defaultValues: {
        compensationType: form?.compensationType,
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
      if (maxBonusSpots > MAX_BONUS_SPOTS)
        setWarningMessage('Maximum number of bonus prizes allow is 50');
      if (maxBonusSpots === 0) {
        setWarningMessage("# of bonus prizes can't be 0");
      }
    }
  }, [maxBonusSpots, form]);

  useEffect(() => {
    if (form && rewards && rewards[BONUS_REWARD_POSITION] !== undefined) {
      if (rewards[BONUS_REWARD_POSITION] === 0) {
        setWarningMessage(`Bonus per prize can't be 0`);
      } else if (rewards[BONUS_REWARD_POSITION] < 0.01) {
        setWarningMessage(`Bonus per prize can't be less than 0.01`);
      }
    }
  }, [rewards]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (warningMessage) {
      timer = setTimeout(() => {
        setWarningMessage('');
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [warningMessage]);

  const [searchTerm, setSearchTerm] = useState<string | undefined>(
    tokenList.find((t) => t.tokenSymbol === token)?.tokenName,
  );
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
    null,
  );

  const [debouncedRewardAmount, setDebouncedRewardAmount] =
    useState(rewardAmount);

  const generatePrizeList = (
    rewards: Rewards | undefined,
  ): PrizeListInterface[] => {
    if (!rewards) {
      return [
        {
          value: 1,
          label: `${getRankLabels(1)} prize`,
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
        label:
          r === BONUS_REWARD_POSITION
            ? BONUS_REWARD_LABEL
            : `${getRankLabels(r)} prize`,
        placeHolder,
        defaultValue: rewards[r as keyof Rewards],
      };
    });
  };

  const [prizes, setPrizes] = useState<PrizeListInterface[]>(() =>
    generatePrizeList(form?.rewards),
  );

  useEffect(() => {
    setPrizes(generatePrizeList(rewards));
  }, [rewards]);

  useEffect(() => {
    if (editable) {
      reset({
        compensationType: form?.compensationType,
        rewardAmount: form?.rewardAmount || undefined,
        minRewardAsk: form?.minRewardAsk || undefined,
        maxRewardAsk: form?.maxRewardAsk || undefined,
        rewards: form?.rewards || undefined,
        maxBonusSpots: form?.maxBonusSpots || undefined,
        token: form?.token || 'USDC',
      });

      const initialToken = form?.token || 'USDC';
      const selectedToken = tokenList.find(
        (t) => t.tokenSymbol === initialToken,
      );
      setSearchTerm(selectedToken?.tokenName);
      setSelectedToken(selectedToken);
    }
  }, [form, reset, editable]);

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
      const filteredPrize = prizes.filter(
        (p) => p.value !== BONUS_REWARD_POSITION,
      );
      setPrizes(filteredPrize);
      const updatedRewards = { ...rewards };
      delete updatedRewards[BONUS_REWARD_POSITION];
      setValue('rewards', updatedRewards, { shouldValidate: true });
    }
  };

  function getPrizeLabels(pri: PrizeListInterface[]): PrizeListInterface[] {
    return pri.map((prize, index) => ({
      ...prize,
      label:
        prize.value === BONUS_REWARD_POSITION
          ? prize.label
          : `${getRankLabels(index + 1)} prize`,
    }));
  }

  const handlePrizeDelete = (prizeToDelete: keyof Rewards) => {
    if (prizeToDelete === BONUS_REWARD_POSITION) return;
    const updatedPrizes = prizes.filter(
      (prize) => prize.value !== prizeToDelete,
    );
    setPrizes(getPrizeLabels(updatedPrizes));
    const updatedRewards = { ...rewards };
    delete updatedRewards[prizeToDelete];
    setValue('rewards', updatedRewards, { shouldValidate: true });
  };

  const isProject = type === 'project';

  const validateRewardsData = () => {
    let errorMessage = '';

    if (!selectedToken) {
      errorMessage = 'Please select a valid token';
    }

    if (isProject) {
      if (!compensationType) {
        errorMessage = 'Please add a compensation type';
      }

      if (compensationType === 'fixed' && !rewardAmount) {
        errorMessage = 'Please specify the total reward amount to proceed';
      } else if (compensationType === 'range') {
        if (!minRewardAsk || !maxRewardAsk) {
          errorMessage =
            'Please specify your preferred minimum and maximum compensation range';
        } else if (maxRewardAsk < minRewardAsk) {
          errorMessage =
            'The compensation range is incorrect; the maximum must be higher than the minimum. Please adjust it';
        } else if (maxRewardAsk === minRewardAsk) {
          errorMessage =
            'The compensation range is incorrect; the maximum must be higher than the minimum. Please adjust it.';
        }
      }
    } else {
      if (
        rewards &&
        rewards[BONUS_REWARD_POSITION] &&
        rewards[BONUS_REWARD_POSITION] === 0
      ) {
        errorMessage = "Bonus per prize can't be 0";
      } else if (
        maxBonusSpots &&
        maxBonusSpots > 0 &&
        (!rewards?.[BONUS_REWARD_POSITION] ||
          isNaN(rewards?.[BONUS_REWARD_POSITION] || NaN))
      ) {
        errorMessage = 'Bonus Reward is not mentioned';
      } else if (rewards?.[BONUS_REWARD_POSITION] === 0) {
        errorMessage = `Bonus per prize can't be 0`;
      } else if (cleanRewardPrizes(rewards).length !== prizes.length) {
        errorMessage = 'Please fill all podium ranks or remove unused';
      }
    }
    console.log('clean rewards', cleanRewardPrizes(rewards));
    console.log('prizes', prizes);
    console.log(
      'errorMessage',
      cleanRewardPrizes(rewards).length !== prizes.length,
    );

    return errorMessage;
  };

  const handleSaveDraft = async () => {
    const data = getValues();
    const formData = { ...form, ...data };
    createDraft(formData);
  };

  const handleUpdateListing = async () => {
    const errorMessage = validateRewardsData();
    const data = getValues();
    let formData = { ...form, ...data };
    if (isProject) {
      if (compensationType === 'fixed') {
        formData = { ...formData, rewards: { 1: rewardAmount ?? 0 } };
      } else {
        formData = { ...formData, rewards: { 1: 0 } };
      }
    }
    if (errorMessage) {
      setErrorMessage(errorMessage);
    } else {
      createDraft(formData);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filteredResults =
      value === ''
        ? tokenList
        : tokenList.filter((token) =>
            token.tokenName.toLowerCase().includes(value.toLowerCase()),
          );
    setSearchResults(filteredResults);
    setSelectedTokenIndex(null);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedTokenIndex((prevIndex) =>
        prevIndex === null || prevIndex === searchResults.length - 1
          ? 0
          : prevIndex + 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedTokenIndex((prevIndex) =>
        prevIndex === null || prevIndex === 0
          ? searchResults.length - 1
          : prevIndex - 1,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedTokenIndex !== null) {
        const selectedToken = searchResults[selectedTokenIndex];
        handleTokenChange(selectedToken?.tokenSymbol);
        selectedToken && handleSelectToken(selectedToken);
      }
    }
  };

  const handleSelectToken = (token: Token) => {
    setSearchTerm(token.tokenSymbol);
    setSelectedToken(token);
    setIsOpen(false);
  };

  const onSubmit = async (data: any) => {
    const errorMessage = validateRewardsData();
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
      setErrorMessage(errorMessage);
    } else {
      posthog.capture('publish listing_sponsor');
      confirmOnOpen();
    }
  };

  const posthog = usePostHog();

  const isDraft = isNewOrDraft || isDuplicating;

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

  return (
    <>
      <PublishConfirmModal
        isOpen={confirmIsOpen}
        onClose={confirmOnClose}
        createAndPublishListing={createAndPublishListing}
        isPrivate={!!form?.isPrivate}
        isListingPublishing={isListingPublishing}
      />
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
            <SelectCompensationType
              w="100%"
              mb={4}
              control={control}
              compensationType={compensationType}
              setValue={setValue}
            />
          )}
          <SelectToken
            pos="relative"
            handleKeyDown={handleKeyDown}
            searchTerm={searchTerm}
            token={token}
            selectedToken={selectedToken}
            handleSearch={handleSearch}
            isOpen={isOpen}
            searchResults={searchResults}
            selectedTokenIndex={selectedTokenIndex}
            onTokenSelectChange={(token) => {
              handleTokenChange(token.tokenSymbol);
              handleSelectToken(token);
            }}
          />
          {compensationType === 'fixed' && isProject && (
            <TotalCompInput
              w="full"
              mt={5}
              isRequired
              token={token}
              selectedToken={selectedToken}
              register={register}
            />
          )}
          {compensationType === 'range' && (
            <RangeInput
              gap="3"
              w="100%"
              selectedToken={selectedToken}
              register={register}
            />
          )}
          {type !== 'project' && (
            <VStack gap={4} w={'full'} mt={5}>
              <ShowTotalPrize
                calculateTotalReward={calculateTotalReward}
                justifyContent="space-between"
                w="full"
                pb={3}
                borderColor="brand.slate.200"
                borderBottomWidth="1px"
                rewards={rewards}
                maxBonusSpots={maxBonusSpots}
                selectedToken={selectedToken}
              />
              {prizes.map((el) => (
                <PrizeInput
                  key={el.label}
                  el={el}
                  BONUS_REWARD_LABEL_2={BONUS_REWARD_LABEL_2}
                  selectedToken={selectedToken}
                  rewards={rewards}
                  maxBonusSpots={maxBonusSpots}
                  warningMessage={warningMessage}
                  handleBonusChange={handleBonusChange}
                  handlePrizeDelete={handlePrizeDelete}
                  handlePrizeValueChange={handlePrizeValueChange}
                />
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
                "Note: This listing will not show up on Earn's Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability."}
            </Text>
            {type !== 'project' && (
              <PrizeActionButtons
                w="full"
                prizes={prizes}
                BONUS_REWARD_LABEL={BONUS_REWARD_LABEL}
                handlePrizeValueChange={handlePrizeValueChange}
                setPrizes={setPrizes}
                handleBonusChange={handleBonusChange}
              />
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
                Publish Now
              </Button>
            )}
            {isDraft && (
              <Button
                className="ph-no-capture"
                w="100%"
                py={6}
                color="brand.purple"
                fontWeight={500}
                bg="#EEF2FF"
                borderRadius="sm"
                isLoading={isDraftLoading}
                onClick={() => {
                  posthog.capture('save draft_sponsor');
                  handleSaveDraft();
                }}
                variant={'ghost'}
              >
                Save Draft
              </Button>
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
                  posthog.capture('edit listing_sponsor');
                  handleUpdateListing();
                }}
                variant={'solid'}
              >
                Update Listing
              </Button>
            )}
            {errorMessage && <Text color="red.500">{errorMessage}</Text>}
          </VStack>
        </form>
      </VStack>
    </>
  );
};
