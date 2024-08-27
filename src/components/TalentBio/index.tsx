import {
  Box,
  Button,
  type ChakraProps,
  Flex,
  Image,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { type User } from '@/interface/user';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

import { EarnAvatar } from '../shared/EarnAvatar';

type ChipType = {
  icon: string;
  label: string;
  value: string;
};

const overFlowText = (limit: number, text: string) => {
  if (text?.length >= limit) {
    return `${text.slice(0, limit - 3)}...`;
  }
  return text;
};

const Chip = ({ icon, label, value }: ChipType) => {
  return (
    <Flex>
      <Box
        alignItems={'center'}
        justifyContent={'center'}
        w={'2rem'}
        h={'2rem'}
        mr={'0.725rem'}
        p={'0.4rem'}
        bg={'#F6EBFF'}
        borderRadius="full"
      >
        <Image w={'100%'} h={'100%'} objectFit="contain" alt="" src={icon} />
      </Box>
      <Box>
        <Text color={'gray.400'} fontSize={'0.5813rem'} fontWeight={'400'}>
          {label}
        </Text>
        <Text
          maxW={'7rem'}
          fontSize={'0.775rem'}
          fontWeight={'400'}
          textOverflow={'ellipsis'}
        >
          {overFlowText(12, value)}
        </Text>
      </Box>
    </Flex>
  );
};

export function TalentBio({
  talentUser,
  successPage,
  w,
  p = '1.5625rem',
}: {
  talentUser: User;
  successPage: boolean;
  w?: ChakraProps['w'];
  p?: ChakraProps['p'];
}) {
  const { user } = useUser();
  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/t/${talentUser?.username}/edit`);
  };
  const socialLinks = [
    {
      icon: '/assets/talent/twitter.png',
      link: talentUser?.twitter,
    },

    {
      icon: '/assets/talent/linkedin.png',
      link: talentUser?.linkedin,
    },

    {
      icon: '/assets/talent/github.png',
      link: talentUser?.github,
    },

    {
      icon: '/assets/talent/site.png',
      link: talentUser?.website,
    },
  ];

  const createMailtoLink = () => {
    const email = encodeURIComponent(talentUser?.email || '');
    const subject = encodeURIComponent('Saw Your ST Earn Profile!');
    const bcc = encodeURIComponent('support@superteamearn.com');
    return `mailto:${email}?subject=${subject}&bcc=${bcc}`;
  };

  return (
    <Flex
      justify={'space-between'}
      direction={'column'}
      w={w ?? '80%'}
      h="full"
      mt={8}
      p={p}
      bg={'white'}
      borderRadius={10}
    >
      <Flex align={'center'} justify="space-between" w="full">
        <Flex align={'center'} h={'fit-content'}>
          <EarnAvatar
            size="64px"
            id={talentUser.id}
            avatar={talentUser?.photo as string}
          />
          <Box ml={'12px'}>
            <Text
              color={'rgb(71,86,104)'}
              fontSize={'xl'}
              fontWeight={'600'}
              cursor={'pointer'}
              onClick={() => {
                const url = `${getURL()}t/${talentUser?.username}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              {talentUser?.firstName} {talentUser?.lastName}
            </Text>
            <Text
              color={'gray.400'}
              fontSize={'sm'}
              fontWeight={'600'}
              cursor="pointer"
              onClick={() => {
                const url = `${getURL()}t/${talentUser?.username}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              @
              {talentUser?.username?.length! > 15
                ? `${talentUser?.username?.slice(0, 15)}...`
                : talentUser?.username}
            </Text>
          </Box>
        </Flex>
        {user?.id === talentUser?.id && (
          <Button
            color={'#6562FF'}
            onClick={handleEditProfileClick}
            size={'sm'}
            variant={'ghost'}
          >
            Edit Profile
          </Button>
        )}
      </Flex>
      <Flex justify={'space-between'} mx={'10px'} mt={'20px'}>
        {socialLinks.map((ele, eleIndex) => {
          return (
            <Box
              key={eleIndex}
              onClick={() => {
                if (ele.link) {
                  window.location.href = ele.link;
                }
              }}
            >
              <Image
                w={6}
                h={6}
                opacity={!ele.link ? '0.3' : ''}
                cursor={ele.link! && 'pointer'}
                objectFit="contain"
                alt=""
                filter={!ele.link ? 'grayscale(80%)' : ''}
                src={ele.icon}
              />
            </Box>
          );
        })}
      </Flex>
      <Text mt={4} color={'gray.400'} fontSize={'sm'} fontWeight={'400'}>
        {talentUser?.bio}
      </Text>
      <Flex justify={'space-between'} mt={4}>
        {!talentUser?.private && (
          <Chip
            icon={'/assets/talent/eyes.png'}
            label={'Interested In'}
            value={talentUser?.workPrefernce as string}
          />
        )}
        <Chip
          icon={'/assets/talent/cap.png'}
          label={'Works At'}
          value={talentUser?.currentEmployer as string}
        />
      </Flex>

      {successPage ? (
        <a
          style={{ textDecoration: 'none' }}
          href={`/t/${talentUser?.username}`}
        >
          <Button
            w={'full'}
            mt={'1.575rem'}
            py={'1.5rem'}
            color={'white'}
            bg={'#6562FF'}
          >
            View Your Profile
          </Button>
        </a>
      ) : (
        <a style={{ textDecoration: 'none' }} href={createMailtoLink()}>
          <Button w={'full'} mt={'1.575rem'} color={'white'} bg={'#6562FF'}>
            Get in Touch
          </Button>
        </a>
      )}
    </Flex>
  );
}
