import {
  Button,
  Flex,
  Image,
  Link,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import type { Grant } from '../types';

export const GrantsCard = ({ grant }: { grant: Grant }) => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const { sponsor, slug, rewardAmount, title, shortDescription } = grant;

  return (
    <>
      <Link
        as={NextLink}
        px={isMobile ? 1 : 4}
        py={4}
        borderRadius={5}
        _hover={{
          textDecoration: 'none',
          bg: 'gray.100',
        }}
        href={`/grants/${slug}`}
      >
        <Flex
          align="center"
          justify="space-between"
          w={{ base: '100%', md: 'brand.120' }}
        >
          <Flex justify="start" h={isMobile ? 14 : 16}>
            <Image
              w={isMobile ? 14 : 16}
              h={isMobile ? 14 : 16}
              mr={isMobile ? 3 : 5}
              alt={'company logo'}
              rounded={5}
              src={
                sponsor?.logo
                  ? sponsor.logo.replace(
                      '/upload/',
                      '/upload/c_scale,w_128,h_128,f_auto/',
                    )
                  : `assets/home/placeholder/ph1.png`
              }
            />
            <Flex justify={'space-between'} direction={'column'} w={'full'}>
              <Text
                color="brand.slate.700"
                fontSize={['xs', 'xs', 'md', 'md']}
                fontWeight="600"
                _hover={{
                  textDecoration: 'underline',
                }}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </Text>
              <Text
                color="brand.slate.500"
                fontSize={['xs', 'xs', 'sm', 'sm']}
                fontWeight="400"
              >
                {sponsor?.name}
              </Text>

              {rewardAmount && (
                <Text
                  mr={3}
                  color={'brand.slate.500'}
                  fontSize={['10px', '10px', 'sm', 'sm']}
                  style={
                    isMobile
                      ? {
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }
                      : undefined
                  }
                >
                  {shortDescription}
                </Text>
              )}
            </Flex>
          </Flex>

          <Button
            minW={{ base: 16, md: 24 }}
            h={isMobile ? 7 : 9}
            px={6}
            fontSize={['xs', 'xs', 'sm', 'sm']}
            variant="outlineSecondary"
          >
            Apply
          </Button>
        </Flex>
      </Link>
    </>
  );
};
