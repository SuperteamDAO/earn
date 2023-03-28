import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
  Image,
  VStack,
  Center,
  Link,
} from '@chakra-ui/react';
import { JobsType } from '../../interface/listings';
import { SponsorType } from '../../interface/sponsor';

interface SideBarProps {
  jobs:
    | {
        jobs: JobsType;
        sponsorInfo: SponsorType;
      }[]
    | undefined;
  total: string;
  listings: number;
}
const SideBar = ({ jobs, listings, total }: SideBarProps) => {
  return (
    <Flex
      flexDirection={'column'}
      w={'354px'}
      borderLeft={'1px solid #F1F5F9'}
      ml={'24px'}
      pt={'1.5rem'}
      pl={'20px'}
      rowGap={'40px'}
    >
      <GettingStarted />
      <TotalStats total={listings} listings={total} />
      <AlphaAccess />
      <RecentEarners />
      <HiringNow jobs={jobs} />
      <Featured />
    </Flex>
  );
};

export default SideBar;

const Step = ({
  number,
  isComplete,
}: {
  number: number;
  isComplete: boolean;
}) => {
  if (isComplete) {
    return (
      <Center
        zIndex={'200'}
        h={'38px'}
        w={'38px'}
        bg={'#6366F1'}
        rounded={'full'}
      >
        <Image
          w={'20px'}
          h={'20px'}
          src="/assets/icons/white-tick.svg"
          alt=""
        />
      </Center>
    );
  }

  return (
    <Center
      zIndex={'200'}
      bg={'#FFFFFF'}
      color={'#94A3B8'}
      h={'38px'}
      w={'38px'}
      border={'1px solid #94A3B8'}
      rounded={'full'}
    >
      {number}
    </Center>
  );
};

const GettingStarted = () => {
  return (
    <Box>
      <Text mb={'24px'} color={'#94A3B8'}>
        GETTING STARTED
      </Text>
      <Flex h={'200px'}>
        <VStack
          h={'100%'}
          position={'relative'}
          justifyContent={'space-between'}
          mr={'13px'}
        >
          <Step number={1} isComplete={true} />
          <Step number={2} isComplete={false} />
          <Step number={3} isComplete={false} />
          <Flex w={'1px'} h={'90%'} position={'absolute'} bg={'#CBD5E1'} />
        </VStack>
        <VStack
          h={'100%'}
          position={'relative'}
          justifyContent={'space-between'}
        >
          <Box>
            <Text color={'black'} fontSize={'14px'}>
              Create your account
            </Text>
            <Text fontSize={'13px'} color={'#64748B'}>
              and get personalized notifications
            </Text>
          </Box>
          <Box>
            <Text color={'black'} fontSize={'14px'}>
              Complete your profile
            </Text>
            <Text fontSize={'13px'} color={'#64748B'}>
              and get seen by hiring managers
            </Text>
          </Box>
          <Box>
            <Text color={'black'} fontSize={'14px'}>
              Win a bounty
            </Text>
            <Text fontSize={'13px'} color={'#64748B'}>
              and get your Proof-of-Work NFT
            </Text>
          </Box>
        </VStack>
      </Flex>
    </Box>
  );
};

