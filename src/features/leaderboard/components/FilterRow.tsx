import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Divider,
  Flex,
  Select,
  Tab,
  TabList,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { useTranslation } from 'next-i18next';
import { useCallback } from 'react';

import { Tooltip } from '@/components/shared/responsive-tooltip';

import { type SKILL, type TIMEFRAME } from '../types';

const selectedStyles = {
  borderColor: 'brand.purple',
  fontWeight: 500,
  color: 'black',
};

const tabfontsize = {
  base: 'xs',
  sm: 'sm',
};

interface Props {
  timeframe: TIMEFRAME;
  setTimeframe: (value: TIMEFRAME) => void;
  skill: SKILL;
  setSkill: (value: SKILL) => void;
}

export function FilterRow({ timeframe, setTimeframe, setSkill, skill }: Props) {
  const { t } = useTranslation('common');

  const debouncedSetSkill = useCallback(debounce(decideSkill, 500), []);

  function decideSkill(value: number) {
    switch (value) {
      case 0:
        setSkill('ALL');
        break;
      case 1:
        setSkill('CONTENT');
        break;
      case 2:
        setSkill('DESIGN');
        break;
      case 3:
        setSkill('DEVELOPMENT');
        break;
      case 4:
        setSkill('OTHER');
        break;
    }
  }

  function skillIndexOf(value: SKILL): number {
    switch (value) {
      case 'ALL':
        return 0;
      case 'CONTENT':
        return 1;
      case 'DESIGN':
        return 2;
      case 'DEVELOPMENT':
        return 3;
      case 'OTHER':
        return 4;
      default:
        return 0;
    }
  }

  return (
    <VStack w="full">
      <Flex
        className="hide-scrollbar"
        justify="space-between"
        overflowX="auto"
        overflowY="hidden"
        w="full"
        borderBottom="2px solid"
        borderBottomColor={'brand.slate.200'}
      >
        <Tabs
          color="brand.slate.400"
          defaultIndex={skillIndexOf(skill)}
          onChange={(value) => debouncedSetSkill(value)}
        >
          <TabList alignItems="center" borderBottomWidth={0}>
            <Tab
              w="max-content"
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              {t('leaderboard.filterRow.overallRankings')}
            </Tab>
            <Divider h="1.5rem" mr={1} ml={2} orientation="vertical" />
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              {t('leaderboard.filterRow.content')}
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              {t('leaderboard.filterRow.design')}
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              {t('leaderboard.filterRow.development')}
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              {t('leaderboard.filterRow.others')}
            </Tab>
            <Box>
              <Tooltip label={t('leaderboard.filterRow.skillFilterTooltip')}>
                <InfoOutlineIcon ml={2} w={3} h={3} />
              </Tooltip>
            </Box>
          </TabList>
        </Tabs>
        <Flex align="center" display={{ base: 'none', md: 'flex' }}>
          <Timeframe value={timeframe} setValue={setTimeframe} />
        </Flex>
      </Flex>
      <Flex
        justify="space-between"
        display={{ base: 'flex', md: 'none' }}
        w="full"
        pl={2}
        fontSize={{ base: 'xs', sm: 'sm' }}
      >
        <Text color="brand.slate.400">
          {t('leaderboard.filterRow.timeframe')}
        </Text>
        <Flex>
          <Timeframe value={timeframe} setValue={setTimeframe} />
        </Flex>
      </Flex>
    </VStack>
  );
}

function Timeframe({
  value,
  setValue,
}: {
  value: TIMEFRAME;
  setValue: (value: TIMEFRAME) => void;
}) {
  const { t } = useTranslation('common');
  const debouncedSetTimeframe = useCallback(debounce(setValue, 500), []);

  return (
    <Select
      color="brand.slate.400"
      fontSize={{ base: 'xs', sm: 'sm' }}
      onChange={(e) => debouncedSetTimeframe(e.target.value as TIMEFRAME)}
      value={value}
      variant="unstyled"
    >
      <option value="ALL_TIME">{t('leaderboard.filterRow.allTime')}</option>
      <option value="THIS_YEAR">{t('leaderboard.filterRow.thisYear')}</option>
      <option value="LAST_30_DAYS">
        {t('leaderboard.filterRow.last30Days')}
      </option>
      <option value="LAST_7_DAYS">
        {t('leaderboard.filterRow.last7Days')}
      </option>
    </Select>
  );
}
