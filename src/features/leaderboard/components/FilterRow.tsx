import {
  Divider,
  Flex,
  Select,
  Tab,
  TabList,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';

import { Timeframe } from '../types';

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
  timeframe: Timeframe;
  setTimeframe: (value: Timeframe) => void;
}

export function FilterRow({ timeframe, setTimeframe }: Props) {
  return (
    <VStack w="full">
      <Flex
        justify="space-between"
        overflowX="auto"
        overflowY="hidden"
        w="full"
        borderBottom="2px solid"
        borderBottomColor={'brand.slate.200'}
      >
        <Tabs color="brand.slate.400">
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
            <Divider h="1.5rem" orientation="vertical" />
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
  value: Timeframe;
  setValue: (value: Timeframe) => void;
}) {
  return (
    <Select
      color="brand.slate.400"
      fontSize={{ base: 'xs', sm: 'sm' }}
      onChange={(e) => setValue(e.target.value as Timeframe)}
      value={value}
      variant="unstyled"
    >
      <option value="this_year">This Year</option>
      <option value="last_quarter">Last Quarter</option>
      <option value="last_month">Last Month</option>
    </Select>
  );
}
