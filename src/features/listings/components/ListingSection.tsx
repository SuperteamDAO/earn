import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, HStack, Image, Link, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';

type ListingSectionProps = {
  children?: React.ReactNode;
  title: string;
  sub: string;
  emoji: string;
  type: 'bounties' | 'grants';
  showViewAll?: boolean;
  viewAllLink?: string;
};

export const ListingSection = ({
  children,
  title,
  sub,
  emoji,
  type,
  showViewAll,
  viewAllLink,
}: ListingSectionProps) => {
  const router = useRouter();

  return (
    <Box
      display={
        router.query.category
          ? router.query.category === (type as string) ||
            router.query.category === 'all'
            ? 'block'
            : 'none'
          : 'block'
      }
      w={{ md: '100%', base: '98%' }}
      mx={'auto'}
      my={10}
    >
      <HStack
        align="center"
        justify="space-between"
        mb={4}
        pb={3}
        borderBottom="2px solid"
        borderBottomColor="#E2E8F0"
      >
        <Flex align={'center'}>
          <Image
            w={'1.4375rem'}
            h={'1.4375rem'}
            mr={'0.75rem'}
            alt="emoji"
            src={emoji}
          />
          <Text
            color={'#334155'}
            fontSize={{ base: 14, md: 16 }}
            fontWeight={'600'}
          >
            {title}
          </Text>
          <Text
            display={['none', 'none', 'block', 'block']}
            mx={3}
            color={'brand.slate.300'}
            fontSize="xx-small"
          >
            |
          </Text>
          <Text
            display={['none', 'none', 'block', 'block']}
            color={'brand.slate.400'}
            fontSize={{ base: 12, md: 14 }}
          >
            {sub}
          </Text>
        </Flex>
        <Flex
          display={
            showViewAll && router?.query?.category !== type ? 'block' : 'none'
          }
        >
          <Link
            href={
              viewAllLink ||
              (router?.query?.filter
                ? `/${type}/${router?.query?.filter}/`
                : `/${type}/`)
            }
          >
            <Button color="brand.slate.400" size="sm" variant="ghost">
              View All
            </Button>
          </Link>
        </Flex>
      </HStack>
      <Flex direction={'column'} rowGap={'1'}>
        {children}
      </Flex>
      <Flex
        display={
          showViewAll && router?.query?.category !== type ? 'block' : 'none'
        }
      >
        <Link
          href={
            viewAllLink ||
            (router?.query?.filter
              ? `/${type}/${router?.query?.filter}/`
              : `/${type}/`)
          }
        >
          <Button
            w="100%"
            my={8}
            py={5}
            color="brand.slate.400"
            borderColor="brand.slate.300"
            rightIcon={<ArrowForwardIcon />}
            size="sm"
            variant="outline"
          >
            View All
          </Button>
        </Link>
      </Flex>
    </Box>
  );
};
