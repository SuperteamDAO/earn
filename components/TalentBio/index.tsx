import { Avatar, Box, Button, Flex, Image, Text } from '@chakra-ui/react';

type ChipType = {
  icon: string;
  label: string;
  value: string;
};

const overFlowText = (limit: number, text: string) => {
  if (text.length >= limit) {
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

function TalentBio({
  data,
  successPage,
}: {
  data: any;
  successPage?: boolean;
}) {
  console.log(data);

  const socialLinks = [
    {
      icon: '/assets/talent/twitter.png',
      link: data.twitter,
    },

    {
      icon: '/assets/talent/link.png',
      link: data.linkedin,
    },

    {
      icon: '/assets/talent/github.png',
      link: data.github,
    },

    {
      icon: '/assets/talent/site.png',
      link: data.website,
    },
  ];

  return (
    <Box
      w={'80%'}
      px={'1.5625rem'}
      py={'1.125rem'}
      bg={'white'}
      borderRadius={10}
    >
      <Flex align={'center'}>
        <Avatar
          name={`${data?.firstname}${data?.lastname}`}
          size="lg"
          src={data?.avatar}
        />
        <Box ml={'21'}>
          <Text fontSize={'md'} fontWeight={'600'}>
            {data?.firstname} {data?.lastname}
          </Text>
          <Text color={'gray.400'} fontSize={'sm'} fontWeight={'600'}>
            @
            {data?.username.length > 15
              ? `${data?.username.slice(0, 15)}...`
              : data?.username}
          </Text>
        </Box>
      </Flex>
      <Text mt={4} color={'gray.400'} fontSize={'sm'} fontWeight={'400'}>
        {data?.bio}
      </Text>
      <Flex justify={'space-between'} mt={4}>
        <Chip
          icon={'/assets/talent/eyes.png'}
          label={'Interested In'}
          value={data?.workPrefernce}
        />
        <Chip
          icon={'/assets/talent/cap.png'}
          label={'Works At'}
          value={data?.currentEmployer}
        />
      </Flex>

      {successPage ? (
        <a style={{ textDecoration: 'none' }} href={`/t/${data?.username}`}>
          <Button w={'full'} mt={'1.575rem'} color={'white'} bg={'#6562FF'}>
            View Your Profile
          </Button>
        </a>
      ) : (
        <a style={{ textDecoration: 'none' }} href={`mailto:${data.email}`}>
          <Button w={'full'} mt={'1.575rem'} color={'white'} bg={'#6562FF'}>
            Get in Touch
          </Button>
        </a>
      )}

      <Flex justify={'space-between'} mt={'32px'}>
        {socialLinks.map((ele) => {
          return (
            <Box
              key={ele.link}
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
                cursor={ele.link && 'pointer'}
                objectFit="contain"
                alt=""
                filter={!ele.link ? 'grayscale(80%)' : ''}
                src={ele.icon}
              />
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

export default TalentBio;