const TotalStats = ({
  total,
  listings,
}: {
  total: number;
  listings: string;
}) => {
  return (
    <Flex
      px={'8px'}
      h={'69'}
      bg={'#F8FAFC'}
      rounded={'md'}
      alignItems={'center'}
      justifyContent={'space-between'}
    >
      <Flex>
        <Image
          h={'25px'}
          alt=""
          src="assets/icons/lite-purple-dollar.svg"
          mr={'8px'}
          mb={'auto'}
        />
        <Box>
          <Text fontWeight={'600'} color={'black'} fontSize={'14px'}>
            $1,340,403 USD
          </Text>
          <Text fontWeight={'400'} color={'#64748B'} fontSize={'12px'}>
            Community Earnings
          </Text>
        </Box>
      </Flex>
      <Box w={'1px'} h={'50%'} bg={'#CBD5E1'}></Box>
      <Flex>
        <Image
          h={'25x'}
          alt=""
          src="assets/icons/lite-purple-suitcase.svg"
          mr={'8px'}
          mb={'auto'}
        />
        <Box>
          <Text fontWeight={'600'} color={'black'} fontSize={'14px'}>
            {total}
          </Text>
          <Text fontWeight={'400'} color={'#64748B'} fontSize={'12px'}>
            Listed Opportunities
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};

const Earner = () => {
  return (
    <Flex align={'center'} w={'100%'}>
      <Image
        mr={'17px'}
        w={'34px'}
        h={'34px'}
        rounded={'full'}
        src="https://bit.ly/kent-c-dodds"
        alt=""
      />
      <Box>
        <Text fontWeight={'500'} color={'black'} fontSize={'13px'}>
          Madhur Dixit
        </Text>
        <Text color={'#64748B'} fontSize={'13px'}>
          won Underdog Smart...
        </Text>
      </Box>
      <Flex columnGap={'5px'} ml={'auto'}>
        <Image src="/assets/landingsponsor/icons/usdc.svg" alt="" />
        <Text>$3,000</Text>
      </Flex>
    </Flex>
  );
};

const RecentEarners = () => {
  return (
    <Box>
      <Text mb={'24px'} color={'#94A3B8'}>
        RECENT EARNERS
      </Text>
      <VStack rowGap={'29px'}>
        <Earner />
        <Earner />
        <Earner />
        <Earner />
        <Earner />
      </VStack>
    </Box>
  );
};

interface HiringProps {
  title: string;
  logo: string;
  location: string;
  type: string;
}
const Hiring = ({ logo, title, location, type }: HiringProps) => {
  return (
    <Flex align={'center'} w={'100%'}>
      <Image
        mr={'17px'}
        w={'34px'}
        h={'34px'}
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph2.png'}
        alt=""
      />
      <Box>
        <Link
          href={
            `https://earn-frontend-v2.vercel.app/listings/jobs/` +
            title.split(' ').join('-')
          }
          isExternal
        >
          <Text fontWeight={'500'} color={'black'} fontSize={'13px'}>
            {title}
          </Text>
        </Link>
        <Text color={'#64748B'} fontSize={'13px'}>
          {location}, {type}
        </Text>
      </Box>
    </Flex>
  );
};

interface HiringNowProps {
  jobs:
    | {
        jobs: JobsType;
        sponsorInfo: SponsorType;
      }[]
    | undefined;
}
const HiringNow = ({ jobs }: HiringNowProps) => {
  return (
    <Box>
      <Text mb={'24px'} color={'#94A3B8'}>
        HIRING NOW
      </Text>
      <VStack rowGap={'29px'}>
        {jobs?.map((job) => {
          return (
            <Hiring
              type={job.jobs.jobType}
              location={job.jobs.location}
              key={job.jobs.id}
              logo={job.sponsorInfo.logo}
              title={job.jobs.title}
            />
          );
        })}
      </VStack>
    </Box>
  );
};

const Featuring = () => {
  return (
    <Flex align={'center'} w={'100%'}>
      <Image
        mr={'17px'}
        w={'34px'}
        h={'34px'}
        rounded={'full'}
        src="https://bit.ly/kent-c-dodds"
        alt=""
      />
      <Box>
        <Text fontWeight={'500'} color={'black'} fontSize={'13px'}>
          Madhur Dixit
        </Text>
        <Text color={'#64748B'} fontSize={'13px'}>
          won Underdog Smart...
        </Text>
      </Box>
      <Flex columnGap={'5px'} ml={'auto'}>
        <Text fontSize={'14px'} color={'#3B82F6'}>
          View
        </Text>
      </Flex>
    </Flex>
  );
};

const Featured = () => {
  return (
    <Box>
      <Text mb={'24px'} color={'#94A3B8'}>
        FEATURED
      </Text>
      <VStack rowGap={'29px'}>
        <Featuring />
        <Featuring />
        <Featuring />
        <Featuring />
        <Featuring />
      </VStack>
    </Box>
  );
};

const AlphaAccess = () => {
  return (
    <Flex
      direction={'column'}
      py={'14px'}
      px={'25px'}
      rounded={'lg'}
      w={'354px'}
      h={'228px'}
      bg={"url('/assets/home/display/grizzly.png')"}
    >
      <Text color={'white'} fontWeight={'600'} fontSize={'20px'} mt={'auto'}>
        Want Early Access to Projects?
      </Text>
      <Text lineHeight={'19px'} fontSize={'16px'} color={'white'} mt={'8px'}>
        Get exclusive early access to the latest Solana projects and win product
        feedback bounties, for free.
      </Text>
      <Button fontWeight={'500'} py={'13px'} bg={'#FFFFFF'} mt={'25px'}>
        Join the Alpha Squad
      </Button>
    </Flex>
  );
};
