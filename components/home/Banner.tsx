import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

const slate = '#1E293B';

function DesktopBanner() {
  const router = useRouter();
  return (
    <Box
      w={'46.0625rem'}
      h={'14.75rem'}
      mt={'24px'}
      px={'2.625rem'}
      py={'2.125rem'}
      bgImage="url('/assets/home/display/money_banner.png')"
      bgSize={'contain'}
      rounded={'md'}
    >
      <Text
        color={slate}
        fontFamily={'Domine'}
        fontSize={'1.625rem'}
        fontWeight={'700'}
        lineHeight={'1.875rem'}
      >
        Unlock Your Earning <br />
        Potential on Solana
      </Text>
      <Text w={'60%'} mt={'0.4375rem'} color={slate}>
        Explore bounties, grants, and job opportunities for developers and
        non-technical talent alike
      </Text>
      <Flex align={'center'} mt={'1.5625rem'}>
        <Button
          px={'2.25rem'}
          py={'0.75rem'}
          color={'white'}
          fontSize={'0.875rem'}
          bg={'#6366F1'}
          onClick={() => {
            router.push('/new');
          }}
        >
          Sign Up
        </Button>
        <AvatarGroup ml={'2.875rem'} max={3} size="sm">
          <Avatar name="Ryan Florence" src="https://bit.ly/ryan-florence" />
          <Avatar name="Segun Adebayo" src="https://bit.ly/sage-adebayo" />
          <Avatar name="Kent Dodds" src="https://bit.ly/kent-c-dodds" />
        </AvatarGroup>
        <Text ml={'0.6875rem'} fontSize={'0.875rem'}>
          Join 1,239 others
        </Text>
      </Flex>
    </Box>
  );
}

function MobileBanner() {
  const router = useRouter();
  return (
    <Flex
      justify={'end'}
      direction={'column'}
      w={'21rem'}
      h={'23rem'}
      mt={'24px'}
      mx={'auto'}
      px={'2rem'}
      py={'1rem'}
      bgImage="url('/assets/home/display/mob_money_banner.png')"
      bgSize={'cover'}
      rounded={'md'}
    >
      <Text
        color={slate}
        fontFamily={'Domine'}
        fontSize={'2xl'}
        fontWeight={'700'}
      >
        Unlock Your Earning <br />
        Potential on Solana
      </Text>
      <Text w={'100%'} mt={'xs'} color={slate} fontSize={'sm'}>
        Explore bounties, grants, and job opportunities for developers and
        non-technical talent alike
      </Text>
      <Flex align={'center'} direction={'column'} mt={'1.5625rem'}>
        <Button
          w={'100%'}
          px={'2.25rem'}
          py={'0.75rem'}
          color={'white'}
          fontSize={'sm'}
          bg={'#6366F1'}
          onClick={() => {
            router.push('/new');
          }}
        >
          Sign Up
        </Button>
        <Flex align={'center'} mt={5}>
          <AvatarGroup ml={'2.875rem'} max={3} size="sm">
            <Avatar name="Ryan Florence" src="https://bit.ly/ryan-florence" />
            <Avatar name="Segun Adebayo" src="https://bit.ly/sage-adebayo" />
            <Avatar name="Kent Dodds" src="https://bit.ly/kent-c-dodds" />
          </AvatarGroup>
          <Text ml={'0.6875rem'} fontSize={'0.875rem'}>
            Join 1,239 others
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default function Banner() {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');
  return !isLessThan768px ? <DesktopBanner /> : <MobileBanner />;
}
