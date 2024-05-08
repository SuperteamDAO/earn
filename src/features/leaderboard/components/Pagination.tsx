import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Button, Flex } from '@chakra-ui/react';

interface Props {
  page: number;
  setPage: (value: number) => void;
  count: number;
}

const SIZE = 6;
const ROUNDED = 4;
export function Pagination({ page, setPage, count }: Props) {
  console.log('page', page, 'count', count);
  const totalPages = Math.ceil(count / 10);
  return (
    <Flex wrap="wrap" gap={2} mt={4}>
      <Button
        w={SIZE}
        minW={0}
        h={SIZE}
        p={0}
        isDisabled={page === 1}
        onClick={() => setPage(page - 1)}
        rounded={ROUNDED}
        variant="outline"
      >
        <ChevronLeftIcon w={5} h={5} />
      </Button>
      {page - 2 > 0 && (
        <Button
          w={SIZE}
          minW={0}
          h={SIZE}
          p={0}
          color={'brand.slate.500'}
          fontSize={'xs'}
          borderColor={'brand.slate.500'}
          onClick={() => setPage(page - 2)}
          rounded={ROUNDED}
          variant="outline"
        >
          {page - 2}
        </Button>
      )}
      {page - 1 > 0 && (
        <Button
          w={SIZE}
          minW={0}
          h={SIZE}
          p={0}
          color={'brand.slate.500'}
          fontSize={'xs'}
          borderColor={'brand.slate.500'}
          onClick={() => setPage(page - 1)}
          rounded={ROUNDED}
          variant="outline"
        >
          {page - 1}
        </Button>
      )}
      <Button
        w={SIZE}
        minW={0}
        h={SIZE}
        p={0}
        color={'brand.purple'}
        fontSize={'xs'}
        borderColor={'brand.purple'}
        rounded={ROUNDED}
        variant="outline"
      >
        {page}
      </Button>
      {totalPages > 4 && page !== 1 && page !== totalPages && (
        <Button
          w={SIZE}
          minW={0}
          h={SIZE}
          p={0}
          color={'brand.slate.500'}
          fontSize={'xs'}
          borderColor={'brand.slate.500'}
          disabled
          isDisabled
          rounded={ROUNDED}
          variant="outline"
        >
          ...
        </Button>
      )}
      {page + 1 <= totalPages && (
        <Button
          w={SIZE}
          minW={0}
          h={SIZE}
          p={0}
          color={'brand.slate.500'}
          fontSize={'xs'}
          borderColor={'brand.slate.500'}
          onClick={() => setPage(page + 1)}
          rounded={ROUNDED}
          variant="outline"
        >
          {page + 1}
        </Button>
      )}
      {page + 2 <= totalPages && (
        <Button
          w={SIZE}
          minW={0}
          h={SIZE}
          p={0}
          color={'brand.slate.500'}
          fontSize={'xs'}
          borderColor={'brand.slate.500'}
          onClick={() => setPage(page + 2)}
          rounded={ROUNDED}
          variant="outline"
        >
          {page + 2}
        </Button>
      )}
      {/* {Array(totalPages) */}
      {/*   .fill(0) */}
      {/*   .map((_, i) => { */}
      {/*     return ( */}
      {/*       <Button */}
      {/*         key={i} */}
      {/*         w={SIZE} */}
      {/*         minW={0} */}
      {/*         h={SIZE} */}
      {/*         p={0} */}
      {/*         color={page !== i + 1 ? 'brand.slate.500' : 'brand.purple'} */}
      {/*         fontSize={'xs'} */}
      {/*         borderColor={page !== i + 1 ? 'brand.slate.100' : 'brand.purple'} */}
      {/*         onClick={() => setPage(i + 1)} */}
      {/*         rounded={ROUNDED} */}
      {/*         variant="outline" */}
      {/*       > */}
      {/*         {i + 1} */}
      {/*       </Button> */}
      {/*     ); */}
      {/*   })} */}
      <Button
        w={SIZE}
        minW={0}
        h={SIZE}
        p={0}
        isDisabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        rounded={ROUNDED}
        variant="outline"
      >
        <ChevronRightIcon w={5} h={5} />
      </Button>
    </Flex>
  );
}
