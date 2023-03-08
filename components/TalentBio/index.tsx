import { Box, Flex, Image, Text, Avatar, Button } from "@chakra-ui/react";


type ChipType = {
  icon: string,
  label: string,
  value: string,
};

let Chip = ({ icon, label, value }: ChipType) => {
  return (
    <Flex>
      <Box
        w={'2rem'}
        h={'2rem'}
        bg={'#F6EBFF'}
        borderRadius="full"
        mr={'0.725rem'}
        justifyContent={'center'}
        alignItems={'center'}
        p={'0.4rem'}
      >
        <Image
          objectFit="contain"
          width={'100%'}
          height={'100%'}
          alt=""
          src={icon}
        />
      </Box>
      <Box>
        <Text fontWeight={'400'} fontSize={'0.5813rem'} color={'gray.400'}>
          {label}
        </Text>
        <Text fontWeight={'400'} fontSize={'0.775rem'}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

function TalentBio({ data }: { data: any }) {

  let socials = JSON.parse(data.socials);

  console.log(socials)

  return (
    <Box
      px={'1.5625rem'}
      py={'1.125rem'}
      borderRadius={'0.6875rem'}
      bg={'white'}
      w={'20.4375rem'}
      minH={'21.375rem'}
    >
      <Flex align={'center'}>
        <Avatar
          name="Dan Abrahmov"
          src={data.avatar}
          size="lg"
        />
        <Box ml={'21'}>
          <Text fontWeight={'600'} fontSize={'1.25rem'}>
            {data.firstname} {data.lastname}
          </Text>
          <Text fontWeight={'600'} fontSize={'1rem'} color={'gray.400'}>
            @{data.username}
          </Text>
        </Box>
      </Flex>
      <Text
        mt={'0.625rem'}
        fontWeight={'400'}
        fontSize={'1rem'}
        color={'gray.400'}
      >
        {data.bio}
      </Text>
      <Flex justifyContent={'space-between'} mt={'2.1875rem'}>
        <Chip
          icon={'/assets/talent/eyes.png'}
          label={'Interested In'}
          value={data.workPrefernce}
        />
        <Chip
          icon={'/assets/talent/cap.png'}
          label={'Works At'}
          value={data.currentEmployer}
        />
      </Flex>
      <Button color={'white'} bg={'#6562FF'} w={'full'} mt={'1.575rem'}>
        Get in touch
      </Button>
      <Flex mt={'32px'} justifyContent={'space-between'}>
        <Box w={'22px'} h={'22px'}>
          <a href={socials['Twitter']}>
            <Image
              objectFit="contain"
              width={'100%'}
              height={'100%'}
              alt=""
              src={'/assets/talent/twitter.png'}
            />
          </a>
        </Box>
        <Box w={'22px'} h={'22px'}>
          <a href={socials['LinkedIn']}>
            <Image
              objectFit="contain"
              width={'100%'}
              height={'100%'}
              alt=""
              src={'/assets/talent/linkedIn.png'}
            />
          </a>
        </Box>
        <Box w={'22px'} h={'22px'}>
          <a href={socials['GitHub']}>
            <Image
              objectFit="contain"
              width={'100%'}
              height={'100%'}
              alt=""
              src={'/assets/talent/github.png'}
            />
          </a>
        </Box>
        <Box w={'22px'} h={'22px'}>
          <a href={socials['Site']}>
            <Image
              objectFit="contain"
              width={'100%'}
              height={'100%'}
              alt=""
              src={'/assets/talent/site.png'}
            />
          </a>
        </Box>
      </Flex>
    </Box>
  );
}

export default TalentBio