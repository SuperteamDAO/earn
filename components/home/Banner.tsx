import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
  useDisclosure,
  useMediaQuery,
} from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';

import { userStore } from '@/store/user';
import { Mixpanel } from '@/utils/mixpanel';

import { Login } from '../modals/Login/Login';

// const slate = '#1E293B';

function DesktopBanner() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { wallets, select } = useWallet();
  const { setUserInfo, userInfo } = userStore();

  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      select(solanaWallet.adapter.name);
    } catch (e) {
      console.log('Wallet not found');
    }
  };

  return (
    <>
      {!!isOpen && (
        <Login
          wallets={wallets}
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
        />
      )}
      <Box
        w={'100%'}
        h={72}
        mb={8}
        mx={'auto'}
        p={10}
        bgImage="url('/assets/home/display/money_banner.png')"
        bgSize={'cover'}
        rounded={'md'}
      >
        <Text
          color={'brand.slate.800'}
          fontFamily={'Domine'}
          fontSize={'1.625rem'}
          fontWeight={'700'}
          lineHeight={'1.875rem'}
        >
          Start Earning Crypto
          <br /> by Contributing to Solana
        </Text>
        <Text w={'60%'} mt={'0.4375rem'} color={'brand.slate.500'}>
          Explore bounties, grants, and jobs with high growth startups in the
          Solana ecosystem.
        </Text>
        <Flex align={'center'} mt={'1.5625rem'}>
          <Button
            px={'2.25rem'}
            py={'0.75rem'}
            color={'white'}
            fontSize={'0.875rem'}
            bg={'#6366F1'}
            onClick={() => {
              Mixpanel.track('sign_up_clicked');
              onOpen();
            }}
          >
            Sign Up
          </Button>
          <AvatarGroup ml={'2.875rem'} max={3} size="sm">
            <Avatar
              name="Anoushk"
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683132586/People%20DPs/recA3Sa7t1loYvDHo.jpg"
            />
            <Avatar
              name="Ujjwal"
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135404/People%20DPs/rec4XUFtbh6upVYpA.jpg"
            />
            <Avatar
              name="Yash"
              src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135395/People%20DPs/recb4gDjdKoFDAyo7.png"
            />
          </AvatarGroup>
          <Text ml={'0.6875rem'} fontSize={'0.875rem'}>
            Join 673+ others
          </Text>
        </Flex>
      </Box>
    </>
  );
}

function MobileBanner() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { wallets, select } = useWallet();
  const { setUserInfo, userInfo } = userStore();

  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      select(solanaWallet.adapter.name);
    } catch (e) {
      console.log('Wallet not found');
    }
  };
  return (
    <>
      {!!isOpen && (
        <Login
          wallets={wallets}
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
        />
      )}
      <Flex
        justify={'end'}
        direction={'column'}
        w={'95%'}
        h={'96'}
        mx={'auto'}
        px={10}
        py={3}
        bgImage="url('/assets/home/display/mob_money_banner.png')"
        bgSize={'cover'}
        rounded={'md'}
      >
        <Text
          color={'brand.slate.500'}
          fontFamily={'Domine'}
          fontSize={'xl'}
          fontWeight={'700'}
        >
          Unlock Your Earning <br />
          Potential on Solana
        </Text>
        <Text
          w={'100%'}
          mt={'0.4375rem'}
          color={'brand.slate.800'}
          fontSize={'sm'}
        >
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
              Mixpanel.track('sign_up_clicked');
              onOpen();
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
              Join 563+ others
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}

export default function Banner() {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');
  return !isLessThan768px ? <DesktopBanner /> : <MobileBanner />;
}
