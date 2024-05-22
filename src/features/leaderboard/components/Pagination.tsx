import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Button, Flex } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { useCallback } from 'react';

interface Props {
  page: number;
  setPage: (value: number) => void;
  count: number;
}

const SIZE = 6;
const ROUNDED = 4;
export function Pagination({ page, setPage, count }: Props) {
  const handleClick = (newPage: number) => {
    setPage(newPage);
  };
  const debouncedHandleClick = useCallback(debounce(handleClick, 500), []);

  if (count === 0) return <></>;

  const totalPages = Math.ceil(count / 10);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pageNumbers.push(
          <Button
            className={i === page ? 'active' : ''}
            w={SIZE}
            minW={0}
            h={SIZE}
            p={0}
            color={page === i ? 'brand.purple' : 'brand.slate.500'}
            fontSize={'xs'}
            borderColor={page === i ? 'brand.purple' : 'brand.slate.100'}
            onClick={() => debouncedHandleClick(i)}
            rounded={ROUNDED}
            variant="outline"
          >
            {i}
          </Button>,
        );
      } else if (i === page - 2 || i === page + 2) {
        pageNumbers.push(
          <Button
            key={i}
            w={SIZE}
            minW={0}
            h={SIZE}
            p={0}
            fontSize={'xs'}
            _disabled={{
              color: 'brand.slate.500',
              borderColor: 'brand.slate.100',
            }}
            isDisabled
            rounded={ROUNDED}
            variant="outline"
          >
            ...
          </Button>,
        );
      }
    }

    return pageNumbers;
  };
  return (
    <Flex wrap="wrap" gap={2} mt={4}>
      <Button
        w={SIZE}
        minW={0}
        h={SIZE}
        p={0}
        _disabled={{
          bg: 'brand.slate.300',
          borderColor: 'brand.slate.300',
          color: 'brand.slate.500',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
        isDisabled={page === 1}
        onClick={() => debouncedHandleClick(page - 1)}
        rounded={ROUNDED}
        variant="outline"
      >
        <ChevronLeftIcon w={5} h={5} />
      </Button>
      {renderPageNumbers()}
      <Button
        w={SIZE}
        minW={0}
        h={SIZE}
        p={0}
        _disabled={{
          bg: 'brand.slate.300',
          borderColor: 'brand.slate.300',
          color: 'brand.slate.500',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
        isDisabled={page === totalPages}
        onClick={() => debouncedHandleClick(page + 1)}
        rounded={ROUNDED}
        variant="outline"
      >
        <ChevronRightIcon w={5} h={5} />
      </Button>
    </Flex>
  );
}
