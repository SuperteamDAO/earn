import { Box, Flex, Image, Text, Avatar, Button } from '@chakra-ui/react';
import { Talent } from '../../interface/talent';

type ChipType = {
  icon: string;
  label: string;
  value: string;
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
        <Text maxW={"7rem"} textOverflow={"ellipsis"} fontWeight={'400'} fontSize={'0.775rem'}>
          {overFlowText(12, value)}
        </Text>
      </Box>
    </Flex>
  );
};

let overFlowText = (limit: number, text: string) => {
  if (text.length >= limit) {
    return text.slice(0, limit - 3) + '...'
  }
  return text
}




function TalentBio({ data, successPage }: { data: any, successPage?: boolean }) {

  console.log(data);

  const socialLinks = [
    {
      icon: "/assets/talent/twitter.png",
      link: data.twitter
    },

    {
      icon: "/assets/talent/link.png",
      link: data.linkedin
    },

    {
      icon: "/assets/talent/github.png",
      link: data.github
    },

    {
      icon: "/assets/talent/site.png",
      link: data.website
    }
  ]

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
        <Avatar name="Dan Abrahmov" src={data?.avatar} size="lg" />
        <Box ml={'21'}>
          <Text fontWeight={'600'} fontSize={'1.25rem'}>
            {data?.firstname} {data?.lastname}
          </Text>
          <Text fontWeight={'600'} fontSize={'1rem'} color={'gray.400'}>
            @{data?.username}
          </Text>
        </Box>
      </Flex>
      <Text
        mt={'0.625rem'}
        fontWeight={'400'}
        fontSize={'1rem'}
        color={'gray.400'}
      >
        {data?.bio}
      </Text>
      <Flex justifyContent={'space-between'} mt={'2.1875rem'}>
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

      {
        (successPage) ? <a style={{ textDecoration: "none" }} href={`/t/${data?.username}`} >
          <Button color={'white'} bg={'#6562FF'} w={'full'} mt={'1.575rem'}>
            View Your Profile
          </Button>
        </a> :
          <a style={{ textDecoration: "none" }} href={`mailto:${data.email}`}>
            <Button color={'white'} bg={'#6562FF'} w={'full'} mt={'1.575rem'}>
              Get in Touch
            </Button>
          </a>
      }

      <Flex mt={'32px'} justifyContent={'space-between'}>

        {
          socialLinks.map((ele) => {
            return (
              <Box key={ele.link} w={'22px'} h={'22px'}
                onClick={() => {
                  if (ele.link) {
                    location.href = ele.link
                  }
                }}
              >
                <Image
                  objectFit="contain"
                  width={'100%'}
                  height={'100%'}
                  alt=""
                  src={ele.icon}
                  cursor={(ele.link) && "pointer"}
                  filter={(!ele.link) ? 'grayscale(80%)' : ''}
                  opacity={(!ele.link) ? '0.3' : ''}
                />
              </Box>
            )
          })
        }

      </Flex>
    </Box >
  );
}

export default TalentBio;
