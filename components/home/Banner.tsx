import { Avatar, AvatarGroup, Box, Button, Flex, Text, useMediaQuery } from '@chakra-ui/react';
import { useRouter } from 'next/router';
let slate = '#1E293B';

function Desktop_Banner() {
  const router = useRouter();
  return (
    <Box
      px={'2.625rem'}
      py={'2.125rem'}
      w={'46.0625rem'}
      h={'14.75rem'}
      rounded={'md'}
      mt={'24px'}
      bgImage="url('/assets/home/display/money_banner.png')"
      bgSize={'contain'}
    >
      <Text
        lineHeight={'1.875rem'}
        color={slate}
        fontFamily={'Domine'}
        fontWeight={'700'}
        fontSize={'1.625rem'}
      >
        Unlock Your Earning <br />
        Potential on Solana
      </Text>
      <Text w={'60%'} mt={'0.4375rem'} color={slate}>
        Explore bounties, grants, and job opportunities for developers and
        non-technical talent alike
      </Text>
      <Flex mt={'1.5625rem'} alignItems={'center'} >
        <Button
          onClick={() => {
            router.push('/new');
          }}
          bg={'#6366F1'}
          color={'white'}
          fontSize={'0.875rem'}
          px={'2.25rem'}
          py={'0.75rem'}
        >
          Sign Up
        </Button>
        <AvatarGroup size="sm" ml={'2.875rem'} max={3}>
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

function Mobile_Banner() {
  const router = useRouter();
  return (
    <Flex
      flexDirection={"column"}
      justifyContent={"end"}
      px={'2rem'}
      py={'1.5rem'}
      w={'24.125rem'}
      h={"23.25rem"}
      rounded={'md'}
      mt={'24px'}
      bgSize={'contain'}
      bgImage="url('/assets/home/display/mob_money_banner.png')"

    >
      <Text
        lineHeight={'1.875rem'}
        color={slate}
        fontFamily={'Domine'}
        fontWeight={'700'}
        fontSize={'1.5rem'}

      >
        Unlock Your Earning <br />
        Potential on Solana
      </Text>
      <Text fontSize={".875rem"} w={'100%'} mt={'0.4375rem'} color={slate}>
        Explore bounties, grants, and job opportunities for developers and
        non-technical talent alike
      </Text>
      <Flex mt={'1.5625rem'} alignItems={'center'} flexDir={"column"} >
        <Button
          w={"100%"}
          onClick={() => {
            router.push('/new');
          }}
          bg={'#6366F1'}
          color={'white'}
          fontSize={'0.875rem'}
          px={'2.25rem'}
          py={'0.75rem'}
        >
          Sign Up
        </Button>
        <Flex alignItems={"center"} mt={"1rem"}>
          <AvatarGroup size="sm" ml={'2.875rem'} max={3}>
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
  return (
    (!isLessThan768px) ? <Desktop_Banner /> : <Mobile_Banner />
  )
}