import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Link,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useQuery as tanQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React from 'react';

// components
import DashboardHeader from '../../components/dashboardHead';
// Layouts
import DashboardLayout from '../../layouts/dashboardLayout';
import { SponsorStore } from '../../store/sponsor';
// utils
import { findSponsorDrafts } from '../../utils/functions';

type BasicType = {
  basic: string;
  type: string;
  id: string;
};

const DraftBody = (props: BasicType) => {
  const data = JSON.parse(props.basic.replaceAll(`'`, `"`));
  const router = useRouter();
  console.log(props.basic);
  return (
    <Tbody h={'70px'}>
      <Tr>
        <Td py={'0'} color={'#334254'} fontSize={'1rem'} fontWeight={'600'}>
          {data.title}
        </Td>
        <Td py={'0'}>
          <Center
            px={'0.75rem'}
            py={'0.3125rem'}
            color={'#94A3B8'}
            fontSize={'12px'}
            bg={'#F7FAFC'}
          >
            💰 {props.type}
          </Center>
        </Td>
        <Td py={'0'}>
          <Center fontSize={'0.75rem'} fontWeight={'600'}>
            <Text mr={'0.395rem'} color={'#94A3B8'}>
              $
            </Text>
            <Text mr={'0.1875rem'} color={'#334254'}>
              {data.amount}
            </Text>
            <Text color={'#94A3B8'}>USD</Text>
          </Center>
        </Td>
        <Td py={'0'}>
          <Center alignItems={'center'} columnGap="0.9688rem">
            <Box w={'1rem'} h="1rem" mb={'0.1563rem'}>
              <Image
                width={'100%'}
                height={'100%'}
                src={'/assets/icons/time.svg'}
                alt=""
              />
            </Box>
            <Text color={'#94A3B8'} fontSize={'0.75rem'} fontWeight={'600'}>
              {data.deadline}
            </Text>
          </Center>
        </Td>
        <Td py={'0'}>
          <Center columnGap={'1.5625rem'}>
            <Button
              onClick={() => {
                router.push(
                  `/listings/create?type=${(
                    props.type as string
                  ).toLowerCase()}&draft=${props.id}`
                );
              }}
              variant={'unstyled'}
            >
              <EditIcon color={'gray.400'} />
            </Button>
            <Button
              w="9.0625rem"
              h="2.25rem"
              p="1rem 2rem"
              color="gray.400"
              fontSize="0.875rem"
              fontWeight={500}
              leftIcon={<DeleteIcon />}
              variant="outline"
            >
              Delete Draft
            </Button>
          </Center>
        </Td>
      </Tr>
    </Tbody>
  );
};

const DraftHeader = () => {
  return (
    <>
      <Thead>
        <Tr>
          <Th w={'25%'} py={'0.6875rem'}>
            <Text
              color="gray.300"
              fontSize="0.875rem"
              fontWeight={600}
              casing={'capitalize'}
            >
              Name
            </Text>
          </Th>
          <Th
            w={'10rem'}
            color="gray.300"
            fontSize="0.875rem"
            fontWeight={600}
            textAlign={'center'}
          >
            <Text casing={'capitalize'}>Type</Text>
          </Th>
          <Th
            color="gray.300"
            fontSize="0.875rem"
            fontWeight={600}
            textAlign={'center'}
          >
            <Text casing={'capitalize'}>Prize</Text>
          </Th>
          <Th color="gray.300" fontSize="0.875rem" fontWeight={600}>
            <Text textAlign={'center'} casing={'capitalize'}>
              Deadline
            </Text>
          </Th>
          <Th
            w={'9.375rem'}
            color="gray.300"
            fontSize="0.875rem"
            fontWeight={600}
          >
            <Text textAlign={'center'} casing={'capitalize'}></Text>
          </Th>
          <Th w={'1rem'}></Th>
        </Tr>
      </Thead>
    </>
  );
};

function Drafts() {
  const { currentSponsor } = SponsorStore();

  const SponsorData = tanQuery({
    queryKey: ['listing', currentSponsor?.id || ''],
    queryFn: ({ queryKey }) => findSponsorDrafts(queryKey[1] || ''),
  });

  const drafts = SponsorData.data;

  return (
    <DashboardLayout>
      {!SponsorData.isSuccess ? (
        <Center h={'85vh'} outline={'1px'}>
          <Spinner
            color="blue.500"
            emptyColor="gray.200"
            size="xl"
            speed="0.65s"
            thickness="4px"
          />
        </Center>
      ) : (
        <Box w={'100%'} px={'2.1875rem'} py={'1.125rem'}>
          <DashboardHeader />
          <Box>
            <Text fontSize={'1.25rem'} fontWeight={'600'}>
              💼 Drafts
            </Text>
            <Text mt={'5px'} color={'#94A3B8'} fontSize={'1.125rem'}>
              Here are all the drafts made by your company
            </Text>
          </Box>
          {!(drafts.length > 0) ? (
            <Text
              mt={'15px'}
              color={'#94A3B8'}
              fontSize={'20px'}
              fontWeight={'400'}
            >
              You don&apos;t have any draft listings at the moment. Get started
              by creating a bounty, grant, or job
              <Link color={'blue'} href="/listings/create">
                {' '}
                here
              </Link>
              .
            </Text>
          ) : (
            <Box
              w="100%"
              mt={'36px'}
              bg="white"
              shadow="0px 4px 4px rgba(219, 220, 221, 0.25)"
            >
              <Table size={'lg'} variant="simple">
                <DraftHeader />
                {drafts.map(({ basic, type, id }: BasicType, idx: number) => {
                  return (
                    <DraftBody
                      id={id}
                      key={`d${idx}`}
                      type={type}
                      basic={basic}
                    />
                  );
                })}
              </Table>
            </Box>
          )}
        </Box>
      )}
    </DashboardLayout>
  );
}

export default Drafts;
