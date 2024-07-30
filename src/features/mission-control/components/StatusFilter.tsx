import { Box, Flex, Tab, TabList, Tabs, VStack } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { type STATUS } from '../utils';

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
  status: STATUS;
  children?: React.ReactNode;
}

export function StatusFilter({ status, children }: Props) {
  const debouncedSetStatus = useCallback(debounce(decideStatus, 500), []);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const setStatus = useCallback(
    (value: STATUS) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('status', value);
      router.push(pathname + '?' + params.toString(), undefined, {
        scroll: false,
      });
    },
    [searchParams],
  );

  function decideStatus(value: number) {
    switch (value) {
      case 0:
        setStatus('all');
        break;
      case 1:
        setStatus('undecided');
        break;
      case 2:
        setStatus('accepted');
        break;
      case 3:
        setStatus('rejected');
        break;
    }
  }

  function statusIndexOf(value: STATUS): number {
    switch (value) {
      case 'all':
        return 0;
      case 'undecided':
        return 1;
      case 'accepted':
        return 2;
      case 'rejected':
        return 3;
      default:
        return 0;
    }
  }

  return (
    <VStack overflow={'visible'} w="full">
      <Flex
        className="hide-scrollbar"
        justifyItems="space-between"
        w="full"
        borderBottom="2px solid"
        borderBottomColor={'brand.slate.200'}
      >
        <Tabs
          color="brand.slate.400"
          defaultIndex={statusIndexOf(status)}
          onChange={(value) => debouncedSetStatus(value)}
        >
          <TabList alignItems="center" borderBottomWidth={0}>
            <Tab
              w="max-content"
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              All
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Undecided
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Accepted
            </Tab>
            <Tab
              my={0}
              px={2}
              fontSize={tabfontsize}
              _selected={selectedStyles}
            >
              Rejected
            </Tab>
          </TabList>
        </Tabs>
        <Box ml="auto" pl={2}>
          {children}
        </Box>
      </Flex>
    </VStack>
  );
}
