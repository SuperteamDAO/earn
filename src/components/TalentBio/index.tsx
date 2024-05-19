import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';

import { type User } from '@/interface/user';
import { userStore } from '@/store/user';
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
  user,
  successPage,
  w,
}: {
  user: User;
  successPage: boolean;
  w?: any;
}) {
  const { userInfo } = userStore();
  const router = useRouter();

  const handleEditProfileClick = () => {
    router.push(`/t/${user?.username}/edit`);
  };
  const socialLinks = [
    {
      icon: '/assets/talent/twitter.png',
      link: user?.twitter,
    },

    {
      icon: '/assets/talent/linkedin.png',
      link: user?.linkedin,
    },

    {
      icon: '/assets/talent/github.png',
      link: user?.github,
    },

    {
      icon: '/assets/talent/site.png',
      link: user?.website,
    },
  ];

  const createMailtoLink = () => {
    const email = encodeURIComponent(user?.email || '');
    const subject = encodeURIComponent('Saw Your ST Earn Profile!');
    const bcc = encodeURIComponent('hello@superteamearn.com');
    return `mailto:${email}?subject=${subject}&bcc=${bcc}`;
  };

  return (
    <Flex
      justify={'space-between'}
      direction={'column'}
      w={w ?? '80%'}
      h="full"
      mt={8}
      p={'1.5625rem'}
      bg={'white'}
      borderRadius={10}
    >
      <Flex align={'center'} justify="space-between">
        <Flex align={'center'} h={'fit-content'}>
          <EarnAvatar size="64px" id={user.id} avatar={user?.photo as string} />
          <Box ml={'12px'}>
            <Text
              color={'rgb(71,86,104)'}
              fontSize={'xl'}
              fontWeight={'600'}
              cursor={'pointer'}
              onClick={() => {
                const url = `${getURL()}t/${user?.username}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              {user?.firstName} {user?.lastName}
            </Text>
            <Text
              color={'gray.400'}
              fontSize={'sm'}
              fontWeight={'600'}
              cursor="pointer"
              onClick={() => {
                const url = `${getURL()}t/${user?.username}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              @
              {user?.username?.length! > 15
                ? `${user?.username?.slice(0, 15)}...`
                : user?.username}
            </Text>
          </Box>
        </Flex>
        {userInfo?.id === user?.id && (
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
        {user?.bio}
      </Text>
      <Flex justify={'space-between'} mt={4}>
        {!user?.private && (
          <Chip
            icon={'/assets/talent/eyes.png'}
            label={'Interested In'}
            value={user?.workPrefernce as string}
          />
        )}
        <Chip
          icon={'/assets/talent/cap.png'}
          label={'Works At'}
          value={user?.currentEmployer as string}
        />
      </Flex>

      {successPage ? (
        <a style={{ textDecoration: 'none' }} href={`/t/${user?.username}`}>
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
