import { Box, Center, Flex, Image, Text } from '@chakra-ui/react';

type CategoryAssetsType = {
  [key: string]: {
    bg: string;
    desc: string;
    color: string;
    icon: string;
  };
};

export const CategoryBanner = ({ type }: { type: string }) => {
  const categoryAssets: CategoryAssetsType = {
    Design: {
      bg: `/assets/category_assets/bg/design.png`,
      color: '#FEFBA8',
      desc: 'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
      icon: '/assets/category_assets/icon/design.png',
    },
    Content: {
      bg: `/assets/category_assets/bg/content.png`,
      color: '#FEB8A8',
      desc: 'If you can write insightful essays, make stunning videos, or create killer memes, the opportunities below are calling your name.',
      icon: '/assets/category_assets/icon/content.png',
    },
    Development: {
      desc: "If building robust applications and scalable solutions is your forte, don't miss out on the earning opportunities listed below",
      bg: `/assets/category_assets/bg/frontend.png`,
      color: '#FEA8EB',
      icon: '/assets/category_assets/icon/backend.png',
    },
    Other: {
      bg: `/assets/category_assets/bg/backend.png`,
      color: '#FEB8A8',
      desc: 'If you have a unique skill set that doesn’t fit into the other categories, you might find your next gig here.',
      icon: '/assets/category_assets/icon/other.png',
    },
  };

  return (
    <Flex
      direction={{ md: 'row', base: 'column' }}
      w={{ md: 'brand.120', base: '100%' }}
      h={{ md: '7.375rem', base: 'fit-content' }}
      mx={'auto'}
      mb={8}
      p={6}
      bg={`url('${categoryAssets[type]?.bg}')`}
      bgSize={'cover'}
      rounded={10}
    >
      <Center
        w={14}
        h={14}
        mr={3}
        bg={categoryAssets[type]?.color}
        rounded={'md'}
      >
        <Image h="18" alt="Category icon" src={categoryAssets[type]?.icon} />
      </Center>
      <Box w={{ md: '60%', base: '100%' }} mt={{ base: 4, md: '0' }}>
        <Text fontFamily={'var(--font-serif)'} fontWeight={'700'}>
          {type}
        </Text>
        <Text mb={6} color="brand.slate.500" fontSize="small">
          {categoryAssets[type]?.desc}
        </Text>
      </Box>
    </Flex>
  );
};
