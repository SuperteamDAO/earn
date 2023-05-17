import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Image,
  Input,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import { useForm } from 'react-hook-form';
import { Toaster } from 'react-hot-toast';

import type { SponsorType } from '../../interface/sponsor';
import DashboardLayout from '../../layouts/dashboardLayout';
import { SponsorStore } from '../../store/sponsor';
import { createSponsor, findTeam } from '../../utils/functions';
import { genrateuuid } from '../../utils/helpers';

const TeamDashboard = () => {
  const { currentSponsor } = SponsorStore();
  const queryClient = useQueryClient();
  const Team = useQuery({
    queryKey: ['team', currentSponsor?.id],
    queryFn: ({ queryKey }) => findTeam(queryKey[1] as string),
  });
  const createMemberMutation = useMutation({
    mutationFn: createSponsor,
    onSuccess: () => {
      queryClient.invalidateQueries(['team', currentSponsor?.id], {
        exact: true,
      });
    },
  });

  // const deleteMemberMutation = useMutation({
  //   mutationFn: DeleteSponsor,
  //   onSuccess: () => {
  //     toast.success('Successfully Removed');

  //     queryClient.invalidateQueries(['team', currentSponsor?.id], {
  //       exact: true,
  //     });
  //   },

  //   onError: () => {
  //     toast.error('Error');
  //   },
  // });
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const createMember = async (name: string) => {
    const sponsor: SponsorType = {
      ...(currentSponsor as SponsorType),
      slug: name as string,
      id: genrateuuid(),
    };
    createMemberMutation.mutate(sponsor);
  };

  return (
    <>
      <DashboardLayout>
        <Box w={'full'} fontFamily={'Inter'}>
          <Text mt="4rem" color="gray.800" fontSize="1.3rem" fontWeight={600}>
            Team Members
          </Text>
          <Text mb={5} color="gray.400" fontSize="1rem" fontWeight={500}>
            Invite your team members to co-create listings with you on Superteam
            Earn
          </Text>
          <Flex justify={'space-between'} gap={10} pr={10}>
            <Skeleton w={'60%rem'} isLoaded={!Team.isLoading}>
              <TableContainer w={'100%'}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>
                        <Text
                          color="gray.300"
                          fontSize="0.9rem"
                          fontWeight={600}
                        >
                          Name
                        </Text>
                      </Th>
                      <Th>
                        <Text
                          color="gray.300"
                          fontSize="0.9rem"
                          fontWeight={600}
                        >
                          Email
                        </Text>
                      </Th>
                      <Th>
                        <Text
                          color="gray.300"
                          fontSize="0.9rem"
                          fontWeight={600}
                        >
                          Role
                        </Text>
                      </Th>
                      <Th>
                        <Text
                          color="gray.300"
                          fontSize="0.9rem"
                          fontWeight={600}
                        >
                          Actions
                        </Text>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Team.data?.map((el: SponsorType) => {
                      return (
                        <Tr key={el.id}>
                          <Td w="16rem">
                            <Flex align={'center'} gap={2}>
                              {!el.logo ? (
                                <Avatar />
                              ) : (
                                <Image w={8} alt={'logo'} src={el.logo} />
                              )}
                              <Text
                                color={'gray.800'}
                                fontSize={'14px'}
                                fontWeight="500"
                              >
                                {el?.slug}
                              </Text>
                            </Flex>
                          </Td>
                          {/* <Td>
                            <Text
                              w={'4.5rem'}
                              p={2}
                              color={'gray.500'}
                              fontSize="12px"
                              fontWeight={500}
                              textAlign="center"
                              bg="#F1F5F9"
                              borderRadius={'10px'}
                            >
                              {el.type}
                            </Text>
                          </Td>
                          <Td>
                            {el.type === 'Admin' && (
                              <Button isDisabled={true} variant={'ghost'}>
                                <DeleteIcon />
                              </Button>
                            )}
                            {el.type === 'Member' && (
                              <Button
                                isDisabled={currentSponsor?.type !== 'Admin'}
                                isLoading={deleteMemberMutation.isLoading}
                                onClick={() => {
                                  deleteMemberMutation.mutate(el.id as string);
                                }}
                                variant={'ghost'}
                              >
                                <DeleteIcon />
                              </Button>
                            )}
                          </Td> */}
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Skeleton>
            <Flex direction="column" w={'25rem'} p={4} rounded={'lg'}>
              <Text mb={5} color={'gray.500'} fontSize="16px" fontWeight={600}>
                Add a New Member
              </Text>
              <form
                onSubmit={handleSubmit(async (e) => {
                  Team.data.map(async () => {
                    await createMember(e.name);
                    return null;
                  });
                })}
              >
                <Toaster />
                <Flex
                  direction={'column'}
                  gap={2}
                  w={'full'}
                  px={7}
                  bg={'white'}
                  rounded={'md'}
                >
                  <FormControl isRequired>
                    <Box my={2} fontSize="14px">
                      <Text mb="3" color={'gray.400'}>
                        Enter their name
                      </Text>
                      <Input
                        {...register('name')}
                        w={'full'}
                        color={'gray.700'}
                        fontSize="14px"
                        id={'name'}
                        placeholder="Name"
                      />
                      <FormErrorMessage>
                        {errors.name ? <>{errors.name.message}</> : <></>}
                      </FormErrorMessage>
                    </Box>
                  </FormControl>
                  <FormControl isRequired>
                    <Box mt={2} mb={2} fontSize="14px">
                      <Text mb="3" color={'gray.400'}>
                        Enter their email
                      </Text>
                      <Input
                        {...register('email')}
                        w={'full'}
                        color={'gray.700'}
                        fontSize="14px"
                        id={'email'}
                        placeholder="Email"
                      />
                      <FormErrorMessage>
                        {errors.email ? <>{errors.email.message}</> : <></>}
                      </FormErrorMessage>
                    </Box>
                  </FormControl>
                  <FormControl isRequired>
                    <Box mt={2} mb={2} color={'gray.700'} fontSize="14px">
                      <Text mb="3" color={'gray.400'}>
                        Enter their wallet address
                      </Text>
                      <Input
                        w={'full'}
                        color={'gray.700'}
                        fontSize="14px"
                        {...register('address')}
                        id={'address'}
                        placeholder="walletAddress"
                      />
                      <FormErrorMessage>
                        {errors.address ? <>{errors.address.message}</> : <></>}
                      </FormErrorMessage>
                    </Box>
                  </FormControl>
                  <Button
                    w={'full'}
                    py={4}
                    color={'white'}
                    fontSize="14px"
                    fontWeight={500}
                    bg="#6562FF"
                    borderRadius={'4px'}
                    _hover={{
                      bg: '#6562FF',
                    }}
                    isLoading={createMemberMutation.isLoading}
                    type="submit"
                  >
                    Send Invite
                  </Button>
                  <Box w="full" h={'max'} mb={5} bg={'#F4F3FF'} rounded={'md'}>
                    <Text
                      p={4}
                      color={'#3F3DA1'}
                      fontSize="11px"
                      fontWeight={400}
                    >
                      Note: All Team Members can create and fund bounties, but
                      only Admins can add or remove Team Members
                    </Text>
                  </Box>
                </Flex>
              </form>
            </Flex>
          </Flex>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default TeamDashboard;
