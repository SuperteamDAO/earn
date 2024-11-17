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
import { useCallback, useState } from 'react';

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
  const debouncedSetSkill = useCallback(debounce(decideSkill, 500), []);
  const [isLabelOpen, setIsLabelOpen] = useState(false);

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
              Overall Rankings
            </Tab>
            <Divider h="1.5rem" mr={1} ml={2} orientation="vertical" />
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Content
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Design
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Development
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Others
            </Tab>
            <Box>
              <Tooltip
                isOpen={isLabelOpen}
                setIsOpen={setIsLabelOpen}
                label={`The skill filters showcase users based on the skills requested in the listings they've successfully won, not the skills listed in their talent profiles.`}
              >
                <InfoOutlineIcon
                  onMouseEnter={() => setIsLabelOpen(true)}
                  onMouseLeave={() => setIsLabelOpen(false)}
                  onClick={() => setIsLabelOpen(true)}
                  ml={2}
                  w={3}
                  h={3}
                />
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
        <Text color="brand.slate.400">Timeframe</Text>
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
  const debouncedSetTimeframe = useCallback(debounce(setValue, 500), []);

  return (
    <Select
      color="brand.slate.400"
      fontSize={{ base: 'xs', sm: 'sm' }}
      onChange={(e) => debouncedSetTimeframe(e.target.value as TIMEFRAME)}
      value={value}
      variant="unstyled"
    >
      <option value="ALL_TIME">All Time</option>
      <option value="THIS_YEAR">This Year</option>
      <option value="LAST_30_DAYS">Last 30 Days</option>
      <option value="LAST_7_DAYS">Last 7 Days</option>
    </Select>
  );
}
