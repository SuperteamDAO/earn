import { Box, Center, Flex, Image, Link, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import Slider from 'react-slick';

import type { JobsType } from '../../interface/listings';
import type { SponsorType } from '../../interface/sponsor';
import { TalentTVE } from '../../utils/functions';

<Avatar
  size={40}
  name="Maria Mitchell"
  variant="marble"
  colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
/>;

interface SideBarProps {
  jobs:
    | {
        jobs: JobsType;
        sponsorInfo: SponsorType;
      }[]
    | undefined;
  total: number;
  listings: number;
}

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
        w={'2.375rem'}
        h={'2.375rem'}
        bg={'#6366F1'}
        rounded={'full'}
      >
        <Image
          w={'1.25rem'}
          h={'1.25rem'}
          alt=""
          src="/assets/icons/white-tick.svg"
        />
      </Center>
    );
  }

  return (
    <Center
      zIndex={'200'}
      w={'2.375rem'}
      h={'2.375rem'}
      color={'#94A3B8'}
      bg={'#FFFFFF'}
      border={'0.0625rem solid #94A3B8'}
      rounded={'full'}
    >
      {number}
    </Center>
  );
};

const GettingStarted = () => {
  return (
    <Box>
      <Text mb={'1.5rem'} color={'#94A3B8'}>
        GETTING STARTED
      </Text>
      <Flex h={'12.5rem'}>
        <VStack
          pos={'relative'}
          justifyContent={'space-between'}
          h={'100%'}
          mr={'0.8125rem'}
        >
          <Step number={1} isComplete={true} />
          <Step number={2} isComplete={false} />
          <Step number={3} isComplete={false} />
          <Flex pos={'absolute'} w={'0.0625rem'} h={'90%'} bg={'#CBD5E1'} />
        </VStack>
        <VStack pos={'relative'} justifyContent={'space-between'} h={'100%'}>
          <Box>
            <Text color={'black'} fontSize={'0.875rem'}>
              Create your account
            </Text>
            <Text color={'#64748B'} fontSize={'0.8125rem'}>
              and get personalized notifications
            </Text>
          </Box>
          <Box>
            <Text color={'black'} fontSize={'0.875rem'}>
              Complete your profile
            </Text>
            <Text color={'#64748B'} fontSize={'0.8125rem'}>
              and get seen by hiring managers
            </Text>
          </Box>
          <Box>
            <Text color={'black'} fontSize={'0.875rem'}>
              Win a bounty
            </Text>
            <Text color={'#64748B'} fontSize={'0.8125rem'}>
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
  listings: number;
}) => {
  return (
    <Flex
      align={'center'}
      justify={'space-between'}
      h={'69'}
      px={'0.5rem'}
      bg={'#F8FAFC'}
      rounded={'md'}
    >
      <Flex>
        <Image
          h={'1.5625rem'}
          mr={'0.5rem'}
          mb={'auto'}
          alt=""
          src="assets/icons/lite-purple-dollar.svg"
        />
        <Box>
          <Text color={'black'} fontSize={'0.875rem'} fontWeight={'600'}>
            ${listings.toLocaleString()} USD
          </Text>
          <Text color={'#64748B'} fontSize={'0.75rem'} fontWeight={'400'}>
            Total Value Listed
          </Text>
        </Box>
      </Flex>
      <Box w={'0.0625rem'} h={'50%'} bg={'#CBD5E1'}></Box>
      <Flex>
        <Image
          h={'25x'}
          mr={'0.5rem'}
          mb={'auto'}
          alt=""
          src="assets/icons/lite-purple-suitcase.svg"
        />
        <Box>
          <Text color={'black'} fontSize={'0.875rem'} fontWeight={'600'}>
            {total}
          </Text>
          <Text color={'#64748B'} fontSize={'0.75rem'} fontWeight={'400'}>
            Listed Opportunities
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};

interface EarnerProps {
  name: string;
  avatar?: string;
  amount: number;
  work?: string;
}
const Earner = ({ amount, name, avatar, work }: EarnerProps) => {
  return (
    <Flex align={'center'} w={'100%'} my={1}>
      {avatar !== '' ? (
        <Image
          w={'2.125rem'}
          h={'2.125rem'}
          mr={'1.0625rem'}
          alt=""
          rounded={'full'}
          src={avatar}
        />
      ) : (
        <Center mr={'1.0625rem'}>
          <Avatar
            size={40}
            name={name}
            variant="marble"
            colors={['#da4c65', '#5e25c2', '#d433ab', '#2e53af', '#ceea94']}
          />
        </Center>
      )}

      <Box>
        <Text color={'black'} fontSize={'0.8125rem'} fontWeight={'500'}>
          {name}
        </Text>
        <Text color={'#64748B'} fontSize={'0.8125rem'}>
          {work?.slice(0, 20)}
        </Text>
      </Box>
      <Flex columnGap={'0.3125rem'} ml={'auto'}>
        <Image alt="" src="/assets/landingsponsor/icons/usdc.svg" />
        <Text>${amount.toLocaleString()}</Text>
      </Flex>
    </Flex>
  );
};

const RecentEarners = () => {
  const talent = useQuery({
    queryKey: ['talent'],
    queryFn: () => TalentTVE(),
  });

  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 1,
    vertical: true,
    verticalSwiping: true,
    autoplay: true,
    autoplaySpeed: 200,
  };
  return (
    <Box>
      <Text mb={'1.5rem'} color={'#94A3B8'}>
        TOP EARNERS
      </Text>
      <VStack rowGap={'1.8125rem'}>
        <Slider {...settings}>
          {talent.data?.map((t) => {
            return (
              <Earner
                amount={t.tve ?? 0}
                name={`${t.firstname} ${t.lastname}`}
                avatar={t.avatar}
                key={t.id}
                work={t.currentEmployer}
              />
            );
          })}
        </Slider>
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
        w={'2.125rem'}
        h={'2.125rem'}
        mr={'1.0625rem'}
        alt=""
        rounded={'md'}
        src={logo ?? '/assets/home/placeholder/ph2.png'}
      />
      <Box>
        <Link
          href={`https://earn-frontend-v2.vercel.app/listings/jobs/${title
            .split(' ')
            .join('-')}`}
          isExternal
        >
          <Text color={'black'} fontSize={'0.8125rem'} fontWeight={'500'}>
            {title}
          </Text>
        </Link>
        <Text color={'#64748B'} fontSize={'0.8125rem'}>
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
      <Text mb={'1.5rem'} color={'#94A3B8'}>
        HIRING NOW
      </Text>
      <VStack rowGap={'1.8125rem'}>
        {jobs?.map((job) => {
          return (
            <Hiring
              type={job?.jobs?.jobType}
              location={job?.jobs?.location}
              key={job?.jobs?.id}
              logo={job?.sponsorInfo?.logo}
              title={job?.jobs?.title}
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
        w={'2.125rem'}
        h={'2.125rem'}
        mr={'1.0625rem'}
        alt=""
        rounded={'full'}
        src="https://bit.ly/kent-c-dodds"
      />
      <Box>
        <Text color={'black'} fontSize={'0.8125rem'} fontWeight={'500'}>
          Madhur Dixit
        </Text>
        <Text color={'#64748B'} fontSize={'0.8125rem'}>
          won Underdog Smart...
        </Text>
      </Box>
      <Flex columnGap={'0.3125rem'} ml={'auto'}>
        <Text color={'#3B82F6'} fontSize={'0.875rem'}>
          View
        </Text>
      </Flex>
    </Flex>
  );
};

const Featured = () => {
  return (
    <Box>
      <Text mb={'1.5rem'} color={'#94A3B8'}>
        FEATURED
      </Text>
      <VStack rowGap={'1.8125rem'}>
        <Featuring />
        <Featuring />
        <Featuring />
        <Featuring />
        <Featuring />
      </VStack>
    </Box>
  );
};

const SideBar = ({ jobs, listings, total }: SideBarProps) => {
  return (
    <Flex
      direction={'column'}
      rowGap={'2.5rem'}
      w={'22.125rem'}
      ml={'1.5rem'}
      pt={'1.5rem'}
      pl={'1.25rem'}
      borderLeft={'0.0625rem solid #F1F5F9'}
    >
      <GettingStarted />
      <TotalStats total={listings} listings={total} />
      {/* <AlphaAccess /> */}
      {/* <Filter title={'FILTER BY INDUSTRY'} entries={['Gaming', 'Payments', 'Consumer', 'Infrastructure', 'DAOs']} /> */}
      <RecentEarners />
      <HiringNow jobs={jobs} />
      <Featured />
    </Flex>
  );
};

export default SideBar;

// const AlphaAccess = () => {
//   return (
//     <Flex
//       direction={'column'}
//       w={'22.125rem'}
//       h={'14.25rem'}
//       px={'1.5625rem'}
//       py={'0.875rem'}
//       bg={"url('/assets/home/display/grizzly.png')"}
//       rounded={'lg'}
//     >
//       <Text mt={'auto'} color={'white'} fontSize={'1.25rem'} fontWeight={'600'}>
//         Want Early Access to Projects?
//       </Text>
//       <Text
//         mt={'0.5rem'}
//         color={'white'}
//         fontSize={'1rem'}
//         lineHeight={'1.1875rem'}
//       >
//         Get exclusive early access to the latest Solana projects and win product
//         feedback bounties, for free.
//       </Text>
//       <Button
//         mt={'1.5625rem'}
//         py={'0.8125rem'}
//         fontWeight={'500'}
//         bg={'#FFFFFF'}
//       >
//         Join the Alpha Squad
//       </Button>
//     </Flex>
//   );
// };

// const FilterEntry = ({ label }: { label: string }) => {
//   return (
//     <Flex justify={'space-between'}>
//       <Checkbox colorScheme="blue" defaultChecked size="md">
//         <Text ml={'0.625rem'} color={'#64748B'} fontSize={'0.875rem'}>
//           {label}
//         </Text>
//       </Checkbox>
//       <Text ml={'0.625rem'} color={'#64748B'} fontSize={'0.875rem'}>
//         {1234}
//       </Text>
//     </Flex>
//   );
// };

// const Filter = ({ title, entries }: { title: string; entries: string[] }) => {
//   return (
//     <Box>
//       <Text mb={'1.5rem'} color={'#94A3B8'}>
//         {title}
//       </Text>
//       <Flex direction={'column'} rowGap={'1rem'}>
//         {entries.map((ele) => {
//           return <FilterEntry key={`fil${ele}`} label={ele} />;
//         })}
//       </Flex>
//     </Box>
//   );
// };
